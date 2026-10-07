import "server-only";
import { revalidatePath } from "next/cache";
import type { SessionStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";
import { dateLong, dayLabel, dayTime, timeLabel } from "@/lib/format";
import { notifier } from "@/server/integrations/notify";
import { getClientPhase, KIND_OF, type SessionKind, type BookKind } from "@/server/client/phase";

export const TYPE_INFO: Record<SessionKind, { label: string; bg: string; fg: string; dur: string }> = {
  pt: { label: "Personal Training", bg: "var(--blue)", fg: "#fff", dur: "60 min" },
  gt: { label: "Group Training", bg: "var(--navy)", fg: "#fff", dur: "60 min" },
  assess: { label: "Assessment", bg: "var(--ink)", fg: "#fff", dur: "90 min" },
  reassess: { label: "Reassessment", bg: "var(--ink)", fg: "#fff", dur: "90 min" },
  breath: { label: "Breath session", bg: "var(--sky)", fg: "var(--ink)", dur: "45 min" },
  review: { label: "Review call", bg: "var(--periwinkle)", fg: "var(--ink)", dur: "20 min" },
  community: { label: "Community event", bg: "var(--ice)", fg: "var(--ink)", dur: "2 hours" },
};

export const STATUS_LABEL: Record<SessionStatus, string> = {
  SCHEDULED: "Scheduled",
  CONFIRMED: "Confirmed",
  DONE: "Done",
  CANCELLED: "Cancelled",
  MISSED: "Missed",
  RESCHEDULED: "Rescheduled",
};

export const durLabel = (min: number) => (min >= 120 && min % 60 === 0 ? `${min / 60} hours` : `${min} min`);

/** The session if it belongs to this client, with what the drawer needs. */
export async function ownSession(clientId: string, id: string) {
  const s = await prisma.session.findFirst({
    where: { id, clientId },
    include: { coach: { include: { user: true } }, centre: true, clientPlan: { include: { product: true } }, history: { orderBy: { createdAt: "asc" } }, client: { include: { user: true } } },
  });
  return s;
}
export type OwnSession = NonNullable<Awaited<ReturnType<typeof ownSession>>>;

export const coachOf = (s: { type: OwnSession["type"]; coach: OwnSession["coach"] }) => (KIND_OF[s.type] === "community" ? "ADITUS team" : s.coach?.user.name ?? "your coach");

export function revalidatePortal() {
  revalidatePath("/", "layout");
}

export async function logActivity(clientId: string, actorName: string, action: string) {
  await prisma.activityLog.create({ data: { clientId, actorName, action, createdAt: now() } });
}

/** Coach side notice (portal inbox / email). Template prefix `coach_` keeps it out of the client's "Sent to you". */
export async function notifyCoach(clientId: string, coach: { user: { email: string; name: string | null } } | null | undefined, template: string, subject: string, body: string) {
  await notifier.send({ clientId, to: coach?.user.email ?? "team@aditus.in", channel: "PORTAL", template: `coach_${template}`, subject, body });
}

export async function queueClientWhatsApp(client: { id: string; mobile: string | null; whatsappUpdates: boolean }, template: string, body: string) {
  if (!client.whatsappUpdates) return;
  await notifier.send({ clientId: client.id, to: client.mobile ?? "no mobile", channel: "WHATSAPP", template, body });
}

export const historyTime = (d: Date, t = now()) => (Math.abs(t.getTime() - d.getTime()) < 5 * 60_000 ? "Just now" : `${dateLong(d)}, ${timeLabel(d)}`);

export type SlotOption = { id: string; label: string; desc: string; blocked: boolean };

/**
 * Coach availability for the pickers. Returns up to `max` free slots inside the plan
 * (and window, for reassessment), plus the first slot after plan end shown blocked.
 */
export async function slotOptions(opts: { staffId: string | null; minutes?: number; from: Date; until?: Date | null; after?: Date | null; max?: number; coachName: string; blockAfter?: boolean }) {
  const { staffId, from, until, max = 3, coachName } = opts;
  if (!staffId) return [] as SlotOption[];
  const rows = await prisma.availabilitySlot.findMany({
    where: { staffId, taken: false, startsAt: { gte: from }, ...(opts.minutes ? { minutes: opts.minutes } : {}) },
    orderBy: { startsAt: "asc" },
    take: 80,
  });
  const centres = await prisma.centre.findMany();
  const cName = (id: string | null) => (id ? centres.find((c) => c.id === id)?.name ?? "" : "Online");
  const inRange = rows.filter((r) => (!opts.after || r.startsAt >= opts.after) && (!until || r.startsAt <= until));
  const out: SlotOption[] = inRange.slice(0, max).map((r) => ({ id: r.id, label: dayTime(r.startsAt), desc: `${r.online ? "Online" : cName(r.centreId)} · ${opts.minutes && opts.minutes >= 90 ? `${opts.minutes} minutes` : coachName}`, blocked: false }));
  if (opts.blockAfter && until) {
    const late = rows.find((r) => r.startsAt > until);
    if (late) out.push({ id: late.id, label: `${dayTime(late.startsAt)} · after plan end`, desc: "This date is after your plan ends. Renew to book it.", blocked: true });
  }
  return out;
}

const BEFORE_DEFAULT: Record<"assess" | "online" | "other", string> = {
  assess: "Wear shorts and a fitted T shirt. Come 10 minutes early. Bring water and any reports you have. Eat a light meal 2 hours before.",
  online: "A quiet room, a mat, a camera that shows you from the side. Nothing to eat for an hour before.",
  other: "Wear shorts and a T shirt. You train barefoot. Bring water. Eat something light 90 minutes before.",
};

export type DrawerModel = {
  id: string;
  kind: SessionKind;
  typeLabel: string;
  typeBg: string;
  title: string;
  status: SessionStatus;
  statusLabel: string;
  coach: string;
  canChange: boolean;
  canConfirm: boolean;
  isConfirmed: boolean;
  online: boolean;
  joinHref: string | null;
  waLine: string;
  statusLine: string;
  late: boolean;
  sections: { title: string; rows: { k: string; v: string }[]; text?: string; links?: { label: string; href?: string }[] }[];
  slots: SlotOption[];
  googleUrl: string;
  icsUrl: string;
  bookingClosed: boolean;
};

const gcalStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function googleUrl(s: { title: string; startsAt: Date; durationMin: number; online: boolean; joinUrl: string | null; centre: { name: string; address: string } | null; coachName: string }) {
  const end = new Date(s.startsAt.getTime() + s.durationMin * 60_000);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `ADITUS · ${s.title}`,
    dates: `${gcalStamp(s.startsAt)}/${gcalStamp(end)}`,
    details: `With ${s.coachName}.${s.online && s.joinUrl ? " Join: " + s.joinUrl : ""}`,
    location: s.online ? s.joinUrl ?? "Online" : s.centre ? `${s.centre.name}, ${s.centre.address}` : "",
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export async function drawerModel(clientId: string, id: string): Promise<DrawerModel | null> {
  const s = await ownSession(clientId, id);
  if (!s) return null;
  const t = now();
  const ph = await getClientPhase(clientId);
  const kind = KIND_OF[s.type];
  const ti = TYPE_INFO[kind];
  const coach = coachOf(s);
  const online = s.online;
  const canChange = (s.status === "SCHEDULED" || s.status === "CONFIRMED") && kind !== "community";
  const hours = (s.startsAt.getTime() - t.getTime()) / 3_600_000;
  const isAssess = kind === "assess" || kind === "reassess";
  const joinHref = online ? (s.assessmentId || isAssess ? `/live/${s.id}` : s.joinUrl) : null;

  // Plan section
  let planRows: { k: string; v: string }[];
  if (kind === "pt") {
    const p = s.clientPlan;
    planRows = p
      ? [
          { k: "Counts against", v: p.name },
          { k: "Session", v: s.countsAgainstPlan && s.sessionNumber ? `${s.sessionNumber} of ${p.sessionsTotal}` : "Not counted" },
          { k: "Plan ends", v: dateLong(p.endsAt) },
        ]
      : [{ k: "Counts against", v: "Not counted" }];
  } else if (isAssess) planRows = [{ k: "Counts against", v: "Included in your assessment" }];
  else if (kind === "review") planRows = [{ k: "Counts against", v: "Included in your plan" }];
  else if (kind === "community") planRows = [{ k: "Counts against", v: "Free for clients" }];
  else {
    const holdings = await prisma.productHolding.findMany({ where: { clientId } });
    const word = kind === "breath" ? "breath" : s.title.split(" ·")[0].toLowerCase();
    const h = holdings.find((x) => x.title.toLowerCase().includes(word));
    planRows = [{ k: "Counts against", v: h ? `${h.title}${h.detail ? " · " + h.detail : ""}` : s.clientPlan?.name ?? "Included in your plan" }];
  }

  // Before you come
  const b = s.beforeYouCome as Record<string, string> | string | null;
  let before = typeof b === "string" ? b : b && typeof b === "object" ? Object.values(b).filter(Boolean).map((x) => (/[.!?]$/.test(x) ? x : x + ".")).join(" ") : "";
  if (!before) before = isAssess && !online ? BEFORE_DEFAULT.assess : online ? BEFORE_DEFAULT.online : BEFORE_DEFAULT.other;

  // Location
  const loc: DrawerModel["sections"][number] = online
    ? { title: "Location", rows: [{ k: "Where", v: "Online, video call" }], links: s.joinUrl ? [{ label: `Join link · ${s.joinUrl.replace(/^https?:\/\//, "")}`, href: joinHref ?? s.joinUrl }] : [] }
    : kind === "community"
      ? { title: "Location", rows: [{ k: "Where", v: s.room ?? "Juhu beach, near the lifeguard tower" }], links: [{ label: "Directions in Google Maps", href: `https://maps.google.com/?q=${encodeURIComponent(s.room ?? "Juhu beach lifeguard tower")}` }] }
      : { title: "Location", rows: [{ k: "Centre", v: s.centre?.name ?? "To be confirmed" }, ...(s.centre ? [{ k: "Address", v: s.centre.address }] : [])], links: s.centre ? [{ label: "Directions in Google Maps", href: s.centre.directionsUrl }] : [] };

  const history = s.history.map((h) => ({ k: h.note ?? `${STATUS_LABEL[h.status]} · ${h.byName}`, v: historyTime(h.createdAt, t) }));

  const statusLine =
    s.status === "DONE"
      ? "This session is done."
      : s.status === "CANCELLED"
        ? "You cancelled this session."
        : s.status === "RESCHEDULED"
          ? `Reschedule requested. ${coach} will confirm on WhatsApp.`
          : s.status === "MISSED"
            ? "Marked as missed. It counted as a used session."
            : "Community events need no confirmation. Just turn up.";

  // Reschedule slots: same coach, same length, at least 24 hours out
  let slots: SlotOption[] = [];
  if (canChange && !ph.bookingClosed) {
    const until = kind === "pt" ? s.clientPlan?.endsAt ?? null : kind === "reassess" ? ph.window?.closesAt ?? null : null;
    slots = await slotOptions({ staffId: s.coachId, minutes: s.durationMin, from: new Date(t.getTime() + 24 * 3_600_000), until, coachName: coach, blockAfter: kind === "pt" });
  }

  return {
    id: s.id,
    kind,
    typeLabel: ti.label,
    typeBg: ti.bg,
    title: s.title,
    status: s.status,
    statusLabel: STATUS_LABEL[s.status],
    coach,
    canChange,
    canConfirm: s.status === "SCHEDULED" && kind !== "community",
    isConfirmed: s.status === "CONFIRMED",
    online,
    joinHref,
    waLine: `WhatsApp confirmation queued to ${s.client?.mobile ?? "your number"}.`,
    statusLine,
    late: hours < 24,
    sections: [
      { title: "Overview", rows: [{ k: "Type", v: ti.label }, { k: "Date", v: `${dayLabel(s.startsAt)} ${new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric" }).format(s.startsAt)}` }, { k: "Time", v: timeLabel(s.startsAt) }, { k: "Duration", v: durLabel(s.durationMin) }, { k: "Status", v: STATUS_LABEL[s.status] }, { k: "Coach", v: coach }] },
      loc,
      { title: "Plan", rows: planRows },
      { title: "Before you come", rows: [], text: before },
      { title: "Extra info", rows: [], text: s.extraInfo ?? "Nothing extra for this session.", links: s.attachments.map((a) => ({ label: a })) },
      { title: "Status history", rows: history },
    ],
    slots,
    googleUrl: googleUrl({ title: s.title, startsAt: s.startsAt, durationMin: s.durationMin, online, joinUrl: s.joinUrl, centre: s.centre, coachName: coach }),
    icsUrl: `/api/calendar/${s.id}.ics`,
    bookingClosed: ph.bookingClosed,
  };
}

export type ListModel = { items: { id: string; title: string; when: string; meta: string; status: SessionStatus; statusLabel: string; pending: boolean }[] };

export async function listModel(clientId: string, ids: string[]): Promise<ListModel> {
  const rows = await prisma.session.findMany({ where: { clientId, id: { in: ids } }, orderBy: { startsAt: "asc" }, include: { coach: { include: { user: true } } } });
  return {
    items: rows.map((s) => ({
      id: s.id,
      title: s.title,
      when: dayTime(s.startsAt),
      meta: `${TYPE_INFO[KIND_OF[s.type]].label} · ${coachOf(s)}`,
      status: s.status,
      statusLabel: STATUS_LABEL[s.status],
      pending: s.status === "SCHEDULED",
    })),
  };
}

export type BookingModel = { kind: BookKind; title: string; ctxK: string; ctxV: string; showRule: boolean; coach: string; slots: SlotOption[]; closed: string | null };

export async function bookingModel(clientId: string, kind: BookKind): Promise<BookingModel> {
  const t = now();
  const ph = await getClientPhase(clientId);
  const plan = ph.plan;
  const from = new Date(t.getTime() + 24 * 3_600_000);
  if (kind === "bookRe") {
    const w = ph.window;
    const staff = await prisma.staffProfile.findFirst({ where: { user: { name: ph.assessCoachName } } });
    const slots = w ? await slotOptions({ staffId: staff?.id ?? null, minutes: 90, from: from > w.opensAt ? from : w.opensAt, until: w.closesAt, coachName: ph.assessCoachName }) : [];
    return {
      kind,
      title: "Book your reassessment",
      ctxK: "Reassessment",
      ctxV: w ? `Retests every baseline measure · window ${dateShortish(w.opensAt)} to ${dateShortish(w.closesAt)}` : "Retests every baseline measure",
      showRule: false,
      coach: ph.assessCoachName,
      slots,
      closed: ph.bookingClosed ? "Booking is closed." : !w?.open ? "Your reassessment window is not open yet." : w.booked ? "Your reassessment is already booked." : null,
    };
  }
  const left = plan ? plan.left - ph.upcoming.filter((s) => s.kind === "pt").length : 0;
  const slots = plan ? await slotOptions({ staffId: plan.coachId, minutes: 60, from, until: plan.endsAt, coachName: plan.coachName, blockAfter: true }) : [];
  return {
    kind,
    title: "Book a session",
    ctxK: "Booking",
    ctxV: plan ? `${plan.kindLabel} · ${Math.max(0, left)} left · plan ends ${dateShortish(plan.endsAt)}` : "No active plan",
    showRule: true,
    coach: plan?.coachName ?? ph.coachName,
    slots,
    closed: !plan || plan.ended || ph.bookingClosed ? "Booking is closed." : left <= 0 ? "Every session on your plan is booked or used." : null,
  };
}

const dateShortish = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }).format(d);
