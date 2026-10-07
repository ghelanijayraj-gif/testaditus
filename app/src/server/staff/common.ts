import "server-only";
import type { ModuleStatus, Prisma, SessionType, StaffRole } from "@prisma/client";
import { prisma } from "@/server/db";
import { clientScope, type StaffCtx } from "@/server/auth/guards";
import { now } from "@/lib/clock";
import { dateShort, dayLabel, timeLabel } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/permissions";

/** Hours a submitted module may wait for practitioner review before it is overdue. */
export const REVIEW_SLA_H = 36;
/** Intake or capture unfinished for this long counts as stalled (brief: "after XX hours"). */
export const STALLED_H = 24;

export type Ctx = Pick<StaffCtx, "staff" | "role" | "name" | "userId">;

/** Scope line under the console title ("All clients and staff", "Own clients", …). */
export function scopeLabel(ctx: Ctx) {
  return {
    FOUNDER: "All clients and staff",
    HOD: `${ctx.staff.segment ?? "Your"} segment`,
    PRACTITIONER: "Own clients",
    OPS: "Scheduling and billing",
    FINANCE: "Billing only",
  }[ctx.role];
}

export const roleLabel = (r: StaffRole) => ROLE_LABEL[r];

/** "18 h left" / "6 h overdue" from a due instant. */
export function hoursLeft(due: Date) {
  const h = (due.getTime() - now().getTime()) / 3_600_000;
  if (h >= 0) return h > 72 ? dayLabel(due) : `${Math.max(1, Math.round(h))} h left`;
  return `${Math.max(1, Math.round(-h))} h overdue`;
}

export const hoursSince = (d: Date) => Math.round((now().getTime() - d.getTime()) / 3_600_000);

/** "7:52 PM" today, else "Tue 6 Oct". */
export function whenLabel(d: Date) {
  const n = now();
  return dayLabel(d) === dayLabel(n) ? timeLabel(d) : dayLabel(d);
}

/** City as the console shows it: "Kandivali, Mumbai" → "Kandivali". */
export const shortCity = (c?: string | null) => (c ? c.split(",")[0].trim() : "·");

export const SESSION_SHORT: Record<SessionType, string> = {
  PERSONAL_TRAINING: "PT",
  GROUP_TRAINING: "Group",
  ASSESSMENT: "Assessment",
  MOVEMENT_ASSESSMENT: "Movement",
  IN_PERSON_ASSESSMENT: "In person",
  BREATH_SESSION: "Breath",
  TRIAL_TRAINING: "Trial",
  LIVE_VIDEO: "Live video",
  REVIEW_CALL: "Review call",
  REASSESSMENT: "Reassessment",
  COMMUNITY_EVENT: "Event",
};

/** "PT 12" / "Group 24" from a client plan. */
export function planShort(p: { name: string; sessionsTotal: number; product?: { kind: string } | null }) {
  if (p.product?.kind === "PERSONAL_TRAINING") return `PT ${p.sessionsTotal}`;
  if (p.product?.kind === "GROUP_TRAINING") return `Group ${p.sessionsTotal}`;
  return p.name;
}

/** IST day bounds for a yyyy-mm-dd string (or today). */
export function istDay(date?: string) {
  const base = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : isoDay(now());
  const start = new Date(`${base}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 86_400_000);
  return { start, end, iso: base };
}

export function isoDay(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

const ACTIVE_PLAN = (p: { status: string; endsAt: Date }) => p.status === "ACTIVE" || p.status === "EXPIRING_SOON" || p.endsAt >= now();

// ─────────────────────────────── Client rows (Today, Clients, Assessments) ───────────────────────────────

export const clientInclude = {
  user: { select: { email: true } },
  primaryPractitioner: { include: { user: { select: { name: true } } } },
  coaches: { include: { staff: { include: { user: { select: { name: true } } } } } },
  plans: { orderBy: { createdAt: "desc" }, include: { modules: { orderBy: { order: "asc" } } } },
  trainingPlans: { orderBy: { endsAt: "desc" }, include: { product: true } },
  reports: { orderBy: { createdAt: "desc" } },
  sessions: { orderBy: { startsAt: "asc" }, include: { coach: { include: { user: { select: { name: true } } } } } },
  retakes: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.ClientProfileInclude;

export type ClientFull = Prisma.ClientProfileGetPayload<{ include: typeof clientInclude }>;
export type PlanModuleRow = ClientFull["plans"][number]["modules"][number];

/** Modules the client can see (sent, not removed). Unsent drafts are staff only. */
export const liveModules = (c: ClientFull) => (c.plans[0]?.modules ?? []).filter((m) => !m.draft && !m.removed && !m.system);

/** Staff "modules done": done, submitted or booked (nothing left for the client to do). */
const RESOLVED: ModuleStatus[] = ["DONE", "SUBMITTED", "BOOKED", "SKIPPED_BY_PRACTITIONER"];

export const reviewed = (m: { data: unknown }) => Boolean((m.data as { reviewedAt?: string } | null)?.reviewedAt);

export type ClientRow = {
  id: string;
  code: string;
  name: string;
  first: string;
  city: string;
  mumbai: boolean;
  status: string;
  statusFlag: boolean;
  modules: string;
  modulesDone: number;
  modulesTotal: number;
  practitioner: string;
  nextAction: string;
  due: string;
  plan: string;
  expiry: string;
  needsAction: boolean;
  training: boolean;
  stalled?: { hours: number; module: string; progress: string };
  activePlan?: ClientFull["trainingPlans"][number];
};

export function staffName(s?: { user: { name: string | null } } | null) {
  return s?.user.name ?? "·";
}

/** Stalled: intake or capture unfinished for STALLED_H hours. */
export function stalledOf(c: ClientFull): ClientRow["stalled"] {
  const mods = liveModules(c);
  for (const m of mods) {
    if (!["intake", "capture"].includes(m.key)) continue;
    if (m.status !== "IN_PROGRESS" && !(m.key === "intake" && m.status === "NOT_STARTED" && c.intakeStep > 0)) continue;
    const h = hoursSince(m.updatedAt);
    if (h < STALLED_H) continue;
    const pct = m.progressDone != null && m.progressTotal ? Math.round((m.progressDone / m.progressTotal) * 10) * 10 : m.key === "intake" ? Math.round((c.intakeStep / 12) * 10) * 10 : null;
    const label = m.key === "intake" ? "Intake" : "Capture";
    return { hours: h, module: m.name, progress: pct != null ? `${label} ${pct}%` : label };
  }
  return undefined;
}

export function deriveClient(c: ClientFull): ClientRow {
  const mods = liveModules(c);
  const done = mods.filter((m) => RESOLVED.includes(m.status)).length;
  const plan = c.trainingPlans.find(ACTIVE_PLAN) ?? c.trainingPlans[0];
  const left = plan ? plan.sessionsTotal - plan.sessionsUsed : 0;
  const ptCoach = c.coaches.find((x) => x.role === "PERSONAL_TRAINING" || x.role === "GROUP_TRAINING");
  const trainingStage = ["TRAINING", "PLAN_ENDED", "GRACE", "ACCESS_ENDED"].includes(c.stage);
  const practitioner = trainingStage && plan?.coachId ? staffName(c.coaches.find((x) => x.staffId === plan.coachId)?.staff) : trainingStage && ptCoach ? staffName(ptCoach.staff) : staffName(c.primaryPractitioner);
  const pending = c.reports.find((r) => r.status === "PENDING_APPROVAL");
  const more = mods.find((m) => m.status === "MORE_NEEDED");
  const toReview = mods.find((m) => m.status === "SUBMITTED" && !reviewed(m) && m.type !== "FORM");
  const draftReport = c.reports.find((r) => r.status === "DRAFT" || r.status === "RETURNED");
  const stalled = stalledOf(c);
  const firstAction = mods.find((m) => ["NOT_STARTED", "IN_PROGRESS", "MORE_NEEDED", "WAITING_FOR_PAYMENT"].includes(m.status));
  const inPerson = mods.find((m) => m.type === "IN_PERSON" && m.status === "BOOKED");
  const nextSession = c.sessions.find((s) => s.startsAt >= now() && s.status !== "CANCELLED" && s.status !== "RESCHEDULED");

  let status = "Assessment";
  let statusFlag = false;
  let nextAction = "·";
  let due = "·";
  const dueOf = (m?: PlanModuleRow) => (m?.dueAt ? dayLabel(m.dueAt) : m?.dueLabel ?? "·");

  if (c.stage === "ACCESS_ENDED") status = "Access ended";
  else if (c.stage === "GRACE") {
    status = "Grace period";
    nextAction = "Export pack";
    due = c.graceEndsAt ? dayLabel(c.graceEndsAt) : "·";
  } else if (c.stage === "PLAN_ENDED") status = "Plan ended";
  else if (c.stage === "TRAINING") {
    const daysLeft = plan ? Math.ceil((plan.endsAt.getTime() - now().getTime()) / 86_400_000) : 99;
    if (plan && daysLeft < 0) {
      status = "Plan ended";
      statusFlag = true;
      nextAction = "Renewal";
      due = `Ended ${dateShort(plan.endsAt)}`;
    } else if (plan && (daysLeft <= 7 || left <= 2)) {
      status = "Plan expiring";
      statusFlag = true;
      nextAction = "Renewal";
      due = `${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
    } else {
      status = "Training active";
      nextAction = nextSession ? `Session ${dayLabel(nextSession.startsAt)}` : "Book next session";
    }
  } else if (pending) {
    status = "Report pending";
    statusFlag = true;
    nextAction = "Approve report";
    due = pending.dueAt ? hoursLeft(pending.dueAt) : "·";
  } else if (more) {
    status = "Waiting on client";
    statusFlag = true;
    nextAction = c.retakes[0]?.step ?? more.name;
    due = more.dueAt ? dayLabel(more.dueAt) : "Waiting on client";
  } else if (toReview && (c.assessmentStatus === "PRACTITIONER_REVIEW" || c.assessmentStatus === "REPORT_PROCESSING" || !inPerson)) {
    status = "Needs review";
    statusFlag = true;
    nextAction = `Review ${toReview.type === "CAPTURE" ? "capture" : toReview.name.toLowerCase()}`;
    const dueAt = draftReport?.dueAt ?? (toReview.submittedAt ? new Date(toReview.submittedAt.getTime() + REVIEW_SLA_H * 3_600_000) : null);
    due = dueAt ? hoursLeft(dueAt) : "·";
  } else if (stalled) {
    status = stalled.progress;
    nextAction = `Nudge: ${stalled.progress.split(" ")[0].toLowerCase()}`;
    due = `${stalled.hours} h stalled`;
  } else if (inPerson) {
    status = "In person booked";
    nextAction = firstAction?.name ?? "In person session";
    due = firstAction ? dueOf(firstAction) : dueOf(inPerson);
  } else if (mods.some((m) => m.status === "WAITING_FOR_PAYMENT")) {
    status = "Waiting for payment";
    nextAction = firstAction?.name ?? "·";
  } else {
    status = {
      PURCHASED: "Purchased",
      PROFILE_REQUIRED: "Account setup",
      INTAKE_REQUIRED: "Intake",
      INTAKE_COMPLETE: "Intake done",
      BOOKING_REQUIRED: "Booking needed",
      SESSION_BOOKED: "Session booked",
      IN_PROGRESS: "In progress",
      PRACTITIONER_REVIEW: "In review",
      REPORT_PROCESSING: "Report in progress",
      REPORT_READY: "Report released",
    }[c.assessmentStatus];
    if (!c.accountSetupDone) status = "Account setup";
    nextAction = firstAction?.name ?? (nextSession ? `${SESSION_SHORT[nextSession.type]} ${dayLabel(nextSession.startsAt)}` : "·");
    due = firstAction ? dueOf(firstAction) : "·";
  }

  const isTrainingPlan = !!plan && trainingStage;
  return {
    id: c.id,
    code: c.code,
    name: `${c.firstName} ${c.lastName}`,
    first: c.firstName,
    city: shortCity(c.city),
    mumbai: c.inMumbaiArea,
    status,
    statusFlag,
    modules: mods.length && !trainingStage ? `${done} of ${mods.length}` : "·",
    modulesDone: done,
    modulesTotal: mods.length,
    practitioner,
    nextAction,
    due,
    plan: isTrainingPlan ? planShort(plan) : "Assessment",
    expiry: isTrainingPlan ? dateShort(plan.endsAt) : "·",
    needsAction: ["Needs review", "Waiting on client", "Report pending"].includes(status) || !!stalled,
    training: isTrainingPlan && c.stage === "TRAINING",
    stalled,
    activePlan: plan,
  };
}

export async function loadClients(ctx: Ctx, where: Prisma.ClientProfileWhereInput = {}) {
  const rows = await prisma.clientProfile.findMany({ where: { AND: [clientScope(ctx), where] }, include: clientInclude, orderBy: [{ updatedAt: "desc" }] });
  return rows;
}

/** Staff names for pickers. */
export async function practitioners() {
  const s = await prisma.staffProfile.findMany({ where: { role: { in: ["FOUNDER", "HOD", "PRACTITIONER"] }, user: { disabled: false } }, include: { user: true }, orderBy: { createdAt: "asc" } });
  return s.map((x) => ({ id: x.id, name: x.user.name ?? x.user.email }));
}
