import "server-only";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";
import { dayLabel, dayTime } from "@/lib/format";
import { getClientPhase, getTopAction, type TopAction, type PhaseKey, type Stage } from "@/server/client/phase";
import { topDate } from "@/components/client/calendar/dates";

export type ShellModel = {
  clientId: string;
  fullName: string;
  firstName: string;
  code: string;
  initials: string;
  photoUrl: string | null;
  coach: string;
  centre: string;
  planLabel: string;
  stage: Stage;
  phase: PhaseKey;
  navSub: string | null;
  today: string;
  nowISO: string;
  action: TopAction;
  todo: number;
  whatsapp: { display: string; digits: string; prefill: string };
  rate: { sessionId: string; label: string; score: number | null; note: string } | null;
  issueSessions: { id: string; label: string }[];
  bookingClosed: boolean;
};

export async function getShellModel(clientId: string): Promise<ShellModel> {
  const t = now();
  const ph = await getClientPhase(clientId);
  const c = ph.client;
  const contact = await prisma.setting.findUnique({ where: { key: "contact" } });
  const wa = ((contact?.value as { whatsapp?: string } | null)?.whatsapp ?? "+91 98200 41700").trim();
  const lastDone = await prisma.session.findFirst({ where: { clientId, status: "DONE", startsAt: { lte: t } }, orderBy: { startsAt: "desc" }, include: { ratings: { where: { clientId }, orderBy: { createdAt: "desc" }, take: 1 } } });

  const p = ph.plan;
  const planLabel = !p ? "Assessment" : p.ended ? (p.statusLabel === "Completed" ? "Completed" : "Ended") : p.statusLabel === "Completed" ? "Completed" : `${p.used} of ${p.total}`;
  const fullName = `${c.firstName} ${c.lastName}`;
  return {
    clientId,
    fullName,
    firstName: c.firstName,
    code: c.code,
    initials: (c.firstName[0] ?? "") + (c.lastName[0] ?? ""),
    photoUrl: c.photoUrl,
    coach: ph.stage >= 5 ? ph.coachName : ph.assessCoachName,
    centre: c.centreName ?? "TIC Kandivali",
    planLabel,
    stage: ph.stage,
    phase: ph.key,
    navSub: ph.stage < 4 ? "Locked" : ph.stage === 4 ? "Choose" : null,
    today: topDate(t),
    nowISO: t.toISOString(),
    action: await getTopAction(clientId),
    todo: ph.pending.length,
    whatsapp: { display: wa, digits: wa.replace(/[^\d]/g, ""), prefill: `Hi, this is ${fullName}, ${c.code}.` },
    rate: lastDone ? { sessionId: lastDone.id, label: dayLabel(lastDone.startsAt), score: lastDone.ratings[0]?.score ?? null, note: lastDone.ratings[0]?.note ?? "" } : null,
    issueSessions: ph.upcoming.filter((s) => s.kind !== "community").slice(0, 4).map((s) => ({ id: s.id, label: `${s.title} · ${dayTime(s.startsAt)}` })),
    bookingClosed: ph.bookingClosed,
  };
}
