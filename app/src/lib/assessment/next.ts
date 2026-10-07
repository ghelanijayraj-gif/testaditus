import type { AddedBy, ModuleStatus, ModuleType, RecommendationState } from "@prisma/client";
import { ACTIONABLE, DONEISH } from "./plan";

/**
 * 06 Client Assessment Plan: next step, recommendation visibility, labels and routes.
 * Pure functions (no I/O) shared by Home, the plan screen, Welcome and staff preview.
 */

export type PlanMod = {
  id: string;
  key: string;
  name: string;
  purpose: string | null;
  shortLine: string | null;
  type: ModuleType;
  status: ModuleStatus;
  timeEstimate: string | null;
  dueLabel: string | null;
  note: string | null;
  addedBy: AddedBy;
  addedByName: string | null;
  priceLabel: string | null;
  paid: boolean;
  required: boolean;
  /** Client visible status line (computed server side from status, booking, progress). */
  extra: string | null;
  coverage: unknown;
  /** Staff added paid module: Shopify payment link while Waiting for payment. */
  paymentUrl?: string | null;
  /** Booked session for this module (live video / in person). */
  sessionId?: string | null;
};

export const isActionable = (s: ModuleStatus) => ACTIONABLE.includes(s);
export const isDoneish = (s: ModuleStatus) => DONEISH.includes(s);

/** Custom modules carry the "Added for you by Jayraj" strip and the practitioner note. */
export const isCustom = (m: Pick<PlanMod, "addedBy">) => m.addedBy === "PRACTITIONER" || m.addedBy === "ADMIN";

export function byLine(m: Pick<PlanMod, "addedBy" | "addedByName" | "priceLabel" | "paid">, practitioner: string) {
  if (isCustom(m)) return `Added for you by ${m.addedByName ?? practitioner}`;
  if (m.addedBy === "RECOMMENDED") return `Recommended for you${m.paid ? ` · paid ${m.priceLabel ?? "₹X,XXX"}` : ""}`;
  return "Part of every assessment";
}

/** One action label per status (06.4). Done / Submitted / Skipped have no button. */
export function actionLabel(m: Pick<PlanMod, "key" | "type" | "status">): string | null {
  switch (m.status) {
    case "NOT_STARTED":
      if (m.key === "intake") return "START INTAKE →";
      if (m.key === "capture") return "START CAPTURE →";
      if (m.type === "UPLOAD") return "UPLOAD →";
      if (m.type === "CAPTURE") return "RECORD →";
      if (m.type === "IN_PERSON") return "PICK A TIME →";
      if (m.type === "LIVE_VIDEO" || m.type === "REVIEW_CALL") return "BOOK A TIME →";
      if (m.type === "CONNECT_HEALTH") return "CONNECT →";
      return "START →";
    case "IN_PROGRESS":
      return "CONTINUE →";
    case "MORE_NEEDED":
      return "SEE WHAT IS NEEDED →";
    case "WAITING_FOR_PAYMENT":
      return "COMPLETE PAYMENT →";
    case "BOOKED":
      return "VIEW BOOKING →";
    default:
      return null;
  }
}

/** Where a module's action goes. */
export function moduleHref(m: Pick<PlanMod, "key" | "type" | "status" | "paymentUrl" | "sessionId">): string {
  if (m.key === "intake") return "/intake";
  if (m.key === "capture") return "/assessment/steps/capture";
  if (m.type === "IN_PERSON") {
    if (m.status === "WAITING_FOR_PAYMENT") return "/assessment/in-person?step=pay";
    if (m.status === "BOOKED" || isDoneish(m.status)) return "/assessment/in-person?step=booked";
    return "/assessment/in-person?step=centre";
  }
  if (m.status === "WAITING_FOR_PAYMENT" && m.paymentUrl) return m.paymentUrl;
  if (m.type === "LIVE_VIDEO" && m.status === "BOOKED") return m.sessionId ? `/live/${m.sessionId}` : "/calendar";
  return `/assessment/steps/${m.key}`;
}

/** Progress: done/submitted client modules over all client modules ("2 of 4 steps done"). */
export function planProgress(mods: Pick<PlanMod, "status">[]) {
  const live = mods.filter((m) => m.status !== "SKIPPED_BY_PRACTITIONER");
  const done = live.filter((m) => isDoneish(m.status)).length;
  const total = live.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, label: `${done} of ${total} steps done` };
}

export type NextStep = {
  title: string;
  line: string;
  /** Practitioner note (custom modules only). */
  note: string | null;
  noteBy: string | null;
  act: string | null;
  href: string | null;
  /** "Changed your mind? In person session →" */
  reopen: boolean;
  module: PlanMod | null;
};

/**
 * Home "Your next step" = first actionable module (06.5). If none: the booked in person
 * session, else "Nothing to do right now.".
 */
export function nextStep(
  mods: PlanMod[],
  ctx: { practitioner: string; dismissed: boolean; booking?: { title: string; line: string; href: string } | null },
): NextStep {
  const first = mods.find((m) => isActionable(m.status)) ?? null;
  if (first) {
    const title =
      first.status === "MORE_NEEDED"
        ? first.key === "capture"
          ? "Retake two photos."
          : `More is needed for ${first.name}.`
        : first.status === "WAITING_FOR_PAYMENT"
          ? "Complete your payment."
          : first.status === "IN_PROGRESS"
            ? "Pick up where you left off."
            : `${first.name}.`;
    const custom = isCustom(first) && !!first.note;
    return {
      title,
      line: first.extra || first.purpose || "",
      note: custom ? first.note : null,
      noteBy: custom ? byLine(first, ctx.practitioner) : null,
      act: actionLabel(first),
      href: moduleHref(first),
      reopen: ctx.dismissed,
      module: first,
    };
  }
  if (ctx.booking) return { title: ctx.booking.title, line: ctx.booking.line, note: null, noteBy: null, act: "VIEW BOOKING →", href: ctx.booking.href, reopen: ctx.dismissed, module: null };
  return {
    title: "Nothing to do right now.",
    line: `${ctx.practitioner} is reviewing your capture. Your report is ready within XX hours of review.`,
    note: null,
    noteBy: null,
    act: null,
    href: null,
    reopen: ctx.dismissed,
    module: null,
  };
}

export type RecScreen = "welcome" | "home" | "plan";

/**
 * Mumbai in person recommendation (06 §B). Only inside the Mumbai area, only while no in
 * person module is in the plan and the client has not chosen "Continue online only".
 */
export function recommendationEligible(p: { inMumbaiArea: boolean; recommendation: RecommendationState; mods: Pick<PlanMod, "type">[] }) {
  if (!p.inMumbaiArea) return false;
  if (p.recommendation === "DISMISSED" || p.recommendation === "NOT_ELIGIBLE") return false;
  return !p.mods.some((m) => m.type === "IN_PERSON");
}

/** onlineDone = Online Capture Done or Submitted. */
export const onlineDone = (mods: Pick<PlanMod, "key" | "status">[]) => {
  const c = mods.find((m) => m.key === "capture");
  return !!c && isDoneish(c.status);
};

export function recommendationVisible(screen: RecScreen, p: { inMumbaiArea: boolean; recommendation: RecommendationState; mods: Pick<PlanMod, "key" | "type" | "status">[] }) {
  if (!recommendationEligible(p)) return false;
  if (screen === "welcome") return true;
  const done = onlineDone(p.mods);
  if (screen === "plan") return done;
  return done && !p.mods.some((m) => isActionable(m.status));
}

export const REC_COPY: Record<RecScreen, { kicker: string; title: string }> = {
  welcome: { kicker: "Recommended for you · you live near our centres", title: "We recommend adding an in person session." },
  home: { kicker: "Your next step", title: "Book an in person session." },
  plan: { kicker: "Online Capture submitted", title: "We recommend an in person session next." },
};

export const REC_WHY = [
  "Hands on measures: joint ranges and rib expansion, left and right.",
  "What video cannot show: how your hip moves under load.",
  "A trial training with your coach, so you know how sessions feel.",
];

export const IN_PERSON_INCLUDES: [string, string][] = [
  ["Movement Assessment", "XX min"],
  ["Breath Session", "XX min"],
  ["Trial Training", "XX min"],
];

/** Shown only when the Online Capture is done/submitted and a practitioner wrote a note. */
export const showRecNote = (mods: Pick<PlanMod, "key" | "status">[], note: string | null | undefined) => onlineDone(mods) && !!note;

/** "Good evening, Aarav" from the app clock (IST hour). */
export function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export const TEAM_WHATSAPP = "https://wa.me/919820041700";
