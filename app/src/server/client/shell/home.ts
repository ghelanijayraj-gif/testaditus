import "server-only";
import type { SystemKey } from "@prisma/client";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";
import { dateLong, dateShort, dayLabel, timeLabel } from "@/lib/format";
import { dayKey, hourIST, keyDiff } from "@/components/client/calendar/dates";
import { getClientPhase, type ClientPhase } from "@/server/client/phase";

export type Step = { kicker: string; title: string; line: string; cta?: { label: string; href: string } };
export type WeekCell = { n: number; state: "now" | "past" | "window" | "future" };
export type HomeModel = Awaited<ReturnType<typeof getHomeModel>>;

const SYSTEMS: { id: "movement" | "breathwork" | "recovery" | "performance"; key: SystemKey; name: string }[] = [
  { id: "movement", key: "MOVEMENT", name: "Movement" },
  { id: "breathwork", key: "BREATH", name: "Breath" },
  { id: "recovery", key: "RECOVERY", name: "Recovery" },
  { id: "performance", key: "PERFORMANCE", name: "Performance" },
];

const PROVIDER: Record<string, string> = { APPLE_HEALTH: "Apple Health", GOOGLE_HEALTH_CONNECT: "Health Connect", GARMIN: "Garmin", WHOOP: "Whoop", OURA: "Oura", SMART_SCALE: "Smart scale" };
const PATH: Record<string, string> = { PERSONAL_TRAINING: "Personal Training", GROUP_TRAINING: "Group Training", EITHER: "Personal Training or Group Training" };

const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

function stepFor(ph: ClientPhase, recommended: string | null, t: Date): Step | null {
  const p = ph.plan;
  const w = ph.window;
  const coach = ph.coachName;
  const week = ph.week ?? 1;
  const training: Step = {
    kicker: `Week ${week} of 12`,
    title: w ? `Your reassessment window opens ${dateShort(w.opensAt)}.` : "Keep training.",
    line: "Keep training. On reassessment day we retest every baseline measure and compare the two.",
    cta: { label: "SEE YOUR BASELINE →", href: "/assessment" },
  };
  const today = ph.today;
  const what = today?.kind === "reassess" ? "reassessment" : "assessment";
  switch (ph.key) {
    case "report_ready":
      return { kicker: "Report released", title: "Your report is ready.", line: "Your starting point, what matters most, and your recommended path.", cta: { label: "OPEN REPORT →", href: "/reveal" } };
    case "plan_options":
      return { kicker: "Next steps", title: "Choose your path.", line: `${ph.assessCoachName} recommends ${recommended ?? "Personal Training"}. Pick a plan to unlock your full dashboard.`, cta: { label: "SEE PLANS →", href: "/plan" } };
    case "plan_paid":
      return { kicker: "Plan active", title: "Your full dashboard is open.", line: `Calendar, My plan, Compare and your coaches are now unlocked. Session 1 with ${coach} is the first thing to book.`, cta: { label: "SEE MY PLAN →", href: "/plan" } };
    case "review_call": {
      const call = ph.pending.find((s) => s.kind === "review");
      const first = ph.pending.find((s) => s.kind !== "review");
      if (!call) return training;
      return { kicker: `${ph.pending.length} to confirm`, title: `Your review call is ${dayLabel(call.startsAt)}.`, line: `${call.durationMin} minutes with ${call.coachName} before your reassessment window. Confirm it with ${first?.sessionNumber ? `session ${first.sessionNumber}` : "the others"}.` };
    }
    case "session_day":
      return {
        kicker: "Today",
        title: today?.sessionNumber && p ? `Session ${today.sessionNumber} of ${p.total} is today.` : `${today?.title ?? "Your session"} is today.`,
        line: `${p?.focus ? `Focus: ${p.focus.charAt(0).toLowerCase() + p.focus.slice(1)}. ` : ""}${today?.coachName ?? coach} left a note in the session details.`,
      };
    case "online_day":
      return {
        kicker: "Today",
        title: `${(today?.title ?? "Session").replace(/ · online$/i, "")} online, ${today ? timeLabel(today.startsAt) : ""}.`,
        line: today?.kind === "breath" ? `Join from a quiet room with a mat. Camera on so ${today.coachName} can see your ribs move.` : "Join from a quiet room with a mat.",
      };
    case "expiring":
      return p
        ? { kicker: "Plan ending soon", title: `${plural(p.left, "session")} left on your plan.`, line: `Your plan ends on ${dateShort(p.endsAt)} or after ${p.total} sessions, whichever comes first. Talk to ${coach} about what is next.`, cta: { label: "SEE MY PLAN →", href: "/plan" } }
        : training;
    case "window_open":
      return { kicker: `Week ${week} of 12`, title: "Your reassessment window is open.", line: `Book any time until ${w ? dateShort(w.closesAt) : ""}. 90 minutes, the same tests as your baseline.`, cta: { label: "WHAT WE RETEST →", href: "/assessment" } };
    case "reassess_scheduled":
      return { kicker: "Booked", title: "Your reassessment is booked.", line: `Same tests, same order, with ${w?.booked?.coachName ?? ph.assessCoachName}. Compare opens when the report is released.` };
    case "compare":
      return { kicker: "Compare unlocked", title: "Your reassessment report is ready.", line: "Every baseline measure, retested and compared.", cta: { label: "COMPARE →", href: "/assessment?mode=compare" } };
    case "returning":
      return { kicker: `Cycle ${ph.reassessments.length + 1}`, title: ph.reassessments.length > 1 ? "Your second reassessment is ready." : "Your reassessment is ready.", line: ph.reassessments.length > 1 ? "Compare it with your baseline or with your first reassessment." : "Compare it with your baseline.", cta: { label: "COMPARE →", href: "/assessment?mode=compare" } };
    case "export_ready":
      return { kicker: "Export ready", title: "Your export is ready.", line: "Every report, the Compare summary, your documents, invoices and consents. One download, or file by file.", cta: { label: "SEE YOUR EXPORT →", href: "/export" } };
    case "grace": {
      const days = ph.accessEndsAt ? Math.max(0, keyDiff(dayKey(t), dayKey(ph.accessEndsAt))) : 0;
      return { kicker: "Grace period", title: "You can still read and download everything.", line: `Booking is closed. Access ends in ${plural(days, "day")}. Renew any time to pick up where you left off.`, cta: { label: "SEE YOUR EXPORT →", href: "/export" } };
    }
    case "expired":
      return null;
    case "day_before": {
      const a = ph.upcoming.find((s) => s.isAssessment);
      return a ? { kicker: "Tomorrow", title: `Your ${a.kind === "reassess" ? "reassessment" : "assessment"} is tomorrow, ${timeLabel(a.startsAt)}.`, line: `${a.centreName ?? "Online"} with ${a.coachName}. Come 10 minutes early.` } : training;
    }
    case "checkin_day":
      return today ? { kicker: "Today", title: `Your ${what} is today, ${timeLabel(today.startsAt)}.`, line: `Tap I am here when you arrive. ${today.coachName} will come and get you.` } : training;
    case "in_progress":
      return { kicker: "In progress", title: `Your ${what} is under way.`, line: "Your practitioner is recording your results. Your report is ready after review." };
    case "review":
      return { kicker: "Practitioner review", title: `${ph.assessCoachName} is reviewing your results.`, line: "The head coach checks every report before it is released. We tell you on WhatsApp when it is ready." };
    default:
      return training;
  }
}

export async function getHomeModel(clientId: string) {
  const t = now();
  const ph = await getClientPhase(clientId);
  const h = hourIST(t);
  const greeting = `Good ${h < 12 ? "morning" : h < 17 ? "afternoon" : "evening"}, ${ph.client.firstName}.`;

  const baseReport = ph.baseline?.reportId ? await prisma.report.findUnique({ where: { id: ph.baseline.reportId }, include: { findings: { orderBy: { order: "asc" } } } }) : null;
  const step = stepFor(ph, baseReport?.recommendedPath ? PATH[baseReport.recommendedPath] : null, t);

  // Plan strip
  const p = ph.plan;
  const planStrip = p && ph.stage >= 5 ? { kind: p.kindLabel, status: p.statusLabel, total: p.total, used: p.used, left: p.left, days: p.ended ? 0 : p.daysLeft, ends: dateLong(p.endsAt) } : null;
  const endChoice = ph.key === "expired" && p ? { kicker: `Plan ended · ${p.used} of ${p.total} sessions used`, coach: p.coachName, total: p.total } : null;

  // Journey
  const reassessed = !!ph.window?.done || (!!ph.journeyStart && ph.reassessments.some((r) => r.releasedAt > ph.journeyStart!));
  const baseDone = !!ph.baseline?.releasedAt || !!ph.baseline?.date;
  const week = ph.week ?? 1;
  const start = ph.journeyStart;
  const winStart = start && ph.window ? Math.min(12, Math.max(1, Math.ceil(keyDiff(dayKey(start), dayKey(ph.window.opensAt)) / 7))) : 8;
  const weeks: WeekCell[] = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    if (reassessed) return { n, state: "past" };
    if (baseDone && n === week) return { n, state: "now" };
    if (baseDone && n < week) return { n, state: "past" };
    if (n >= winStart) return { n, state: "window" };
    return { n, state: "future" };
  });
  const daysToWindow = ph.window ? Math.max(0, keyDiff(dayKey(t), dayKey(ph.window.opensAt))) : null;
  const journeyStatus = !baseDone
    ? "Starts with your assessment"
    : reassessed
      ? "Reassessment done · Compare is open"
      : ph.window?.open
        ? `Week ${week} of 12 · Window open until ${dateShort(ph.window.closesAt)}`
        : daysToWindow != null
          ? `Week ${week} of 12 · Window opens in ${plural(daysToWindow, "day")}`
          : `Week ${week} of 12`;
  const journey = {
    status: journeyStatus,
    baseDone,
    reassessed,
    weeks,
    winStart,
    windowLabel: ph.window ? `Reassessment window · ${dateShort(ph.window.opensAt)} to ${dateShort(ph.window.closesAt)}` : "Reassessment window",
    startLabel: start ? dateShort(start) : "",
  };

  // System tiles
  const counts = new Map<SystemKey, number>();
  if (ph.baseline?.assessmentId) {
    const vals = await prisma.measureValue.findMany({ where: { assessmentId: ph.baseline.assessmentId, notTested: false }, select: { testKey: true, test: { select: { system: true } } } });
    const seen = new Set<string>();
    for (const v of vals) {
      if (seen.has(v.testKey)) continue;
      seen.add(v.testKey);
      counts.set(v.test.system, (counts.get(v.test.system) ?? 0) + 1);
    }
  }
  const tiles = SYSTEMS.map((s) => {
    const n = counts.get(s.key) ?? 0;
    const top = baseReport?.findings.find((f) => f.system === s.key);
    return { id: s.id, name: s.name, count: baseDone && n ? plural(n, "measure") : "At assessment", top: top ? top.title : baseDone ? "" : "Measured at your assessment." };
  });

  // Between sessions
  const sources = await prisma.healthSource.findMany({ where: { clientId, status: { in: ["CONNECTED", "ERROR"] } } });
  let health: { connected: false } | { connected: true; items: { k: string; v: string; u: string; d: string }[]; footer: string } = { connected: false };
  if (sources.some((s) => s.status === "CONNECTED")) {
    const since = new Date(t.getTime() - 7 * 86_400_000);
    const samples = await prisma.healthSample.findMany({ where: { clientId, metric: { in: ["sleep", "rhr", "hrv", "steps"] }, date: { gte: since, lte: t } } });
    const avg = (m: string) => {
      const xs = samples.filter((x) => x.metric === m).map((x) => x.value);
      return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
    };
    const nights = new Set(samples.filter((x) => x.metric === "sleep").map((x) => dayKey(x.date))).size;
    const baseRhr = ph.baseline?.assessmentId ? await prisma.measureValue.findFirst({ where: { assessmentId: ph.baseline.assessmentId, testKey: "rhr" } }) : null;
    const items: { k: string; v: string; u: string; d: string }[] = [];
    const sl = avg("sleep");
    if (sl != null) items.push({ k: "Sleep", v: sl.toFixed(1), u: "h", d: `${plural(nights, "night")} average` });
    const r = avg("rhr");
    if (r != null) items.push({ k: "Resting heart rate", v: String(Math.round(r)), u: "bpm", d: baseRhr?.value != null ? `${Math.round(r) <= baseRhr.value ? "Down" : "Up"} from ${Math.round(baseRhr.value)} at baseline` : "7 day average" });
    const hv = avg("hrv");
    if (hv != null) items.push({ k: "HRV", v: String(Math.round(hv)), u: "ms", d: "Overnight average" });
    const st = avg("steps");
    if (st != null) items.push({ k: "Steps", v: new Intl.NumberFormat("en-IN").format(Math.round(st)), u: "steps", d: "7 day average" });
    const sync = (d: Date | null) => (d ? `${dayKey(d) === dayKey(t) ? "today" : dayLabel(d)} ${timeLabel(d)}` : "not yet");
    const ok = sources.filter((s) => s.status === "CONNECTED");
    const bad = sources.filter((s) => s.status === "ERROR");
    const latest = ok.map((s) => s.lastSyncAt).filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0] ?? null;
    const footer = bad.length
      ? `${ok.map((s) => PROVIDER[s.provider]).join(" and ")} synced ${sync(latest)} · ${bad.map((s) => `${PROVIDER[s.provider]} not syncing since ${s.lastSyncAt ? dayLabel(s.lastSyncAt) : "setup"}`).join(" · ")}`
      : `${ok.map((s) => PROVIDER[s.provider]).join(" and ")} · last sync ${sync(latest)} · ${ok.some((s) => s.sharedWithCoach.length) ? "shared with your coach" : "only you"}`;
    health = { connected: true, items, footer };
  }

  // Latest report and recent documents
  const latestRel = await prisma.report.findFirst({ where: { clientId, status: "RELEASED" }, orderBy: { releasedAt: "desc" }, include: { author: { include: { user: true } } } });
  let latestReport: { title: string; meta: string; href: string } | null = null;
  if (latestRel?.releasedAt) {
    const n = ph.reassessments.length;
    const isRe = latestRel.kind === "REASSESSMENT";
    const author = latestRel.author?.user.name ?? ph.assessCoachName;
    latestReport = { title: isRe ? (n > 1 ? `Reassessment ${n} report` : "Reassessment report") : "Assessment report", meta: `${isRe ? "" : "Baseline · "}${dateLong(latestRel.releasedAt)} · ${author}`, href: `/reports/${latestRel.id}` };
  }
  const docs = await prisma.document.findMany({ where: { clientId, source: "CLIENT", status: "READY" }, orderBy: { createdAt: "desc" }, take: 2 });
  const recentDocs = docs.map((d) => ({ id: d.id, name: d.title, meta: `Added by you · ${dateLong(d.testDate ?? d.createdAt)}`, href: `/documents?file=${d.id}` }));

  return { phase: ph.key, stage: ph.stage, greeting, step, endChoice, planStrip, journey, tiles, health, latestReport, recentDocs, showJourney: ph.stage >= 4 || !!ph.baseline };
}
