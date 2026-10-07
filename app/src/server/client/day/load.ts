import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";
import { dayLabel } from "@/lib/format";
import { readPhases, allDone, type Phase } from "@/components/client/day/phases";

/** Load one of the client's own sessions for the day / live screens. 404 for anyone else's. */
export async function loadDaySession(clientId: string, sessionId: string) {
  const s = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { coach: { include: { user: true } }, centre: true, assessment: true, client: { include: { consents: true } } },
  });
  if (!s || s.clientId !== clientId) notFound();
  const a = s.assessment;
  const [captured, check, rating, media] = await Promise.all([
    a ? prisma.measureValue.count({ where: { assessmentId: a.id, notTested: false } }) : Promise.resolve(0),
    prisma.dayCheck.findUnique({ where: { sessionId } }),
    prisma.sessionRating.findFirst({ where: { clientId, sessionId }, orderBy: { createdAt: "desc" } }),
    prisma.mediaAsset.findMany({ where: { clientId, kind: "PHOTO", supersededById: null, moduleKey: s.online ? "live" : "inperson", view: { in: ["front", "side", "back"] } }, orderBy: { capturedAt: "desc" } }),
  ]);
  const phases: Phase[] = readPhases(a?.phases);
  const t = now();
  const coachName = s.coach?.user.name?.split(" ")[0] ?? "Your practitioner";
  const consent = (k: string) => s.client?.consents.find((c) => c.kind === k)?.granted;
  // Photos need both the general photos and videos consent and the assessment media consent (if asked).
  const photoConsent = consent("PHOTOS_VIDEOS") === true && consent("ASSESSMENT_MEDIA") !== false;
  const endsAt = new Date(s.startsAt.getTime() + s.durationMin * 60_000);
  const sameDay = dayLabel(s.startsAt) === dayLabel(t);
  const finished = s.status === "DONE" || !!a?.submittedAt || allDone(phases);
  const photos: Record<string, { id: string; at: Date }> = {};
  for (const m of media) if (!photos[m.view]) photos[m.view] = { id: m.id, at: m.capturedAt };

  return {
    session: s,
    assessment: a,
    phases,
    captured,
    total: a?.measuresTotal ?? 24,
    check,
    rating,
    photos,
    photoConsent,
    coachName,
    coachPhoto: s.coach?.photoUrl ?? null,
    now: t,
    endsAt,
    sameDay,
    finished,
  };
}

export type DayData = Awaited<ReturnType<typeof loadDaySession>>;

/** Latest pushed cue and latest timed cue for the live screen. */
export async function liveCues(assessmentId: string | null | undefined) {
  if (!assessmentId) return { cue: null, timer: null };
  const [cue, timer] = await Promise.all([
    prisma.liveCue.findFirst({ where: { assessmentId }, orderBy: { createdAt: "desc" } }),
    prisma.liveCue.findFirst({ where: { assessmentId, timerSeconds: { not: null } }, orderBy: { createdAt: "desc" } }),
  ]);
  return { cue, timer };
}

export { onTheWay, heOr } from "@/components/client/day/phases";

/** Client id of the signed in client, or null (for JSON routes, which must not redirect). */
export async function clientIdOrNull() {
  const { clientAuth } = await import("@/server/auth/client");
  const session = await clientAuth();
  if (!session?.user?.id || session.user.kind !== "CLIENT") return null;
  const c = await prisma.clientProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  return c?.id ?? null;
}

export type LiveState = {
  phases: Phase[];
  captured: number;
  total: number;
  paused: boolean;
  finished: boolean;
  cue: { id: string; text: string } | null;
  timer: { id: string; label: string; seconds: number; elapsed: number } | null;
};

/** Everything the live screen polls for (no measure values, only counts). */
export async function liveState(d: DayData): Promise<LiveState> {
  const { cue, timer } = await liveCues(d.assessment?.id);
  return {
    phases: d.phases,
    captured: d.captured,
    total: d.total,
    paused: !!d.assessment?.paused,
    finished: d.finished,
    cue: cue ? { id: cue.id, text: cue.text } : null,
    timer: timer?.timerSeconds ? { id: timer.id, label: timer.text, seconds: timer.timerSeconds, elapsed: Math.max(0, Math.min(timer.timerSeconds, (d.now.getTime() - timer.createdAt.getTime()) / 1000)) } : null,
  };
}
