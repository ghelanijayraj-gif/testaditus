import "server-only";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";
import { dateShort, dayLabel, timeLabel } from "@/lib/format";
import { addDays, dayKey, keyNoon, mondayOf, MONTHS, shortTime, weekday } from "@/components/client/calendar/dates";
import { getClientPhase, KIND_OF, type SessionKind } from "@/server/client/phase";
import { STATUS_LABEL, TYPE_INFO } from "@/server/client/shell/core";

export type CalEvent = {
  id: string;
  kind: SessionKind;
  day: string;
  title: string;
  time: string;
  chip: string;
  status: string;
  statusKey: string;
  bg: string;
  fg: string;
  bd: string;
  strike: boolean;
  where: string;
  typeLabel: string;
  dayLabel: string;
};

function look(kind: SessionKind, status: string) {
  const ti = TYPE_INFO[kind];
  if (status === "MISSED") return { bg: "transparent", fg: "var(--grey-600)", bd: "inset 0 0 0 1.5px var(--grey-400)", strike: false };
  if (status === "CANCELLED") return { bg: "transparent", fg: "var(--grey-600)", bd: "inset 0 0 0 1px var(--grey-300)", strike: true };
  return { bg: ti.bg, fg: ti.fg, bd: "none", strike: false };
}

export async function getCalendarModel(clientId: string, q: { m?: string; wk?: string }) {
  const t = now();
  const today = dayKey(t);
  const ph = await getClientPhase(clientId);
  const rows = await prisma.session.findMany({ where: { clientId }, orderBy: { startsAt: "asc" }, include: { centre: true } });
  const events: CalEvent[] = rows.map((s) => {
    const kind = KIND_OF[s.type];
    const time = timeLabel(s.startsAt);
    return {
      id: s.id,
      kind,
      day: dayKey(s.startsAt),
      title: s.title,
      time,
      chip: `${shortTime(time)} ${s.title}`,
      status: STATUS_LABEL[s.status],
      statusKey: s.status,
      ...look(kind, s.status),
      where: s.online ? "Online" : kind === "community" ? (s.room?.split(",")[0] ?? "Juhu beach") : s.centre?.name ?? "",
      typeLabel: TYPE_INFO[kind].label,
      dayLabel: dayLabel(s.startsAt),
    };
  });

  // Month grid (Monday first weeks)
  const monthKey = /^\d{4}-\d{2}$/.test(q.m ?? "") ? q.m! : today.slice(0, 7);
  const [y, mo] = monthKey.split("-").map(Number);
  const first = `${monthKey}-01`;
  const gridStart = addDays(first, -weekday(first));
  const daysIn = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const cellsN = Math.ceil((weekday(first) + daysIn) / 7) * 7;
  const win = ph.window;
  const winFrom = win ? dayKey(win.opensAt) : null;
  const winTo = win ? dayKey(win.closesAt) : null;
  const planEnd = ph.plan ? dayKey(ph.plan.endsAt) : null;
  const inWin = (k: string) => !!winFrom && !!winTo && k >= winFrom && k <= winTo && !win?.done;
  const cells = Array.from({ length: cellsN }, (_, i) => {
    const k = addDays(gridStart, i);
    const n = Number(k.slice(8));
    return { key: k, label: n === 1 ? dateShort(keyNoon(k)) : String(n), out: k.slice(0, 7) !== monthKey, today: k === today, window: inWin(k), planEnd: k === planEnd, ev: events.filter((e) => e.day === k) };
  });
  const prevM = mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
  const nextM = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;

  // Week
  const wkStart = /^\d{4}-\d{2}-\d{2}$/.test(q.wk ?? "") ? mondayOf(q.wk!) : mondayOf(today);
  const week = Array.from({ length: 7 }, (_, i) => {
    const k = addDays(wkStart, i);
    return { key: k, label: dayLabel(keyNoon(k)), today: k === today, ev: events.filter((e) => e.day === k) };
  });

  const agenda = events.filter((e) => e.day >= today);
  const p = ph.plan;
  const pkg = p && !p.ended ? `${p.kindLabel} · ${p.used} of ${p.total} used · ${p.left} sessions left · plan ends ${dateShort(p.endsAt)}` : p ? `${p.kindLabel} · plan ended ${dateShort(p.endsAt)}` : `Assessment${ph.client.centreName ? " · " + ph.client.centreName : ""}`;

  let re: { label: string; variant: "outline" | "blue"; disabled: boolean } | null = null;
  if (p && win) {
    if (win.done) re = { label: "REASSESSMENT DONE", variant: "outline", disabled: true };
    else if (win.booked) re = { label: "REASSESSMENT BOOKED", variant: "outline", disabled: true };
    else if (win.open && !ph.bookingClosed) re = { label: "BOOK REASSESSMENT →", variant: "blue", disabled: false };
    else if (win.before) re = { label: `REASSESSMENT FROM ${dateShort(win.opensAt).toUpperCase()}`, variant: "outline", disabled: true };
  }

  return {
    pkg,
    canBook: !!p && !p.ended && !ph.bookingClosed,
    re,
    empty: events.length === 0,
    monthTitle: `${MONTHS[mo - 1]} ${y}`,
    weekLine: ph.week && p ? `Week ${ph.week} of 12` : "",
    monthKey,
    prevM,
    nextM,
    cells,
    week,
    weekTitle: `${dayLabel(keyNoon(wkStart))} to ${dayLabel(keyNoon(addDays(wkStart, 6)))}`,
    prevWk: addDays(wkStart, -7),
    nextWk: addDays(wkStart, 7),
    agenda,
    planEndDay: planEnd ? String(Number(planEnd.slice(8))) : null,
    hasWindow: !!win && !win.done,
  };
}
