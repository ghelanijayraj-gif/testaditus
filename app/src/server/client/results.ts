import "server-only";
import type { MeasureTag, SystemKey, TestDefinition } from "@prisma/client";
import { prisma } from "@/server/db";
import { dLong, displayUnit, TAG_LABEL, type MeasureDef, type SysId, type TagLabel, type Val } from "@/lib/measures";
import { coverageRows } from "@/lib/assessment/plan";
import type { CoverageRow } from "@/components/shared/CoverageGrid";

/** Results data access (05 Assessment, Reports; 04 reveal). Only RELEASED reports are ever read for the client. */

export const SYS_OF: Record<SystemKey, SysId> = { MOVEMENT: "movement", BREATH: "breathwork", RECOVERY: "recovery", PERFORMANCE: "performance" };
const GAUGE: Record<string, string> = { ribsUpper: "Upper ribs", ribs: "Lower ribs", ribsBack: "Back" };
/** Choice measures whose stored choice order is not worst to best. */
const ORDINAL: Record<string, string[]> = { nasal: ["Not yet", "Partly", "Yes"], pattern: ["Chest led", "Belly led", "360 expansion"] };
const SCALE_MIN: Record<string, number> = { run1k: 240 };
/** Reassessment window opens 8 weeks after the baseline (05: baseline 2 Sep → 28 Oct). */
export const WINDOW_DAYS = 56;

export type Cell = { v: Val; text: string | null; tag: TagLabel; method: string | null; comparable: boolean };
export type Snapshot = {
  assessmentId: string;
  reportId: string;
  kind: "BASELINE" | "REASSESSMENT";
  cycle: number;
  date: Date;
  values: Record<string, Cell>;
  nights: { bed: number; dur: number; date: Date }[];
};
export type Evidence = { id: string; name: string; source: string; date: string };
export type Insight = { observations: { observed: string; why: string }[]; workOn: string | null; related: string | null; evidence: Evidence[] };
export type Note = { text: string; coach: string };

export type ResultsData = {
  client: { id: string; first: string; last: string; name: string };
  coach: string | null;
  defs: MeasureDef[];
  baseline: Snapshot | null;
  reassessments: Snapshot[];
  insights: Record<string, Insight>;
  /** Compare notes per reassessment assessment id. */
  notes: Record<string, { overall: Note | null; sys: Partial<Record<SysId, Note>> }>;
  reDueFrom: Date | null;
  practitioner: string | null;
  hasPlan: boolean;
};

type RawValue = { testKey: string; side: string; value: number | null; text: string | null; unit: string; tag: MeasureTag; method: string | null; comparable: boolean; notTested: boolean };

function buildDef(td: TestDefinition, vals: RawValue[]): MeasureDef {
  const numeric = vals.some((v) => v.value != null);
  const cats = td.inputType === "SCORE_0_3" ? ["0 of 3", "1 of 3", "2 of 3", "3 of 3"] : td.inputType === "CHOICE" && !numeric ? (ORDINAL[td.key] ?? td.choices) : undefined;
  const sides = td.sided || vals.some((v) => v.side !== "NONE");
  const first = vals[0];
  let focus: "L" | "R" = td.focusSide === "LEFT" ? "L" : "R";
  if (!td.focusSide && sides) {
    const l = vals.find((v) => v.side === "LEFT")?.value,
      r = vals.find((v) => v.side === "RIGHT")?.value;
    if (l != null && r != null) focus = (td.direction === "LOWER_BETTER" ? l > r : l < r) ? "L" : "R";
  }
  const maxSeen = Math.max(0, ...vals.map((v) => v.value ?? 0));
  return {
    key: td.key,
    sys: SYS_OF[td.system],
    name: td.name,
    unit: displayUnit(first?.unit ?? td.unit),
    how: first?.method ?? td.howTo,
    tag: TAG_LABEL[first?.tag ?? td.tag],
    dir: td.direction === "LOWER_BETTER" ? "lower" : "higher",
    sides,
    focus,
    min: SCALE_MIN[td.key],
    max: td.scaleMax ?? td.max ?? (cats ? cats.length - 1 : Math.max(1, Math.ceil(maxSeen * 1.25))),
    cats,
    criteria: td.criteria.length ? td.criteria.join(" · ") : undefined,
    isTime: td.inputType === "TIME",
    view: td.bodyView === "back" ? "back" : "front",
    groups: td.bodyGroups,
    gauge: GAUGE[td.key],
  };
}

function cellsOf(defs: Map<string, MeasureDef>, rows: RawValue[]) {
  const out: Record<string, Cell> = {};
  const by = new Map<string, RawValue[]>();
  for (const r of rows) {
    if (r.notTested) continue;
    by.set(r.testKey, [...(by.get(r.testKey) ?? []), r]);
  }
  for (const [key, list] of by) {
    const m = defs.get(key);
    if (!m) continue;
    const num = (r?: RawValue) => (r == null ? null : m.cats && r.value == null ? (r.text != null && m.cats.indexOf(r.text) >= 0 ? m.cats.indexOf(r.text) : null) : r.value);
    let v: Val;
    if (m.sides) v = { L: num(list.find((r) => r.side === "LEFT")), R: num(list.find((r) => r.side === "RIGHT")) };
    else v = num(list.find((r) => r.side === "NONE") ?? list[0]);
    const f = list[0];
    out[key] = { v, text: m.cats ? null : (f.text ?? null), tag: TAG_LABEL[f.tag], method: f.method, comparable: list.every((r) => r.comparable) };
  }
  return out;
}

/** Everything the Assessment page, Reports and the reveal need, for one client. */
export async function getResults(clientId: string): Promise<ResultsData | null> {
  const client = await prisma.clientProfile.findUnique({ where: { id: clientId }, include: { coaches: { include: { staff: { include: { user: true } } } } } });
  if (!client) return null;
  const reports = await prisma.report.findMany({
    where: { clientId, status: "RELEASED", assessmentId: { not: null } },
    include: { assessment: { include: { values: true } } },
    orderBy: { releasedAt: "asc" },
  });
  const base = reports.find((r) => r.kind === "BASELINE" && r.assessment);
  const res = reports.filter((r) => r.kind === "REASSESSMENT" && r.assessment).sort((a, b) => a.assessment!.date.getTime() - b.assessment!.date.getTime());
  const shown = [base, ...res].filter(Boolean) as typeof reports;

  const keys = new Set<string>();
  for (const r of shown) {
    r.assessment!.testKeys.forEach((k) => keys.add(k));
    r.assessment!.values.forEach((v) => keys.add(v.testKey));
  }
  const tds = await prisma.testDefinition.findMany({ where: { key: { in: [...keys] } }, orderBy: { order: "asc" } });
  const allVals = shown.flatMap((r) => r.assessment!.values);
  const defs = tds.map((td) => buildDef(td, allVals.filter((v) => v.testKey === td.key && !v.notTested)));
  const defMap = new Map(defs.map((d) => [d.key, d]));

  const nights = await prisma.sleepNight.findMany({ where: { assessmentId: { in: shown.map((r) => r.assessmentId!) } }, orderBy: { date: "asc" } });
  const snap = (r: (typeof reports)[number]): Snapshot => ({
    assessmentId: r.assessmentId!,
    reportId: r.id,
    kind: r.kind,
    cycle: r.assessment!.cycle,
    date: r.assessment!.date,
    values: cellsOf(defMap, r.assessment!.values),
    nights: nights.filter((n) => n.assessmentId === r.assessmentId).map((n) => ({ bed: n.bedtimeHour, dur: n.durationH, date: n.date })),
  });

  const [ins, docs, notes, plans] = await Promise.all([
    prisma.measureInsight.findMany({ where: { clientId } }),
    prisma.document.findMany({ where: { clientId, status: "READY" } }),
    prisma.coachNote.findMany({ where: { clientId, assessmentId: { in: res.map((r) => r.assessmentId!) } } }),
    prisma.clientPlan.count({ where: { clientId } }),
  ]);
  const docUI = (d: (typeof docs)[number]): Evidence => ({ id: d.id, name: d.title, source: d.source === "CLIENT" ? "Added by you" : "Shared by ADITUS", date: dLong(d.testDate ?? d.createdAt) });
  const insights: Record<string, Insight> = {};
  for (const k of keys) {
    const i = ins.find((x) => x.testKey === k);
    const ev: Evidence[] = [];
    for (const ref of i?.evidenceDocIds ?? []) {
      const d = ref.startsWith("title:") ? docs.find((x) => x.title === ref.slice(6)) : docs.find((x) => x.id === ref);
      if (d && !ev.some((e) => e.id === d.id)) ev.push(docUI(d));
    }
    for (const d of docs.filter((x) => x.linkedMeasureKey === k)) if (!ev.some((e) => e.id === d.id)) ev.push(docUI(d));
    insights[k] = { observations: ((i?.observations as { observed: string; why: string }[]) ?? []).filter((o) => o?.observed), workOn: i?.workOn ?? null, related: i?.relatedLabel ?? null, evidence: ev };
  }
  const noteMap: ResultsData["notes"] = {};
  for (const r of res) {
    const list = notes.filter((n) => n.assessmentId === r.assessmentId);
    const o = list.find((n) => n.scope === "overall");
    const sys: Partial<Record<SysId, Note>> = {};
    for (const n of list) if (n.system && n.scope !== "overall") sys[SYS_OF[n.system]] = { text: n.text, coach: n.coachName };
    noteMap[r.assessmentId!] = { overall: o ? { text: o.text, coach: o.coachName } : null, sys };
  }
  const pt = client.coaches.find((c) => c.role === "PERSONAL_TRAINING") ?? client.coaches.find((c) => c.role !== "ASSESSMENT");
  let practitioner: string | null = null;
  if (base?.assessment?.practitionerId) practitioner = (await prisma.staffProfile.findUnique({ where: { id: base.assessment.practitionerId }, include: { user: true } }))?.user.name ?? null;
  const baseline = base ? snap(base) : null;
  return {
    client: { id: client.id, first: client.firstName, last: client.lastName, name: `${client.firstName} ${client.lastName}` },
    coach: pt?.staff.user.name ?? null,
    defs,
    baseline,
    reassessments: res.map(snap),
    insights,
    notes: noteMap,
    reDueFrom: baseline ? new Date(baseline.date.getTime() + WINDOW_DAYS * 86_400_000) : null,
    practitioner,
    hasPlan: plans > 0,
  };
}

/** Does this client have a released baseline report? (Before that, /assessment shows the plan.) */
export async function hasReleasedBaseline(clientId: string) {
  return (await prisma.report.count({ where: { clientId, kind: "BASELINE", status: "RELEASED" } })) > 0;
}

const staffName = async (id: string | null | undefined) => (id ? ((await prisma.staffProfile.findUnique({ where: { id }, include: { user: true } }))?.user.name ?? null) : null);

export type ReportListItem = { id: string; type: string; meta: string; kind: "BASELINE" | "REASSESSMENT"; cycle: number; releasedAt: Date };

export const reportType = (kind: "BASELINE" | "REASSESSMENT", cycle: number) => (kind === "BASELINE" ? "Assessment report" : cycle > 1 ? `Reassessment ${cycle} report` : "Reassessment report");

export async function listReports(clientId: string): Promise<ReportListItem[]> {
  const reports = await prisma.report.findMany({ where: { clientId, status: "RELEASED" }, include: { assessment: true }, orderBy: { releasedAt: "asc" } });
  const out: ReportListItem[] = [];
  for (const r of reports) {
    const cycle = r.assessment?.cycle ?? 1;
    const who = (await staffName(r.assessment?.practitionerId)) ?? (await staffName(r.authorId));
    const date = r.assessment?.date ?? r.releasedAt ?? r.createdAt;
    const meta = [r.kind === "BASELINE" ? "Baseline" : null, dLong(date), who, r.releasedAt ? "released " + dLong(r.releasedAt) : null].filter(Boolean).join(" · ");
    out.push({ id: r.id, type: reportType(r.kind, cycle), meta, kind: r.kind, cycle, releasedAt: r.releasedAt ?? r.createdAt });
  }
  return out;
}

export type ReportSections = { workOn?: string[]; pathTitle?: string; systems?: Partial<Record<SysId, string>>; mattersMost?: number; noteBy?: string };
export type MarkerPos = { view: "front" | "back"; x: number; y: number };

/** One released report of this client, with findings and people. Null when missing or not released. */
export async function getReport(clientId: string, reportId: string) {
  const r = await prisma.report.findFirst({ where: { id: reportId, clientId, status: "RELEASED" }, include: { findings: { orderBy: { order: "asc" } }, assessment: true } });
  if (!r) return null;
  const [practitioner, approver, author] = await Promise.all([staffName(r.assessment?.practitionerId), staffName(r.approverId), staffName(r.authorId)]);
  const sections = { ...((r.sections ?? {}) as ReportSections) };
  // Reports written in the practitioner console carry "What we would work on" per finding
  // (and the seven practitioner sections), not a separate list: derive it for the client view.
  if (!sections.workOn?.length) sections.workOn = r.findings.map((f) => f.workOn).filter(Boolean);
  const findings = r.findings.map((f) => {
    const raw = f.marker as unknown;
    let markers: MarkerPos[] = [];
    if (Array.isArray(raw)) markers = raw as MarkerPos[];
    else if (raw && typeof raw === "object" && "view" in (raw as object)) markers = [raw as MarkerPos];
    else if (raw && typeof raw === "object") for (const [view, p] of Object.entries(raw as Record<string, [number, number]>)) if (Array.isArray(p)) markers.push({ view: view as "front" | "back", x: p[0], y: p[1] });
    return { id: f.id, order: f.order, sys: SYS_OF[f.system], title: f.title, key: f.measureKeys[0] ?? null, groups: f.bodyGroups, markers };
  });
  return {
    id: r.id,
    kind: r.kind,
    cycle: r.assessment?.cycle ?? 1,
    type: reportType(r.kind, r.assessment?.cycle ?? 1),
    assessmentId: r.assessmentId,
    assessmentDate: r.assessment?.date ?? null,
    releasedAt: r.releasedAt,
    practitioner: practitioner ?? author,
    approver,
    startingPoint: r.startingPoint,
    practitionerNote: r.practitionerNote,
    recommendedPath: r.recommendedPath,
    pathReason: r.pathReason,
    sections,
    findings,
  };
}
export type ReportData = NonNullable<Awaited<ReturnType<typeof getReport>>>;

/** "What this report covers": from the plan's finished steps; falls back to the report's measure tags. */
export async function reportCoverage(clientId: string, kind: "BASELINE" | "REASSESSMENT", data: ResultsData, snap: Snapshot | null): Promise<CoverageRow[]> {
  const plan = await prisma.assessmentPlan.findFirst({ where: { clientId, kind }, include: { modules: true }, orderBy: { createdAt: "desc" } });
  if (plan && plan.modules.length) return coverageRows(plan.modules);
  const names: [SysId, string][] = [["movement", "Movement"], ["breathwork", "Breath"], ["recovery", "Recovery"], ["performance", "Performance"]];
  return names.map(([sys, name]) => {
    const tags = new Set<TagLabel>();
    for (const m of data.defs.filter((d) => d.sys === sys)) {
      const c = snap?.values[m.key];
      if (c) tags.add(c.tag);
    }
    const lvl = tags.has("Measured") ? 2 : tags.size ? 1 : 0;
    return {
      sys: name,
      nowL: ["Not covered", "Partial", "Full"][lvl],
      nowFill: ["0%", "50%", "100%"][lvl],
      nextL: ["Not covered", "Partial", "Full"][lvl],
      nextFill: ["0%", "50%", "100%"][lvl],
      change: false,
      why: lvl === 2 ? "Measured in person by your practitioner" : lvl === 1 ? "Observed and self reported" : "Not covered",
      tags: tags.size ? [...tags].join(" · ") : "Nothing captured yet",
    };
  });
}

/** Training products for the plan cards (Start training → Shopify checkout). */
export async function trainingProducts() {
  return prisma.product.findMany({ where: { active: true, kind: { in: ["PERSONAL_TRAINING", "GROUP_TRAINING"] } }, orderBy: { kind: "asc" } });
}

/** Has the client bought a training plan (stage 5+)? Plan cards show only before that. */
export async function hasTrainingPlan(clientId: string) {
  return (await prisma.clientPlan.count({ where: { clientId } })) > 0;
}

/** The client's released baseline report (the one the reveal walks through). */
export async function latestBaselineReportId(clientId: string) {
  const r = await prisma.report.findFirst({ where: { clientId, status: "RELEASED", kind: "BASELINE" }, orderBy: { releasedAt: "desc" }, select: { id: true } });
  return r?.id ?? null;
}
