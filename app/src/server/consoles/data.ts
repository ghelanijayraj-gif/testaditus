import "server-only";
import type { HealthProvider, Prisma, Report } from "@prisma/client";
import { prisma } from "@/server/db";
import { clientScope } from "@/server/auth/guards";
import { now } from "@/lib/clock";
import { dateLong, dayLabel, timeLabel } from "@/lib/format";
import { DEFAULT_PHASES, EXTRA_TESTS, SECTIONS, foldMeasures, fmtV, groupLabel, type MeasureRow, type Phase, type TestDef } from "@/components/staff/consoles/lib";
import type { ConsoleCtx } from "./access";

export const CONSOLE_SESSION_TYPES = ["IN_PERSON_ASSESSMENT", "MOVEMENT_ASSESSMENT", "ASSESSMENT", "LIVE_VIDEO", "BREATH_SESSION", "REASSESSMENT"] as const;

export async function loadBank(): Promise<TestDef[]> {
  const rows = await prisma.testDefinition.findMany({ where: { active: true }, orderBy: { order: "asc" } });
  return rows.map((t) => ({
    key: t.key, system: t.system, name: t.name, howTo: t.howTo, unit: t.unit, inputType: t.inputType, direction: t.direction, tag: t.tag,
    availability: t.availability, onlineTag: t.onlineTag, choices: t.choices, sided: t.sided, flagDiff: t.flagDiff, min: t.min, max: t.max, step: t.step,
  }));
}

export const toRow = (m: Prisma.MeasureValueGetPayload<object>): MeasureRow => ({
  testKey: m.testKey, side: m.side, value: m.value, text: m.text, notTested: m.notTested, skipReason: m.skipReason, priority: m.priority, observation: m.observation, note: m.note, tag: m.tag, source: m.source,
});

export const isOnline = (a: { format: string; online: boolean }) => a.online || a.format === "LIVE_ONLINE";

/** Today 7:12 PM / Mon 5 Oct 7:12 PM */
export function whenLabel(d: Date) {
  const today = dayLabel(d) === dayLabel(now());
  return `${today ? "today" : dayLabel(d)} ${timeLabel(d)}`;
}

export function hoursLeft(due: Date) {
  return Math.max(0, Math.ceil((due.getTime() - now().getTime()) / 3_600_000));
}

/** Phases stored on the assessment, or the default list when the session has not started. */
export function readPhases(raw: unknown): Phase[] {
  const arr = Array.isArray(raw) ? (raw as Partial<Phase>[]) : [];
  if (!arr.length) return DEFAULT_PHASES.map((p) => ({ ...p, state: "PENDING" }));
  return arr.map((p, i) => ({ key: String(p.key ?? DEFAULT_PHASES[i]?.key ?? i), label: String(p.label ?? ""), state: (p.state as Phase["state"]) ?? "PENDING", line: String(p.line ?? "") }));
}

const PROVIDER: Record<HealthProvider, string> = { APPLE_HEALTH: "Apple Health", GOOGLE_HEALTH_CONNECT: "Health Connect", GARMIN: "Garmin", WHOOP: "Whoop", OURA: "Oura", SMART_SCALE: "Smart scale" };

/** Flatten intake answers into a short line. Shapes: { groups: { question: [answers] } } or flat fields. */
function answersLine(a: unknown, prefer: string[] = []): string {
  if (!a || typeof a !== "object") return "";
  const o = a as Record<string, unknown>;
  if (o.groups && typeof o.groups === "object") {
    return Object.entries(o.groups as Record<string, unknown>)
      .sort(([a], [b]) => Number(/^(hours|days|a typical)/i.test(b)) - Number(/^(hours|days|a typical)/i.test(a)))
      .map(([q, v]) => {
        const ans = ([] as unknown[]).concat(v ?? []).filter((x) => typeof x === "string" || typeof x === "number").join(", ");
        if (!ans) return "";
        if (/hours sitting/i.test(q)) return `${ans} h sitting`;
        if (/^hours/i.test(q)) return `${ans} h`;
        if (/days/i.test(q)) return `${ans} days a week`;
        if (/wake/i.test(q)) return `wakes ${ans.toLowerCase()}`;
        return ans;
      })
      .filter(Boolean)
      .slice(0, 3)
      .join(" · ");
  }
  const keys = [...prefer.filter((k) => k in o), ...Object.keys(o).filter((k) => !prefer.includes(k))];
  const parts: string[] = [];
  for (const k of keys) {
    const v = o[k];
    if (v == null || v === "") continue;
    if (Array.isArray(v)) parts.push(v.filter((x) => typeof x === "string" || typeof x === "number").join(", "));
    else if (typeof v === "string" || typeof v === "number") parts.push(String(v) + (k === "hours" ? " h" : k === "level" ? " of 10" : ""));
    if (parts.length >= 3) break;
  }
  return parts.filter(Boolean).join(" · ");
}

/** Suggested tests from goals and flags: tests related to what the client marked. */
const REGION_TESTS: Record<string, string[]> = {
  knee: ["knee", "hipIR", "squat", "balance"],
  hipflex: ["hipIR", "hipER", "squat"],
  glute: ["hipIR", "hipER", "squat"],
  lowback: ["tspine", "overhead", "plank"],
  foot: ["ankle", "foot", "balance"],
  calf: ["ankle", "balance"],
  achilles: ["ankle", "balance"],
  shin: ["ankle", "balance"],
  delt: ["overhead", "tspine"],
  trap: ["overhead", "tspine"],
  neck: ["tspine", "pattern"],
  uppback: ["tspine", "overhead"],
};

// ───────────────────────────── Practitioner console (10) ─────────────────────────────

export async function loadPractitioner(assessmentId: string) {
  const a = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      client: { include: { user: true, consents: true, intake: true, safetyFlags: true, bodyConcerns: true, injuries: true, documents: { where: { source: "CLIENT" }, orderBy: { createdAt: "desc" } }, healthSources: true } },
      values: true,
    },
  });
  if (!a) return null;
  const c = a.client;
  const online = isOnline(a);
  const [bank, session, practitioner, earlier, samples, media, report] = await Promise.all([
    loadBank(),
    prisma.session.findFirst({
      where: { clientId: c.id, OR: [{ assessmentId: a.id }, { type: { in: [...CONSOLE_SESSION_TYPES] }, status: { notIn: ["CANCELLED", "RESCHEDULED"] } }] },
      include: { centre: true },
      orderBy: [{ startsAt: "desc" }],
    }),
    a.practitionerId ? prisma.staffProfile.findUnique({ where: { id: a.practitionerId }, include: { user: true } }) : null,
    prisma.assessment.findFirst({ where: { clientId: c.id, id: { not: a.id }, releasedAt: { not: null } }, orderBy: { releasedAt: "desc" } }),
    prisma.healthSample.findMany({ where: { clientId: c.id }, orderBy: { date: "desc" }, take: 60 }),
    prisma.mediaAsset.findMany({ where: { clientId: c.id, capturedBy: "STAFF", supersededById: null, kind: "PHOTO" }, orderBy: { capturedAt: "desc" } }),
    findReport(a.id, c.id),
  ]);
  // Prefer the session linked to this assessment.
  const linked = (await prisma.session.findFirst({ where: { assessmentId: a.id }, include: { centre: true } })) ?? session;
  const first = c.firstName;
  const name = `${c.firstName} ${c.lastName}`;
  const when = linked?.startsAt ?? a.date;
  const sessionType = linked?.title && linked.title !== "In person session" ? linked.title : online ? "Live video session" : a.kind === "REASSESSMENT" ? "Reassessment" : "Movement Assessment";
  const remote = !linked && a.format === "ONLINE";
  const ctxLine = remote
    ? `${name} · Online Assessment · ${dayLabel(a.submittedAt ?? a.date)}, ${timeLabel(a.submittedAt ?? a.date)} · Online Capture`
    : `${name} · ${sessionType} · ${dayLabel(when)}, ${timeLabel(when)} · ${online ? "Live online" : linked?.centre?.name ?? "In person"}`;
  const consentOn = c.consents.some((x) => (x.kind === "PHOTOS_VIDEOS" || x.kind === "ASSESSMENT_MEDIA") && x.granted) && !c.consents.some((x) => x.kind === "PHOTOS_VIDEOS" && !x.granted);

  // Brief.
  const sec = (k: string) => c.intake.find((s) => s.key === k)?.answers as Record<string, unknown> | undefined;
  const goals = sec("goals") ?? {};
  const goalText = String(goals.text ?? goals.words ?? goals.own ?? goals.goal ?? "");
  const goalGroups = goals.groups && typeof goals.groups === "object" ? Object.values(goals.groups as Record<string, unknown>).flat() : [];
  const goalChips = ([] as unknown[]).concat(goals.picked ?? goals.goals ?? goals.chips ?? [], goalGroups).filter((x): x is string => typeof x === "string");
  const concerns = c.bodyConcerns.map((b) => ({ region: b.region, name: b.region.includes(":") ? groupLabel(b.region) : b.region, v: b.intensity, w: b.when.join(", ") }));
  const sleep = sec("sleep");
  const stress = sec("stress");
  const activity = sec("activity");
  const sleepLine = answersLine(sleep, ["hours", "bedtime", "wake"]);
  const stressLine = answersLine(stress, ["level", "workload", "sitting"]);
  const connected = c.healthSources.filter((h) => h.status === "CONNECTED");
  const latest = (re: RegExp) => samples.find((s) => re.test(s.metric));
  const rhr = latest(/rhr|resting/i);
  const slp = latest(/sleep/i);
  const healthLine = connected.length
    ? [connected.map((h) => PROVIDER[h.provider]).join(", "), [rhr ? `RHR ${Math.round(rhr.value)}` : "", slp ? `sleep ${slp.value.toFixed(1)} h` : ""].filter(Boolean).join(", ")].filter(Boolean).join(" · ")
    : "Not connected";
  const facts: { k: string; v: string; docs?: { id: string; title: string }[] }[] = [
    { k: "Sleep", v: sleepLine || "Not answered" },
    { k: "Stress and workload", v: stressLine || "Not answered" },
    { k: "Activity", v: answersLine(activity, ["days", "types", "sports"]) || "Not answered" },
    { k: "Documents", v: c.documents.length ? "" : "None uploaded", docs: c.documents.map((d) => ({ id: d.id, title: d.title })) },
    { k: "Health data", v: healthLine },
    { k: "Earlier assessment", v: earlier ? `${earlier.kind === "BASELINE" ? "Baseline" : "Reassessment"} · ${dateLong(earlier.releasedAt!)}` : "None. This is the baseline." },
  ];
  const injuries = c.injuries.map((i) => [i.description, i.occurredOn ? fmtMonth(i.occurredOn) : "", i.treatmentNote ?? ""].filter(Boolean).join(", "));

  // Suggested tests with the "why" from goals and concerns.
  const why: Record<string, string> = {};
  for (const b of c.bodyConcerns) {
    const g = b.region.split(":").pop() ?? b.region;
    for (const k of REGION_TESTS[g] ?? []) why[k] ??= `From goals and ${(GROUP_SHORT[g] ?? g).toLowerCase()}`;
  }
  const defaultKeys = bank.filter((t) => !EXTRA_TESTS.includes(t.key) && !(online && t.availability === "IN_PERSON")).map((t) => t.key);
  const testKeys = a.testKeys.length ? a.testKeys : defaultKeys;

  const measures = a.values.map(toRow);
  const lastSaved = a.values.filter((v) => v.source === "console").sort((x, y) => y.capturedAt.getTime() - x.capturedAt.getTime())[0];
  const phases = readPhases(a.phases);
  const started = phases.some((p) => p.state !== "PENDING") || a.values.some((v) => v.source === "console");
  const photos = ["front", "side", "back", "left", "right"].map((view) => {
    const m = media.find((x) => x.view === view);
    return { view, label: view[0].toUpperCase() + view.slice(1), id: m?.id ?? null, src: m?.storageKey ? `/staff/media/${m.id}` : null, meta: m ? `Auto labelled · ${dateLong(m.capturedAt)} · ${timeLabel(m.capturedAt)}` : null };
  });

  const bankByKey = Object.fromEntries(bank.map((t) => [t.key, t]));
  const wrap = await loadWrap(report, measures, bankByKey);

  return {
    a: { id: a.id, clientId: c.id, online, kind: a.kind, paused: a.paused, clientMessage: a.clientMessage, testKeys, phases, started, moduleKey: online ? "live" : "inperson" },
    client: { id: c.id, first, name },
    practitionerName: practitioner?.user.name ?? "your practitioner",
    ctxLine,
    consentOn,
    flags: c.safetyFlags.map((f) => ({ item: f.item, note: f.note })),
    injuries,
    bank,
    measures,
    savedAt: lastSaved ? timeLabel(lastSaved.capturedAt) : null,
    checkedIn: linked?.checkedInAt ? timeLabel(linked.checkedInAt) : null,
    brief: { goalText, goalChips, concerns, facts, why },
    photos,
    wrap,
  };
}

const GROUP_SHORT: Record<string, string> = { knee: "Knee", hipflex: "Hip", glute: "Hip", lowback: "Lower back", foot: "Foot", calf: "Calf", achilles: "Achilles", shin: "Shin", delt: "Shoulder", trap: "Neck", neck: "Neck", uppback: "Upper back" };

function fmtMonth(s: string) {
  const m = /^(\d{4})-(\d{2})/.exec(s);
  if (!m) return s;
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${m[1]}-${m[2]}-01T00:00:00Z`));
}

/** The report for an assessment: linked, else the client's latest unreleased one. */
export async function findReport(assessmentId: string, clientId: string) {
  const inc = { findings: { orderBy: { order: "asc" as const } }, comments: { include: { author: { include: { user: true } } }, orderBy: { createdAt: "desc" as const } } };
  return (
    (await prisma.report.findFirst({ where: { assessmentId }, include: inc, orderBy: { createdAt: "desc" } })) ??
    (await prisma.report.findFirst({ where: { clientId, assessmentId: null, status: { not: "RELEASED" } }, include: inc, orderBy: { createdAt: "desc" } }))
  );
}
type ReportFull = NonNullable<Awaited<ReturnType<typeof findReport>>>;

export type WrapCandidate = { key: string; name: string; value: string; picked: boolean; order: number; observed: string; why: string; workOn: string; related: string[] };
export type WrapData = Awaited<ReturnType<typeof loadWrap>>;

/** Wrap up state: candidate priorities (drafts, findings, flagged measures), sections, note, path. */
export async function loadWrap(report: ReportFull | null, measures: MeasureRow[], bank: Record<string, TestDef>) {
  const state = foldMeasures(measures);
  const drafts = report ? await prisma.consoleFindingDraft.findMany({ where: { reportId: report.id } }) : [];
  const cands = new Map<string, WrapCandidate>();
  const nameOf = (k: string) => bank[k]?.name ?? k;
  const valueOf = (k: string) => (bank[k] ? fmtV(bank[k], state[k]) : "");
  for (const d of drafts) cands.set(d.testKey, { key: d.testKey, name: nameOf(d.testKey), value: valueOf(d.testKey), picked: d.picked, order: d.order, observed: d.observed, why: d.whyItMatters, workOn: d.workOn, related: d.related });
  for (const f of report?.findings ?? []) {
    const k = f.measureKeys[0] ?? "f:" + f.id;
    if (cands.has(k)) continue;
    cands.set(k, { key: k, name: f.title, value: valueOf(k), picked: true, order: f.order, observed: f.observed, why: f.whyItMatters, workOn: f.workOn, related: f.related });
  }
  for (const [k, s] of Object.entries(state)) {
    if (!s.flag || cands.has(k) || !bank[k]) continue;
    cands.set(k, { key: k, name: nameOf(k), value: valueOf(k), picked: false, order: 99, observed: "", why: "", workOn: "", related: [] });
  }
  const list = [...cands.values()].sort((x, y) => Number(y.picked) - Number(x.picked) || x.order - y.order);
  const sections = (report?.sections ?? {}) as Record<string, string>;
  const returnedC = report?.status === "RETURNED" ? report.comments.find((c) => c.action === "RETURNED") : null;
  return {
    reportId: report?.id ?? null,
    status: report?.status ?? "DRAFT",
    authorId: report?.authorId ?? null,
    returned: returnedC ? { when: whenLabel(returnedC.createdAt), body: returnedC.body, by: returnedC.author.user.name ?? "the head coach" } : null,
    candidates: list,
    sections: Object.fromEntries(SECTIONS.map((s) => [s.key, String(sections[s.key] ?? "")])),
    startingPoint: report?.startingPoint ?? "",
    note: report?.practitionerNote ?? "",
    path: report?.recommendedPath ?? null,
    reason: report?.pathReason ?? "",
    // Measures that could become a priority (captured, not yet a candidate).
    addable: Object.entries(state).filter(([k, s]) => bank[k] && !cands.has(k) && (s.v != null || s.L != null || s.R != null || s.t)).map(([k]) => ({ key: k, name: nameOf(k) })),
  };
}

// ───────────────────────────── Head coach review (10) ─────────────────────────────

const REPORT_WHAT = (r: Pick<Report, "kind">, format?: string | null) =>
  r.kind === "REASSESSMENT" ? "Reassessment report" : `Assessment report · ${format === "ONLINE" ? "online" : format === "LIVE_ONLINE" ? "live online" : "baseline"}`;

export async function loadReviewQueue(ctx: ConsoleCtx) {
  const rows = await prisma.report.findMany({
    where: { client: clientScope(ctx), OR: [{ status: { in: ["PENDING_APPROVAL", "RETURNED"] } }, { status: "RELEASED", releasedAt: { gte: new Date(now().getTime() - 30 * 86_400_000) } }] },
    include: { client: true, author: { include: { user: true } }, assessment: true },
  });
  const rank = { PENDING_APPROVAL: 0, RETURNED: 1, RELEASED: 2, DRAFT: 3 } as const;
  rows.sort((x, y) => rank[x.status] - rank[y.status] || (y.submittedAt?.getTime() ?? 0) - (x.submittedAt?.getTime() ?? 0));
  return rows.map((r) => {
    const at = r.status === "RELEASED" ? r.releasedAt : r.submittedAt;
    return {
      id: r.id,
      client: `${r.client.firstName} ${r.client.lastName}`,
      what: REPORT_WHAT(r, r.assessment?.format),
      coach: r.author?.user.name ?? "·",
      when: at ? (dayLabel(at) === dayLabel(now()) ? `Today ${timeLabel(at)}` : dayLabel(at)) : "·",
      status: r.status === "PENDING_APPROVAL" ? "Waiting" : r.status === "RETURNED" ? "Returned" : r.status === "RELEASED" ? "Released" : "Draft",
      due: r.status === "PENDING_APPROVAL" && r.dueAt ? `${hoursLeft(r.dueAt)} h left` : null,
    };
  });
}

/** Media for a client, newest non superseded per view; photos as five standard views plus extras. */
export async function clientMedia(clientId: string, moduleKeys?: string[]) {
  const rows = await prisma.mediaAsset.findMany({ where: { clientId, supersededById: null, ...(moduleKeys ? { moduleKey: { in: moduleKeys } } : {}) }, orderBy: { capturedAt: "asc" } });
  return rows.map((m) => ({ id: m.id, kind: m.kind, view: m.view, label: m.label, src: m.storageKey ? `/staff/media/${m.id}` : null, status: m.status, annotations: (Array.isArray(m.annotations) ? m.annotations : []) as Annotation[], capturedAt: m.capturedAt, capturedBy: m.capturedBy, moduleKey: m.moduleKey }));
}
export type Annotation = { type: "PIN" | "PLUMB" | "LEVEL" | "ANGLE"; n?: number; x?: number; y?: number; note?: string; ys?: number[]; deg?: number };

export async function loadReview(reportId: string) {
  const r = await prisma.report.findUnique({
    where: { id: reportId },
    include: { client: { include: { safetyFlags: true, assessments: { orderBy: { date: "desc" }, take: 1 } } }, author: { include: { user: true } }, approver: { include: { user: true } }, findings: { orderBy: { order: "asc" } }, comments: { include: { author: { include: { user: true } } }, orderBy: { createdAt: "desc" } } },
  });
  if (!r) return null;
  const assessmentId = r.assessmentId ?? r.client.assessments[0]?.id ?? null;
  const [bank, values, media, assessment] = await Promise.all([
    loadBank(),
    assessmentId ? prisma.measureValue.findMany({ where: { assessmentId } }) : prisma.measureValue.findMany({ where: { clientId: r.clientId } }),
    clientMedia(r.clientId),
    assessmentId ? prisma.assessment.findUnique({ where: { id: assessmentId } }) : null,
  ]);
  const measures = values.map(toRow);
  const bankByKey = Object.fromEntries(bank.map((t) => [t.key, t]));
  const wrap = await loadWrap(r, measures, bankByKey);
  const notes = values.filter((v) => v.note).map((v) => `${bankByKey[v.testKey]?.name ?? v.testKey}: ${v.note}`);
  const testKeys = assessment?.testKeys.length ? assessment.testKeys : [...new Set(values.map((v) => v.testKey))];
  return {
    report: { id: r.id, status: r.status, submittedAt: r.submittedAt ? whenLabel(r.submittedAt) : null, releasedAt: r.releasedAt ? whenLabel(r.releasedAt) : null, authorId: r.authorId, kind: r.kind },
    client: { id: r.clientId, first: r.client.firstName, name: `${r.client.firstName} ${r.client.lastName}` },
    author: r.author?.user.name ?? "the practitioner",
    approver: r.approver?.user.name ?? null,
    assessmentId,
    online: assessment ? isOnline(assessment) : false,
    flags: r.client.safetyFlags.map((f) => [f.item, f.note].filter(Boolean).join(". ")),
    notes,
    bank,
    testKeys,
    measures,
    findings: r.findings.map((f) => ({ id: f.id, key: f.measureKeys[0] ?? null, system: f.system, order: f.order, title: f.title, observed: f.observed, why: f.whyItMatters, workOn: f.workOn, related: f.related, bodyGroups: f.bodyGroups, marker: f.marker as { view: string; x: number; y: number } | null, value: f.measureKeys[0] && bankByKey[f.measureKeys[0]] ? fmtV(bankByKey[f.measureKeys[0]], foldMeasures(measures)[f.measureKeys[0]]) : "" })),
    media,
    wrap,
    comments: r.comments.map((c) => ({ id: c.id, action: c.action, body: c.body, by: c.author.user.name ?? "", when: whenLabel(c.createdAt) })),
  };
}

// ───────────────────────────── Photo review queue (11) ─────────────────────────────

export type QueueRow = { key: string; clientId: string; client: string; city: string; coach: string; version: "photo" | "video" | "inperson"; status: string; due: string; href: string | null; dueAt: number };

const fmtDue = (d: Date) => `${dayLabel(d)} · ${timeLabel(d)}`;

export async function loadPhotoQueue(ctx: ConsoleCtx) {
  const scope = clientScope(ctx);
  const clients = await prisma.clientProfile.findMany({
    where: { ...scope, stage: { in: ["ONBOARDING", "ASSESSMENT_DAY", "REPORT", "TRAINING"] } },
    include: {
      primaryPractitioner: { include: { user: true } },
      plans: { include: { modules: { where: { removed: false, draft: false } } }, orderBy: { createdAt: "desc" }, take: 1 },
      sessions: { where: { type: { in: [...CONSOLE_SESSION_TYPES] }, status: { in: ["SCHEDULED", "CONFIRMED"] }, startsAt: { gte: new Date(now().getTime() - 6 * 3_600_000) } }, include: { coach: { include: { user: true } } }, orderBy: { startsAt: "asc" } },
      reports: { where: { status: { in: ["DRAFT", "PENDING_APPROVAL", "RETURNED"] } }, include: { author: { include: { user: true } }, assessment: true } },
      assessments: { orderBy: { date: "desc" } },
    },
  });
  const reviews = await prisma.captureReview.findMany({ where: { clientId: { in: clients.map((c) => c.id) } } });
  const rows: QueueRow[] = [];
  for (const c of clients) {
    const name = `${c.firstName} ${c.lastName}`;
    const city = (c.city ?? "").split(",").pop()!.trim();
    const coachP = c.primaryPractitioner?.user.name ?? "·";
    for (const m of c.plans[0]?.modules ?? []) {
      if (m.type !== "CAPTURE" || !["SUBMITTED", "MORE_NEEDED"].includes(m.status)) continue;
      const rv = reviews.find((x) => x.clientId === c.id && x.moduleKey === m.key);
      if (rv?.finishedAt) continue;
      const more = m.status === "MORE_NEEDED";
      const due = m.dueAt ?? (m.submittedAt ? new Date(m.submittedAt.getTime() + 24 * 3_600_000) : null);
      rows.push({
        key: m.id, clientId: c.id, client: name, city, coach: coachP, version: m.key === "gait" ? "video" : "photo",
        status: more ? "More photos needed" : "Ready to review",
        due: more ? `Paused · waiting on ${c.firstName}` : due ? fmtDue(due) : "·",
        href: `/staff/evaluate/${c.id}`,
        dueAt: more ? Number.MAX_SAFE_INTEGER - 1 : due?.getTime() ?? Number.MAX_SAFE_INTEGER,
      });
    }
    for (const s of c.sessions) {
      const a = c.assessments.find((x) => s.assessmentId === x.id) ?? c.assessments[0];
      const live = s.online || s.type === "LIVE_VIDEO";
      rows.push({
        key: s.id, clientId: c.id, client: name, city, coach: s.coach?.user.name ?? coachP, version: live ? "video" : "inperson",
        status: a && s.assessmentId === a.id && readPhases(a.phases).some((p) => p.state === "CURRENT") ? "Assessment in progress" : "Session booked", due: `${fmtDue(s.startsAt)}${live ? " live" : ""}`,
        href: a ? `/staff/practitioner/${a.id}` : null, dueAt: s.startsAt.getTime(),
      });
    }
    for (const r of c.reports) {
      const a = r.assessment ?? c.assessments[0];
      const version = a?.format === "IN_PERSON" ? "inperson" : a?.format === "LIVE_ONLINE" ? "video" : "photo";
      const status = r.status === "PENDING_APPROVAL" ? "Submitted for review" : r.status === "RETURNED" ? "Returned" : "Writing report";
      const href = r.status === "PENDING_APPROVAL" ? `/staff/review/${r.id}` : `/staff/evaluate/${c.id}`;
      rows.push({ key: r.id, clientId: c.id, client: name, city, coach: r.author?.user.name ?? coachP, version, status, due: r.dueAt ? fmtDue(r.dueAt) : "·", href, dueAt: r.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER });
    }
  }
  rows.sort((x, y) => x.dueAt - y.dueAt);
  return rows;
}

export async function loadPhotoReview(clientId: string, moduleKey?: string) {
  const c = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    include: { safetyFlags: true, plans: { include: { modules: true }, orderBy: { createdAt: "desc" }, take: 1 }, assessments: { orderBy: { date: "desc" } }, primaryPractitioner: { include: { user: true } } },
  });
  if (!c) return null;
  const mods = (c.plans[0]?.modules ?? []).filter((m) => m.type === "CAPTURE" && !m.removed);
  const mod = mods.find((m) => m.key === moduleKey) ?? mods.find((m) => m.status === "SUBMITTED") ?? mods.find((m) => m.status === "MORE_NEEDED") ?? mods[0] ?? null;
  const key = mod?.key ?? "capture";
  const assessment = c.assessments.find((a) => a.kind === "BASELINE") ?? c.assessments[0] ?? null;
  const [bank, media, values, selfTests, review, retakes] = await Promise.all([
    loadBank(),
    clientMedia(c.id, [key]),
    prisma.measureValue.findMany({ where: { clientId: c.id, testKey: "squat", ...(assessment ? { assessmentId: assessment.id } : {}) } }),
    prisma.measureValue.findMany({ where: { clientId: c.id, source: "self_test" }, orderBy: { capturedAt: "asc" } }),
    prisma.captureReview.findUnique({ where: { clientId_moduleKey: { clientId: c.id, moduleKey: key } } }),
    prisma.retakeRequest.findMany({ where: { clientId: c.id, resolvedAt: null }, orderBy: { createdAt: "desc" } }),
  ]);
  const due = mod?.dueAt ?? (mod?.submittedAt ? new Date(mod.submittedAt.getTime() + 24 * 3_600_000) : null);
  const more = mod?.status === "MORE_NEEDED";
  const versionName = key === "gait" ? "Video Assessment" : "Photo Assessment";
  return {
    client: { id: c.id, first: c.firstName, name: `${c.firstName} ${c.lastName}` },
    module: mod ? { key: mod.key, name: mod.name, status: mod.status } : null,
    title: `${c.firstName} ${c.lastName} · ${versionName}`,
    dueLine: more ? "More photos needed · due time paused" : due ? `Due ${dayLabel(due)}, ${timeLabel(due)} · ${hoursLeft(due)} h left` : "No due time",
    assessmentId: assessment?.id ?? null,
    flags: c.safetyFlags.map((f) => [f.item, f.note].filter(Boolean).join(". ")),
    bank,
    photos: media.filter((m) => m.kind === "PHOTO"),
    videos: media.filter((m) => m.kind === "VIDEO"),
    selfTests: selfTests.map(toRow),
    squat: values.map(toRow),
    finished: review?.finishedAt ? whenLabel(review.finishedAt) : null,
    retakes: retakes.map((r) => ({ mediaId: r.mediaId, step: r.step })),
  };
}
