import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireClient } from "@/server/auth/guards";
import { liveState, loadDaySession } from "@/server/client/day/load";
import { dayLabel, timeLabel } from "@/lib/format";
import { Button } from "@/components/ds";
import { DayChrome } from "@/components/client/day/DayChrome";
import { CloseView } from "@/components/client/day/CloseView";
import { LiveFlow, type LiveStep } from "@/components/client/day/LiveFlow";
import s from "@/components/client/day/day.module.css";

export const metadata: Metadata = { title: "Live session" };
export const dynamic = "force-dynamic";

const LATE_MS = 5 * 60_000;

export default async function LivePage({ params, searchParams }: { params: Promise<{ sessionId: string }>; searchParams: Promise<{ step?: string }> }) {
  const { sessionId } = await params;
  const { step: stepParam } = await searchParams;
  const { client } = await requireClient();
  const d = await loadDaySession(client.id, sessionId);
  const { session: ses, coachName: coach } = d;

  // In person sessions only use the guided photo step here; everything else lives on /day.
  const photosOnly = !ses.online;
  if (photosOnly && stepParam !== "photos") redirect(`/day/${ses.id}`);

  const joined = !!(d.check?.joinedAt ?? (ses.online ? ses.checkedInAt : null));
  const t = d.now.getTime();
  const started = t > ses.startsAt.getTime();
  const ended = t > d.endsAt.getTime();
  const missed = ses.online && !joined && (ses.status === "MISSED" || (ended && !d.finished) || (d.finished && !joined));

  if (ses.online && missed) {
    return (
      <DayChrome>
        <span className={s.kicker}>
          Live online · {dayLabel(ses.startsAt)} · {timeLabel(ses.startsAt)}
        </span>
        <div className={s.missed}>
          <span className={s.missedTitle}>We missed you on {dayLabel(ses.startsAt)}.</span>
          <span className={s.missedLine}>It happens. Your intake and photos are saved. Pick a new time with {coach}.</span>
          <Button variant="blue" size="md" href={`/calendar?session=${ses.id}`}>
            PICK A NEW TIME →
          </Button>
        </div>
      </DayChrome>
    );
  }

  if (ses.online && d.finished && joined) {
    return (
      <DayChrome>
        <CloseView sessionId={ses.id} coach={coach} score={d.rating?.score ?? 0} note={d.rating?.note ?? ""} online />
      </DayChrome>
    );
  }

  if (ses.status === "CANCELLED" || ses.status === "RESCHEDULED") redirect(`/calendar?session=${ses.id}`);

  const step: LiveStep = stepParam === "setup" || stepParam === "photos" || stepParam === "call" ? stepParam : joined ? "call" : "setup";
  const initial = await liveState(d);
  const photos: Record<string, string> = {};
  for (const [view, p] of Object.entries(d.photos)) photos[view] = p.id;

  return (
    <LiveFlow
      sessionId={ses.id}
      step={step}
      photosOnly={photosOnly}
      backHref={photosOnly ? `/day/${ses.id}` : undefined}
      coach={coach}
      kicker={`${ses.online ? "Live online" : "In person"} · ${dayLabel(ses.startsAt)} · ${timeLabel(ses.startsAt)}`}
      startsLabel={timeLabel(ses.startsAt)}
      joinUrl={ses.joinUrl}
      photoConsent={d.photoConsent}
      photos={photos}
      linkTested={!!d.check?.linkTestedAt}
      connection={d.check?.connection ?? null}
      clientLate={ses.online && !joined && started && t - ses.startsAt.getTime() > LATE_MS && !ended}
      practitionerLate={ses.online && started && t - ses.startsAt.getTime() > LATE_MS && !ended}
      initial={initial}
    />
  );
}
