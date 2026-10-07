import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { clientScope } from "@/server/auth/guards";
import { now } from "@/lib/clock";
import { dateShort, dayLabel, dayTime } from "@/lib/format";
import { clientInclude, deriveClient, hoursSince, liveModules, planShort, shortCity, staffName, whenLabel, type Ctx } from "./common";

const fileInclude = {
  ...clientInclude,
  intake: true,
  safetyFlags: true,
  bodyConcerns: true,
  injuries: true,
  measures: { include: { test: true }, orderBy: { capturedAt: "desc" } },
  media: { orderBy: { capturedAt: "asc" } },
  documents: { orderBy: { createdAt: "desc" } },
  healthSources: true,
  notes: { orderBy: { createdAt: "desc" }, include: { author: { include: { user: { select: { name: true } } } } } },
  activity: { orderBy: { createdAt: "desc" }, take: 60 },
  accessLog: { orderBy: { createdAt: "desc" } },
  programPhases: { orderBy: { order: "asc" } },
  orders: { orderBy: { placedAt: "desc" } },
  invoices: { orderBy: { issuedAt: "desc" } },
  preferredCentre: true,
  consents: true,
} satisfies Prisma.ClientProfileInclude;

export type ClientFile = Prisma.ClientProfileGetPayload<{ include: typeof fileInclude }>;

export async function loadClientFile(ctx: Ctx, id: string) {
  return prisma.clientProfile.findFirst({ where: { AND: [{ id }, clientScope(ctx)] }, include: fileInclude });
}

export const TABS = [
  ["overview", "Overview"],
  ["plan", "Assessment plan"],
  ["intake", "Intake"],
  ["media", "Media"],
  ["measures", "Measures"],
  ["report", "Report"],
  ["program", "Program"],
  ["schedule", "Schedule"],
  ["documents", "Documents"],
  ["health", "Health data"],
  ["billing", "Billing"],
  ["notes", "Internal notes"],
  ["activity", "Activity log"],
] as const;
export type TabKey = (typeof TABS)[number][0];

const REC: Record<string, string> = { NOT_ELIGIBLE: "Not eligible · outside Mumbai", NOT_SHOWN: "Not shown yet", SHOWN: "Shown", DISMISSED: "Dismissed · online only", WAITING_FOR_PAYMENT: "Waiting for payment", ADDED: "Added", BOOKED: "Added and booked" };

export function facts(c: ClientFile) {
  const d = deriveClient(c);
  const names = [c.primaryPractitioner ? staffName(c.primaryPractitioner) : null, ...c.coaches.map((x) => staffName(x.staff))].filter((x): x is string => !!x && x !== "·");
  const plan = d.activePlan;
  const planL = plan && ["TRAINING", "PLAN_ENDED", "GRACE", "ACCESS_ENDED"].includes(c.stage) ? `${planShort(plan)} · ${plan.sessionsUsed} of ${plan.sessionsTotal} used · ends ${dateShort(plan.endsAt)}` : "Assessment · no training yet";
  return {
    row: d,
    facts: [
      ["Status", d.status],
      ["City", `${shortCity(c.city)} · ${c.inMumbaiArea ? "Mumbai area" : "outside Mumbai"}`],
      ["Recommendation", REC[c.recommendation] ?? "·"],
      ["Practitioners", [...new Set(names)].join(" · ") || "·"],
      ["Modules", d.modulesTotal ? `${d.modulesDone} of ${d.modulesTotal} done` : "No plan yet"],
      ["Plan", planL],
    ] as [string, string][],
  };
}

const lowerFirst = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const tagL = (t: string) => ({ MEASURED: "Measured", OBSERVED: "Observed", SELF_REPORTED: "Self reported" })[t] ?? t;
const firstName = (n: string) => n.replace(/^Coach /, "").split(" ")[0];

/** "6.5 h", "22°", "6 of 10", "14 s". */
export function valueLabel(v: number | null, text: string | null, unit: string) {
  if (v == null) return text ?? "·";
  const n = Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10);
  if (unit === "°") return `${n}°`;
  if (unit === "/10") return `${n} of 10`;
  if (unit === "/3") return `${n} of 3`;
  return unit ? `${n} ${unit}` : n;
}

function answersLabel(key: string, a: Record<string, unknown>) {
  if (key === "goals" && Array.isArray(a.picked)) return (a.picked as string[]).join(" · ");
  if (key === "sleep" && a.hours) return `${a.hours} h${a.bedtime ? ` · bedtime ${a.bedtime}` : ""}`;
  if (key === "stress" && a.level != null) return `${a.level} of 10`;
  if (typeof a.summary === "string") return a.summary;
  const parts: string[] = [];
  for (const v of Object.values(a)) {
    if (typeof v === "string" || typeof v === "number") parts.push(String(v));
    else if (typeof v === "boolean") parts.push(v ? "Yes" : "No");
    else if (Array.isArray(v)) parts.push(v.filter((x) => typeof x === "string" || typeof x === "number").join(", "));
  }
  const s = parts.filter(Boolean).join(" · ");
  return s.length > 180 ? s.slice(0, 177) + "…" : s || "·";
}

const INTAKE_ORDER = ["goals", "activity", "history", "concerns", "injuries", "sleep", "recovery", "stress", "sport", "better", "safety", "agreement"];
const INTAKE_LABEL: Record<string, string> = { goals: "Goals", activity: "Activity", history: "Training history", concerns: "Concerns", injuries: "Injuries", sleep: "Sleep", recovery: "Recovery", stress: "Stress and workload", sport: "Sport", better: "What better looks like", safety: "Safety check", agreement: "Agreement" };

export type KVRow = { k: string; v: string; href?: string };

export function tabRows(tab: TabKey, c: ClientFile): KVRow[] {
  const mods = liveModules(c);
  const viewedBy = (pred: (l: ClientFile["accessLog"][number]) => boolean) => {
    const hits = c.accessLog.filter((l) => l.action === "VIEWED" && pred(l));
    return hits.length ? { who: [...new Set(hits.map((h) => firstName(h.actorName)))].join(", "), at: hits[0].createdAt } : null;
  };
  switch (tab) {
    case "overview": {
      const first = mods.find((m) => ["NOT_STARTED", "IN_PROGRESS", "MORE_NEEDED", "WAITING_FOR_PAYMENT"].includes(m.status));
      const ip = c.sessions.find((s) => s.startsAt >= now() && ["IN_PERSON_ASSESSMENT", "MOVEMENT_ASSESSMENT", "REASSESSMENT", "TRIAL_TRAINING"].includes(s.type) && s.status !== "CANCELLED");
      const next = c.sessions.find((s) => s.startsAt >= now() && s.status !== "CANCELLED" && s.status !== "RESCHEDULED");
      const goals = c.intake.find((i) => i.key === "goals")?.answers as { picked?: string[] } | undefined;
      const hs = c.healthSources.filter((h) => h.status === "CONNECTED");
      const plan = deriveClient(c).activePlan;
      const rows: KVRow[] = [
        { k: "Goal", v: c.goalHeadline ?? goals?.picked?.[0] ?? "·" },
        { k: "Safety", v: c.safetyFlags.length ? c.safetyFlags.map((f) => `${f.item} · ${lowerFirst(f.label)}`).join(" · ") : "No flags" },
        { k: "Next", v: first ? `${first.name}${first.dueAt ? ` due ${dayLabel(first.dueAt)}` : ""}` : next ? `${next.title} ${dayTime(next.startsAt)}` : "Nothing waiting on the client" },
      ];
      if (ip) rows.push({ k: "In person", v: `${dayTime(ip.startsAt)} · ${ip.online ? "Online" : ip.centreId ? centreName(ip.centreId) : "·"} · ${staffName(ip.coach)}` });
      if (plan && c.stage !== "ASSESSMENT_DAY") rows.push({ k: "Training", v: `${planShort(plan)} · ${plan.sessionsUsed} of ${plan.sessionsTotal} used · ends ${dateShort(plan.endsAt)}` });
      rows.push({ k: "Health apps", v: hs.length ? hs.map((h) => `${PROVIDER[h.provider]}${h.lastSyncAt ? ` · synced ${ago(h.lastSyncAt)}` : ""}`).join(" · ") : "None connected" });
      rows.push({ k: "Contact", v: `${c.user.email} · ${c.mobile ?? "no mobile"}` });
      return rows;
    }
    case "intake": {
      const rows: KVRow[] = [...c.intake].sort((a, b) => INTAKE_ORDER.indexOf(a.key) - INTAKE_ORDER.indexOf(b.key)).map((s) => ({ k: INTAKE_LABEL[s.key] ?? s.key, v: s.skipped ? "Skipped" : answersLabel(s.key, (s.answers ?? {}) as Record<string, unknown>) }));
      if (!c.intake.some((s) => s.key === "concerns") && c.bodyConcerns.length) rows.push({ k: "Concerns", v: c.bodyConcerns.map((b) => `${b.region.replace(/^[LR]:/, "")} ${b.side !== "NONE" ? lowerFirst(b.side) : ""} · ${b.intensity} of 10`).join(" · ") });
      for (const inj of c.injuries) rows.push({ k: "Injury", v: `${inj.description}${inj.occurredOn ? ` · ${inj.occurredOn}` : ""}${inj.treatmentNote ? ` · ${inj.treatmentNote}` : ""}` });
      for (const f of c.safetyFlags) rows.push({ k: "Safety flag", v: `${f.item} · ${f.label} · staff only` });
      if (!rows.length) rows.push({ k: "Status", v: c.intakeStep > 0 ? `In progress · step ${c.intakeStep} of 12` : "Not started" });
      return rows;
    }
    case "media": {
      if (withdrawn(c, "PHOTOS_VIDEOS")) return [{ k: "Consent", v: `${c.firstName} has withdrawn consent to store photos and videos.` }];
      const rows: KVRow[] = c.media
        .filter((m) => !m.supersededById)
        .map((m) => {
          const vb = viewedBy((l) => l.resourceId === m.id || l.resourceName.toLowerCase() === m.label.toLowerCase());
          const dur = m.durationS != null ? `${Math.floor(m.durationS / 60)}:${String(m.durationS % 60).padStart(2, "0")}` : null;
          const v = m.kind === "VIDEO" ? `${dur ?? dayLabel(m.capturedAt)} · ${tagL(m.tag)}` : `${dayLabel(m.capturedAt)}${vb ? ` · viewed by ${vb.who}` : ""}`;
          return { k: m.label, v: m.status === "RETAKE_REQUESTED" ? `${v} · retake requested` : v, href: `/api/files/${m.id}?kind=media` };
        });
      if (!rows.length) rows.push({ k: "Media", v: "Nothing uploaded yet" });
      rows.push({ k: "Access", v: "Every view is logged and shown in the client’s access log" });
      return rows;
    }
    case "measures": {
      if (!c.measures.length) return [{ k: "Measures", v: "Nothing captured yet" }];
      const latest = c.measures[0].assessmentId;
      return c.measures
        .filter((m) => m.assessmentId === latest)
        .sort((a, b) => a.test.order - b.test.order || a.side.localeCompare(b.side))
        .map((m) => ({ k: m.side === "NONE" ? m.test.name : `${m.side === "RIGHT" ? "Right" : "Left"} ${lowerFirst(m.test.name)}`, v: m.notTested ? `Not tested${m.skipReason ? ` · ${m.skipReason}` : ""}` : `${valueLabel(m.value, m.text, m.unit)} · ${tagL(m.tag)}` }));
    }
    case "report": {
      const r = c.reports[0];
      const status = !r
        ? "Not started · waits for required modules"
        : r.status === "RELEASED"
          ? `Released · ${dayLabel(r.releasedAt ?? r.createdAt)}`
          : r.status === "PENDING_APPROVAL"
            ? `Pending approval${r.dueAt ? ` · due ${whenLabel(r.dueAt)}` : ""}`
            : r.status === "RETURNED"
              ? "Returned for edits"
              : "Draft · being written";
      const steps = ((r?.nextSteps ?? []) as { name?: string; reason?: string }[]).map((s) => s.name).filter(Boolean) as string[];
      const rec = mods.filter((m) => m.addedBy === "RECOMMENDED").map((m) => `${m.name} · attached by ${m.addedByName ?? "staff"}`);
      const rows: KVRow[] = [{ k: "Status", v: status, href: r && r.status !== "RELEASED" ? `/staff/review/${r.id}` : undefined }];
      rows.push({ k: "Recommended next steps", v: [...steps, ...rec].join(" · ") || "None attached" });
      if (r?.recommendedPath) rows.push({ k: "Recommended path", v: { PERSONAL_TRAINING: "Personal Training", GROUP_TRAINING: "Group Training", EITHER: "Either" }[r.recommendedPath] });
      return rows;
    }
    case "program": {
      const rows: KVRow[] = [];
      const plan = deriveClient(c).activePlan;
      if (plan) {
        rows.push({ k: "Plan", v: `${planShort(plan)} · ${plan.sessionsUsed} of ${plan.sessionsTotal} used` });
        if (plan.currentPhase) rows.push({ k: "Current phase", v: plan.currentPhase });
        if (plan.perWeek) rows.push({ k: "Per week", v: plan.perWeek });
        if (plan.focusAreas.length) rows.push({ k: "Focus", v: plan.focusAreas.join(" · ") });
      }
      for (const p of c.programPhases) {
        rows.push({ k: p.name, v: `${p.focus} · ${lowerFirst(p.weeks)}` });
        for (const e of (p.exercises ?? []) as { name?: string; loading?: string }[]) rows.push({ k: "Loading", v: `${e.name ?? ""} ${e.loading ?? ""}`.trim() });
      }
      if (!rows.length) rows.push({ k: "Program", v: "No program yet" });
      rows.push({ k: "Visible to", v: "Coaches and head coach only" });
      return rows;
    }
    case "schedule": {
      const SL: Record<string, string> = { SCHEDULED: "Booked", CONFIRMED: "Confirmed", DONE: "Done", CANCELLED: "Cancelled", MISSED: "Missed", RESCHEDULED: "Rescheduled" };
      const rows = c.sessions.map((s) => ({ k: dayTime(s.startsAt), v: `${s.title} · ${s.online ? "Online" : s.centreId ? centreName(s.centreId) : "·"} · ${SL[s.status]}`, href: `/staff/schedule?date=${isoOf(s.startsAt)}&session=${s.id}` }));
      return rows.length ? rows : [{ k: "Sessions", v: "Nothing booked" }];
    }
    case "documents": {
      const hidden = withdrawn(c, "HEALTH_DOCUMENTS");
      const rows: KVRow[] = c.documents.filter((d) => !(hidden && d.source === "CLIENT")).map((d) => {
        const vb = viewedBy((l) => l.resourceId === d.id || l.resourceName === d.filename);
        return { k: d.filename, v: `${d.source === "CLIENT" ? "Added by client" : "Added by ADITUS"}${vb ? ` · viewed by ${vb.who} ${dateShort(vb.at)}` : ""}`, href: `/api/files/${d.id}` };
      });
      if (hidden) rows.unshift({ k: "Consent", v: `${c.firstName} has withdrawn consent to store health documents.` });
      return rows.length ? rows : [{ k: "Documents", v: "None uploaded" }];
    }
    case "health": {
      const rows: KVRow[] = [];
      for (const h of c.healthSources) {
        rows.push({ k: PROVIDER[h.provider], v: `${h.status === "CONNECTED" ? "Connected" : h.status === "ERROR" ? "Sync error" : "Not connected"}${h.dataTypes.length ? ` · ${h.dataTypes.map(lowerFirst).join(", ")}` : ""}${h.lastSyncAt ? ` · synced ${ago(h.lastSyncAt)}` : ""}` });
        if (h.sharedWithCoach.length) rows.push({ k: "Shared with coach", v: h.sharedWithCoach.join(" · ") });
      }
      return rows.length ? rows : [{ k: "Health apps", v: "None connected" }];
    }
    case "billing": {
      const rows: KVRow[] = c.orders.map((o) => ({ k: o.number, v: `${o.item} · ${o.amountLabel} · ${o.syncStatus === "SYNCED" ? "Paid" : o.syncStatus === "PENDING" ? "Sync pending" : "Sync failed"}` }));
      for (const i of c.invoices) rows.push({ k: i.number, v: `${i.item} · ${i.amountLabel} · GST ${i.gstRate}% · ${i.status === "PAID" ? "Paid" : i.status === "DUE" ? "Due" : "Overdue"}` });
      return rows.length ? rows : [{ k: "Orders", v: "No orders yet" }];
    }
    case "notes":
      return c.notes.map((n) => ({ k: `${staffName(n.author)} · ${dateShort(n.createdAt)}`, v: n.body }));
    case "activity": {
      const rows = c.activity.map((a) => ({ k: whenLabel(a.createdAt), v: activityLine(a.actorName, a.action, c) }));
      return rows.length ? rows : [{ k: "Activity", v: "Nothing yet" }];
    }
    default:
      return [];
  }
}

/** Explicitly withdrawn (granted false). A missing row means the client never answered; other areas gate uploads on it. */
const withdrawn = (c: ClientFile, kind: "PHOTOS_VIDEOS" | "HEALTH_DOCUMENTS") => c.consents.some((x) => x.kind === kind && !x.granted);

const VERB = /^(Tried|Added|Paid|Sent|Viewed|Assigned|Removed|Confirmed|Rescheduled|Booked|Asked|Generated|Changed|Edited|Approved|Returned|Released|Requested|Uploaded|Submitted|Moved|Updated)\b/;
function activityLine(actor: string, action: string, c: ClientFile) {
  const who = actor === `${c.firstName} ${c.lastName}` ? c.firstName : firstName(actor);
  if (VERB.test(action)) return `${who} ${lowerFirst(action)}`;
  return action;
}

export const PROVIDER: Record<string, string> = { APPLE_HEALTH: "Apple Health", GOOGLE_HEALTH_CONNECT: "Health Connect", GARMIN: "Garmin", WHOOP: "Whoop", OURA: "Oura", SMART_SCALE: "Smart scale" };
const ago = (d: Date) => {
  const h = hoursSince(d);
  if (h < 1) return `${Math.max(1, Math.round((now().getTime() - d.getTime()) / 60000))} min ago`;
  return h < 48 ? `${h} h ago` : dayLabel(d);
};

let centreCache: Map<string, string> | null = null;
export async function primeCentres() {
  const cs = await prisma.centre.findMany();
  centreCache = new Map(cs.map((c) => [c.id, c.name]));
}
function centreName(id: string) {
  return centreCache?.get(id) ?? "Centre";
}
const isoOf = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
