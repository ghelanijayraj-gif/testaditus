import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireClient } from "@/server/auth/guards";
import { heOr, loadDaySession, onTheWay } from "@/server/client/day/load";
import { dayLabel, timeLabel } from "@/lib/format";
import { Button, ImageSlot } from "@/components/ds";
import { Lock } from "@/components/ui/Lock";
import { DayChrome } from "@/components/client/day/DayChrome";
import { CheckInButton, ResumeButton, TodayActions } from "@/components/client/day/DayActions";
import { PhaseList } from "@/components/client/day/PhaseList";
import { CloseView } from "@/components/client/day/CloseView";
import { AutoRefresh } from "@/components/client/day/AutoRefresh";
import { currentPhase, started } from "@/components/client/day/phases";
import s from "@/components/client/day/day.module.css";

export const metadata: Metadata = { title: "Assessment day" };
export const dynamic = "force-dynamic";

const BRING = "Water, and glasses if you wear them. Shorts and a fitted T shirt.";

export default async function DayPage({ params, searchParams }: { params: Promise<{ sessionId: string }>; searchParams: Promise<{ view?: string }> }) {
  const { sessionId } = await params;
  const { view } = await searchParams;
  const { client } = await requireClient();
  const d = await loadDaySession(client.id, sessionId);
  const { session: ses, coachName: coach } = d;
  if (ses.online) redirect(`/live/${ses.id}`);

  const checked = !!ses.checkedInAt;
  const when = `${d.sameDay ? "Today · " : ""}${dayLabel(ses.startsAt)} · ${timeLabel(ses.startsAt)}`;

  // Moved or missed: nothing to check in to.
  if (ses.status === "CANCELLED" || ses.status === "RESCHEDULED" || (ses.status === "MISSED" && !checked)) {
    return (
      <DayChrome>
        <span className={s.kicker}>{when}</span>
        <div className={s.missed}>
          <span className={s.missedTitle}>{ses.status === "MISSED" ? `We missed you on ${dayLabel(ses.startsAt)}.` : "This session has moved."}</span>
          <span className={s.missedLine}>{ses.status === "MISSED" ? `It happens. Your intake and photos are saved. Pick a new time with ${coach}.` : "Your calendar has the new time."}</span>
          <Button variant="blue" size="md" href={`/calendar?session=${ses.id}`}>
            {ses.status === "MISSED" ? "PICK A NEW TIME →" : "OPEN CALENDAR →"}
          </Button>
        </div>
      </DayChrome>
    );
  }

  // Close: all phases done (practitioner finished) or the session is marked done.
  if (d.finished && checked) {
    return (
      <DayChrome>
        <CloseView sessionId={ses.id} coach={coach} score={d.rating?.score ?? 0} note={d.rating?.note ?? ""} />
      </DayChrome>
    );
  }

  // Check in: before arrival, or right after tapping I am here.
  if (!checked || view === "checkin") {
    const centre = ses.centre;
    const rows = [
      centre && { k: "Where", v: `${centre.name} · ${centre.address}` },
      centre?.entryNote && { k: "Entry", v: centre.entryNote },
      { k: "Bring", v: BRING },
    ].filter(Boolean) as { k: string; v: string }[];
    const role = ses.type === "IN_PERSON_ASSESSMENT" || ses.type === "MOVEMENT_ASSESSMENT" || ses.type === "ASSESSMENT" ? "Assessment practitioner" : (ses.coach?.title ?? "Your coach");
    return (
      <DayChrome action={<CheckInButton sessionId={ses.id} checked={checked} disabledReason={d.sameDay ? undefined : "not today"} />}>
        {checked && <AutoRefresh ms={5000} />}
        <span className={s.kicker}>{when}</span>
        <h1 className={s.h1}>{checked ? onTheWay(coach) : `Welcome, ${client.firstName}.`}</h1>
        <span className={s.lead}>
          {checked
            ? `Take a seat in the lounge. ${heOr(coach)} will come and get you in a minute or two.`
            : d.sameDay
              ? `Tap I am here when you walk in. ${coach} gets a message and comes to find you.`
              : `On the day, tap I am here when you walk in. ${coach} gets a message and comes to find you.`}
        </span>
        <div className={s.meet}>
          <div className={s.meetPic}>
            <ImageSlot caption={coach.toUpperCase()} src={d.coachPhoto ?? undefined} />
          </div>
          <div className={s.meetBody}>
            <span className={s.micro}>You are meeting</span>
            <b className={s.meetName}>{coach}</b>
            <span className={s.meetRole}>{role}</span>
          </div>
        </div>
        <div className={s.info}>
          {rows.map((r) => (
            <div key={r.k} className={s.infoRow}>
              <span className={s.infoKey}>{r.k}</span>
              <span className={s.infoVal}>{r.v}</span>
            </div>
          ))}
          {centre?.directionsUrl && (
            <a className={s.infoLink} href={centre.directionsUrl} target="_blank" rel="noreferrer">
              Directions in Google Maps →
            </a>
          )}
        </div>
        {checked && (
          <Button variant="ink" size="lg" full href={`/day/${ses.id}?view=today`}>
            SEE TODAY&apos;S ASSESSMENT →
          </Button>
        )}
      </DayChrome>
    );
  }

  // Today: phase tracker, polled every 5 s.
  const paused = !!d.assessment?.paused;
  const now = currentPhase(d.phases);
  return (
    <DayChrome>
      <AutoRefresh ms={5000} />
      <span className={s.topRow}>
        <span className={s.kicker}>Today&apos;s assessment · with {coach}</span>
        <span className={s.privacy}>
          <Lock size={10} />
          Only you, {coach}, head coach
        </span>
      </span>
      {paused && (
        <div className={s.banner}>
          <span className={s.bannerText}>
            <b className={s.bannerTitle}>Paused. {coach} knows.</b>
            <span className={s.bannerSub}>Take the time you need. Nothing is lost.</span>
          </span>
          <ResumeButton sessionId={ses.id} />
        </div>
      )}
      <div className={s.now} aria-live="polite">
        {started(d.phases) && now ? (
          <>
            <span className={s.nowKick}>Now · {now.label}</span>
            <span className={s.nowLine}>{now.line}</span>
          </>
        ) : (
          <>
            <span className={s.nowKick}>Now · Check in</span>
            <span className={s.nowLine}>{onTheWay(coach)} Your assessment starts when you meet.</span>
          </>
        )}
        <span className={s.nowCount}>
          {d.captured} of {d.total} measures captured · values appear in your report
        </span>
      </div>
      {d.phases.length > 0 && <PhaseList phases={d.phases} paused={paused} />}
      {d.assessment && <TodayActions sessionId={ses.id} coach={coach} paused={paused} />}
    </DayChrome>
  );
}
