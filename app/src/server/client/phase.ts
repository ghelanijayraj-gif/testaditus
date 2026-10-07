import "server-only";
import { cache } from "react";
import type { SessionStatus, SessionType } from "@prisma/client";
import { prisma } from "@/server/db";
import { getClientPlanView } from "@/server/client/plan/view";
import { now } from "@/lib/clock";
import { dayLabel, dateShort, timeLabel } from "@/lib/format";
import { addDays, dayKey, keyDiff, keyStart } from "@/components/client/calendar/dates";

/**
 * 05 §3 lifecycle. The phase is derived from data (plans, sessions, assessments,
 * reports, export, access dates) on every request, never stored as a free enum.
 * `getTopAction` (05 §1.4) is computed from sessions so it stays right in any phase.
 */

export type PhaseKey =
  | "account_not_setup"
  | "purchased"
  | "onboarding"
  | "intake_required"
  | "booked"
  | "day_before"
  | "checkin_day"
  | "in_progress"
  | "review"
  | "report_ready"
  | "plan_options"
  | "plan_paid"
  | "training"
  | "unconfirmed"
  | "review_call"
  | "session_day"
  | "online_day"
  | "expiring"
  | "window_open"
  | "reassess_scheduled"
  | "compare"
  | "returning"
  | "expired"
  | "export_ready"
  | "grace"
  | "access_ended";

export type Stage = 1 | 2 | 3 | 4 | 5 | 6;

/** 05 session kinds (legend colours, durations, drawer copy). */
export type SessionKind = "pt" | "gt" | "assess" | "reassess" | "breath" | "review" | "community";

export const KIND_OF: Record<SessionType, SessionKind> = {
  PERSONAL_TRAINING: "pt",
  TRIAL_TRAINING: "pt",
  GROUP_TRAINING: "gt",
  ASSESSMENT: "assess",
  MOVEMENT_ASSESSMENT: "assess",
  IN_PERSON_ASSESSMENT: "assess",
  LIVE_VIDEO: "assess",
  REASSESSMENT: "reassess",
  BREATH_SESSION: "breath",
  REVIEW_CALL: "review",
  COMMUNITY_EVENT: "community",
};

export const ASSESSMENT_TYPES: SessionType[] = ["ASSESSMENT", "MOVEMENT_ASSESSMENT", "IN_PERSON_ASSESSMENT", "LIVE_VIDEO", "REASSESSMENT"];

export type SessionLite = {
  id: string;
  type: SessionType;
  kind: SessionKind;
  title: string;
  startsAt: Date;
  durationMin: number;
  status: SessionStatus;
  online: boolean;
  joinUrl: string | null;
  coachName: string;
  centreName: string | null;
  sessionNumber: number | null;
  checkedInAt: Date | null;
  assessmentId: string | null;
  isAssessment: boolean;
  reminded: boolean;
};

export type PlanInfo = {
  id: string;
  name: string;
  /** "Personal Training" / "Group Training" */
  kindLabel: string;
  productSlug: string;
  total: number;
  used: number;
  left: number;
  startsAt: Date;
  endsAt: Date;
  daysLeft: number;
  statusLabel: "Active" | "Expiring soon" | "Completed" | "Expired";
  ended: boolean;
  coachName: string;
  coachId: string | null;
  renewalDecision: string | null;
  focus: string | null;
};

export type ReWindow = { opensAt: Date; closesAt: Date; open: boolean; before: boolean; booked: SessionLite | null; done: boolean };

export type ClientPhase = {
  key: PhaseKey;
  stage: Stage;
  /** Booking closed (plan ended, grace, access ended). */
  bookingClosed: boolean;
  client: { id: string; firstName: string; lastName: string; code: string; email: string; mobile: string | null; photoUrl: string | null; centreName: string | null; accountSetupDone: boolean };
  plan: PlanInfo | null;
  window: ReWindow | null;
  baseline: { assessmentId: string | null; date: Date | null; reportId: string | null; releasedAt: Date | null } | null;
  /** Released reassessment reports, newest first. */
  reassessments: { reportId: string; releasedAt: Date }[];
  journeyStart: Date | null;
  week: number | null;
  /** Sessions waiting for the client's confirmation (reminder sent or within 48 h). */
  pending: SessionLite[];
  today: SessionLite | null;
  upcoming: SessionLite[];
  coachName: string;
  assessCoachName: string;
  accessEndsAt: Date | null;
  graceEndsAt: Date | null;
  exportReady: boolean;
  /** Stage 1 to 2: an in person module still to book through the Plan area's Add and book. */
  inPersonToBook: boolean;
};

export type BookKind = "book" | "bookRe";

export type TopAction =
  | { kind: "hidden" }
  | {
      kind: "confirm" | "confirmed" | "book" | "checkin" | "checkedin" | "join";
      label: string;
      treatment: "primary" | "quiet" | "warn";
      chip?: string;
      /** Navigate to a route (Day area, Plan area). */
      href?: string;
      /** Open a portal layer via search params on the current page. */
      open?: { session?: string; confirm?: string; book?: BookKind };
      /** Run the check in action for this session. */
      checkIn?: string;
      sessionId?: string;
    };

const DAY = 86_400_000;
const LIVE: SessionStatus[] = ["SCHEDULED", "CONFIRMED"];

const nameOf = (u: { user: { name: string | null; email: string } } | null | undefined) => u?.user.name ?? u?.user.email ?? "";

function lite(s: {
  id: string;
  type: SessionType;
  title: string;
  startsAt: Date;
  durationMin: number;
  status: SessionStatus;
  online: boolean;
  joinUrl: string | null;
  sessionNumber: number | null;
  checkedInAt: Date | null;
  assessmentId: string | null;
  coach: { user: { name: string | null; email: string } } | null;
  centre: { name: string } | null;
  history: { note: string | null }[];
}): SessionLite {
  const kind = KIND_OF[s.type];
  return {
    id: s.id,
    type: s.type,
    kind,
    title: s.title,
    startsAt: s.startsAt,
    durationMin: s.durationMin,
    status: s.status,
    online: s.online,
    joinUrl: s.joinUrl,
    coachName: kind === "community" ? "ADITUS team" : nameOf(s.coach) || "your coach",
    centreName: s.centre?.name ?? null,
    sessionNumber: s.sessionNumber,
    checkedInAt: s.checkedInAt,
    assessmentId: s.assessmentId,
    isAssessment: ASSESSMENT_TYPES.includes(s.type),
    reminded: s.history.some((h) => (h.note ?? "").startsWith("Reminder sent")),
  };
}

const KIND_LABEL: Record<string, string> = { PERSONAL_TRAINING: "Personal Training", GROUP_TRAINING: "Group Training" };

/** Everything the lifecycle needs, loaded once per request. */
export const loadLifecycle = cache(async (clientId: string) => {
  const t = now();
  const client = await prisma.clientProfile.findUniqueOrThrow({
    where: { id: clientId },
    include: { user: true, preferredCentre: true, primaryPractitioner: { include: { user: true } }, coaches: { include: { staff: { include: { user: true } } } } },
  });
  const [plans, sessions, assessments, reports, exports, apPlans] = await Promise.all([
    prisma.clientPlan.findMany({ where: { clientId }, orderBy: { startsAt: "desc" }, include: { product: true } }),
    prisma.session.findMany({
      where: { clientId },
      orderBy: { startsAt: "asc" },
      include: { coach: { include: { user: true } }, centre: true, history: { select: { note: true } } },
    }),
    prisma.assessment.findMany({ where: { clientId }, orderBy: { date: "asc" } }),
    prisma.report.findMany({ where: { clientId, status: "RELEASED" }, orderBy: { releasedAt: "asc" } }),
    prisma.exportPackage.findMany({ where: { clientId }, orderBy: { createdAt: "desc" } }),
    prisma.assessmentPlan.findMany({ where: { clientId, kind: "BASELINE" }, include: { modules: true } }),
  ]);
  const staffIds = plans.map((p) => p.coachId).filter((x): x is string => !!x);
  const planCoaches = staffIds.length ? await prisma.staffProfile.findMany({ where: { id: { in: staffIds } }, include: { user: true } }) : [];
  return { t, client, plans, sessions, assessments, reports, exports, apPlans, planCoaches };
});

type Loaded = Awaited<ReturnType<typeof loadLifecycle>>;

async function derive(L: Loaded): Promise<ClientPhase> {
  const { t, client, plans, sessions, assessments, reports, exports, apPlans, planCoaches } = L;
  const todayKey = dayKey(t);
  const ptCoach = client.coaches.find((c) => c.role === "PERSONAL_TRAINING")?.staff;
  const assessCoach = client.primaryPractitioner ?? client.coaches.find((c) => c.role === "ASSESSMENT")?.staff;
  const assessCoachName = nameOf(assessCoach) || "Jayraj";

  const all = sessions.map(lite);
  const live = all.filter((s) => LIVE.includes(s.status));
  const endOf = (s: SessionLite) => s.startsAt.getTime() + s.durationMin * 60_000;
  const upcoming = live.filter((s) => endOf(s) > t.getTime());
  const today = upcoming.find((s) => dayKey(s.startsAt) === todayKey && s.kind !== "community") ?? null;
  const pending = upcoming.filter((s) => s.status === "SCHEDULED" && s.kind !== "community" && s.startsAt > t && (s.reminded || s.startsAt.getTime() - t.getTime() <= 48 * 3_600_000));

  // ── Plan ──
  const p = plans[0];
  let plan: PlanInfo | null = null;
  if (p) {
    const coach = planCoaches.find((c) => c.id === p.coachId) ?? ptCoach;
    const daysLeft = Math.max(0, keyDiff(todayKey, dayKey(p.endsAt)));
    const left = Math.max(0, p.sessionsTotal - p.sessionsUsed);
    const ended = p.status === "EXPIRED" || p.endsAt.getTime() < t.getTime();
    const completed = p.status === "COMPLETED" || left === 0;
    const statusLabel: PlanInfo["statusLabel"] = ended ? (completed ? "Completed" : "Expired") : completed ? "Completed" : daysLeft <= 7 || left <= 2 ? "Expiring soon" : "Active";
    plan = {
      id: p.id,
      name: p.name,
      kindLabel: KIND_LABEL[p.product.kind] ?? p.product.name,
      productSlug: p.product.slug,
      total: p.sessionsTotal,
      used: p.sessionsUsed,
      left,
      startsAt: p.startsAt,
      endsAt: p.endsAt,
      daysLeft,
      statusLabel: ended && p.status === "EXPIRED" ? "Expired" : statusLabel,
      ended,
      coachName: nameOf(coach) || "Shimyu",
      coachId: coach?.id ?? null,
      renewalDecision: p.renewalDecision,
      focus: p.focusAreas[0] ?? p.currentPhase ?? null,
    };
  }

  // ── Baseline and reassessment ──
  const baseAssess = assessments.find((a) => a.kind === "BASELINE");
  const baseReport = reports.find((r) => r.kind === "BASELINE");
  const baseline = baseAssess || baseReport ? { assessmentId: baseAssess?.id ?? null, date: baseAssess?.date ?? null, reportId: baseReport?.id ?? null, releasedAt: baseReport?.releasedAt ?? null } : null;
  const reassessments = reports
    .filter((r) => r.kind === "REASSESSMENT" && r.releasedAt)
    .map((r) => ({ reportId: r.id, releasedAt: r.releasedAt! }))
    .reverse();

  // ── Reassessment window: opens the day before the plan ends, four weeks long ──
  let window: ReWindow | null = null;
  if (plan) {
    const opensKey = addDays(dayKey(plan.endsAt), -1);
    const opensAt = keyStart(opensKey);
    const closesAt = new Date(keyStart(addDays(opensKey, 29)).getTime() - 1);
    const reSessions = all.filter((s) => s.kind === "reassess" && s.startsAt >= addDaysDate(opensAt, -14));
    window = {
      opensAt,
      closesAt,
      open: t >= opensAt && t <= closesAt,
      before: t < opensAt,
      booked: reSessions.find((s) => LIVE.includes(s.status) && endOf(s) > t.getTime()) ?? null,
      done: reSessions.some((s) => s.status === "DONE") || reassessments.some((r) => r.releasedAt >= plan!.startsAt),
    };
  }

  const journeyStart = baseline?.date ?? (window ? addDaysDate(window.opensAt, -56) : plan?.startsAt ?? null);
  const week = journeyStart ? Math.min(12, Math.max(1, Math.ceil(keyDiff(dayKey(journeyStart), todayKey) / 7))) : null;

  const exportReady = exports.some((e) => e.status === "ready" || e.status === "preparing");
  const latestExport = exports[0];
  const modules = apPlans.flatMap((a) => a.modules).filter((m) => !m.removed && !m.draft);
  const inPersonToBook = modules.some((m) => m.type === "IN_PERSON" && !m.system && ["NOT_STARTED", "WAITING_FOR_PAYMENT"].includes(m.status));

  const base: Omit<ClientPhase, "key" | "stage" | "bookingClosed"> = {
    client: {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      code: client.code,
      email: client.user.email,
      mobile: client.mobile,
      photoUrl: client.photoUrl,
      centreName: client.preferredCentre?.name ?? null,
      accountSetupDone: client.accountSetupDone,
    },
    plan,
    window,
    baseline,
    reassessments,
    journeyStart,
    week,
    pending,
    today,
    upcoming,
    coachName: plan?.coachName ?? nameOf(ptCoach) ?? "Shimyu",
    assessCoachName,
    accessEndsAt: client.accessEndsAt,
    graceEndsAt: client.graceEndsAt,
    exportReady,
    inPersonToBook,
  };
  const out = (key: PhaseKey, stage: Stage, bookingClosed = false): ClientPhase => ({ ...base, key, stage, bookingClosed });

  // 1. Access ended
  if (client.accessEndsAt && client.accessEndsAt < t) return out("access_ended", 6, true);

  // 2. Plan ended
  if (plan && plan.ended) {
    const reAfter = reassessments.find((r) => r.releasedAt >= plan.startsAt);
    if (plan.renewalDecision === "declined") {
      const fresh = latestExport?.preparedAt ? t.getTime() - latestExport.preparedAt.getTime() < 3 * DAY : latestExport?.status === "preparing";
      return out(fresh ? "export_ready" : "grace", 6, true);
    }
    if (reAfter) return out("compare", 6, true);
    if (window && !window.done && (window.open || window.booked)) return out(window.booked ? "reassess_scheduled" : "window_open", 5);
    return out("expired", 6, true);
  }

  // 3. Active plan
  if (plan) {
    const cycle2 = reassessments.length > 0 && reassessments[reassessments.length - 1].releasedAt < plan.startsAt;
    if (window?.booked) return out("reassess_scheduled", 5);
    if (window?.open && !window.done) return out("window_open", 5);
    if (cycle2) return out("returning", 5);
    if (plan.used === 0 && !upcoming.some((s) => s.kind === "pt")) return out("plan_paid", 5);
    if (today && !today.isAssessment) return out(today.online ? "online_day" : "session_day", 5);
    if (plan.statusLabel === "Expiring soon") return out("expiring", 5);
    if (pending.length > 1 && pending.some((s) => s.kind === "review")) return out("review_call", 5);
    if (pending.length && pending[0].startsAt.getTime() - t.getTime() < DAY) return out("unconfirmed", 5);
    return out("training", 5);
  }

  // 4. Report released, no plan yet
  if (baseReport) {
    const opened = await prisma.reportView.findFirst({ where: { reportId: baseReport.id, clientId: client.id } });
    return out(opened ? "plan_options" : "report_ready", 4);
  }

  // 5. Assessment day and review
  const aSess = all.filter((s) => s.isAssessment && s.status !== "CANCELLED" && s.status !== "RESCHEDULED");
  const aToday = aSess.find((s) => dayKey(s.startsAt) === todayKey);
  if (aToday) {
    if (aToday.status === "DONE") return out("review", 3);
    if (aToday.checkedInAt || aToday.startsAt <= t) return out("in_progress", 3);
    return out("checkin_day", 3);
  }
  if (client.assessmentStatus === "IN_PROGRESS") return out("in_progress", 3);
  if (client.assessmentStatus === "PRACTITIONER_REVIEW" || client.assessmentStatus === "REPORT_PROCESSING") return out("review", 3);
  const aNext = aSess.find((s) => LIVE.includes(s.status) && s.startsAt > t);
  if (aNext) {
    if (dayKey(aNext.startsAt) === addDays(todayKey, 1)) return out("day_before", 3);
    return out("booked", 2);
  }

  // 6. Account and onboarding
  if (!client.accountSetupDone) return out("account_not_setup", 1);
  if (client.assessmentStatus === "PURCHASED") return out("purchased", 1);
  if (client.assessmentStatus === "INTAKE_REQUIRED") return out("intake_required", 2);
  if (client.assessmentStatus === "SESSION_BOOKED") return out("booked", 2);
  return out("onboarding", 2);
}

function addDaysDate(d: Date, n: number) {
  return new Date(d.getTime() + n * DAY);
}

/** 05 §3 phase (26 states incl. stage 1 to 6). */
export const getClientPhase = cache(async (clientId: string): Promise<ClientPhase> => derive(await loadLifecycle(clientId)));

const HIDDEN: PhaseKey[] = ["access_ended", "expired", "export_ready", "grace", "compare", "report_ready", "plan_options", "account_not_setup", "in_progress", "review"];

/** "Thu 8 Oct" */
export const sdate = (d: Date) => dayLabel(d);

/** 05 §1.4 top right action, exact precedence. */
export function topActionFor(ph: ClientPhase, t: Date = now()): TopAction {
  if (HIDDEN.includes(ph.key)) return { kind: "hidden" };
  const today = ph.today;
  if (today) {
    if (today.online) {
      return {
        kind: "join",
        label: "Join session",
        treatment: "primary",
        chip: timeLabel(today.startsAt),
        sessionId: today.id,
        ...(today.isAssessment ? { href: `/live/${today.id}` } : { open: { session: today.id } }),
      };
    }
    if (today.checkedInAt) return { kind: "checkedin", label: "✓ Checked in", treatment: "quiet", sessionId: today.id, ...(today.isAssessment ? { href: `/day/${today.id}` } : {}) };
    return today.isAssessment
      ? { kind: "checkin", label: "I am here", treatment: "primary", chip: "TODAY", href: `/day/${today.id}`, sessionId: today.id }
      : { kind: "checkin", label: "Check in", treatment: "primary", chip: "TODAY", checkIn: today.id, sessionId: today.id };
  }
  if (ph.key === "window_open" && !ph.bookingClosed) return { kind: "book", label: "Book reassessment", treatment: "primary", open: { book: "bookRe" } };
  if (ph.pending.length) {
    const first = ph.pending[0];
    const h = (first.startsAt.getTime() - t.getTime()) / 3_600_000;
    const warn = h > 0 && h < 24;
    const many = ph.pending.length > 1;
    return {
      kind: "confirm",
      label: many ? `Confirm ${ph.pending.length} sessions` : `Confirm ${sdate(first.startsAt)}`,
      treatment: warn ? "warn" : "primary",
      chip: warn ? `IN ${Math.floor(h)} H` : undefined,
      open: many ? { confirm: ph.pending.map((s) => s.id).join(",") } : { session: first.id },
      sessionId: first.id,
    };
  }
  if (ph.key === "plan_paid" && !ph.bookingClosed) return { kind: "book", label: "Book first session", treatment: "primary", open: { book: "book" } };
  if (ph.stage <= 2 && ph.inPersonToBook) return { kind: "book", label: "Book your assessment", treatment: "primary", href: "/assessment/in-person" };
  const soon = ph.upcoming.find((s) => s.status === "CONFIRMED" && s.kind !== "community" && s.startsAt.getTime() - t.getTime() < 7 * DAY);
  if (soon) return { kind: "confirmed", label: `✓ Confirmed ${sdate(soon.startsAt)}`, treatment: "quiet", open: { session: soon.id }, sessionId: soon.id };
  if (ph.plan && !ph.plan.ended && ph.plan.left > 0 && !ph.bookingClosed && !ph.upcoming.some((s) => s.kind === "pt")) {
    return { kind: "book", label: "Book a session", treatment: "primary", open: { book: "book" } };
  }
  return { kind: "hidden" };
}

export const getTopAction = cache(async (clientId: string): Promise<TopAction> => {
  const ph = await getClientPhase(clientId);
  const base = topActionFor(ph);
  // Before the report: when no session drives the button, mirror the plan's "Your next step"
  // so the top action and the mobile bar match Home.
  if (ph.stage <= 3 && (base.kind === "hidden" || (base.kind === "book" && base.href === "/assessment/in-person"))) {
    const view = await getClientPlanView(clientId);
    const next = view?.next;
    if (next?.act && next.href) return { kind: "book", label: next.act.replace(/\s*→$/, ""), treatment: "primary", href: next.href };
  }
  return base;
});

/** Rail and step card helpers. */
export const windowLabel = (w: ReWindow) => `${dateShort(w.opensAt)} to ${dateShort(w.closesAt)}`;
