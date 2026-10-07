"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds";
import { checkIn, rateSession, setPaused, tellPractitioner } from "@/server/client/day/actions";
import { useDayToast } from "./DayToast";
import s from "./day.module.css";

/** Header action "I am here" / "✓ Checked in" (04 §4.2). */
export function CheckInButton({ sessionId, checked, disabledReason }: { sessionId: string; checked: boolean; disabledReason?: string }) {
  const [pending, start] = useTransition();
  const toast = useDayToast();
  const router = useRouter();
  if (checked)
    return (
      <span className={`${s.headAct} ${s.headActDone}`} role="status">
        ✓ Checked in
      </span>
    );
  if (disabledReason) return null;
  return (
    <button
      type="button"
      className={`${s.headAct} ${s.headActBlue}`}
      disabled={pending}
      style={{ opacity: pending ? 0.6 : 1 }}
      onClick={() =>
        start(async () => {
          const r = await checkIn(sessionId);
          if (r.error) toast(r.error);
          else if (r.toast) toast(r.toast);
          router.replace(`/day/${sessionId}?view=checkin`, { scroll: false });
          router.refresh();
        })
      }
    >
      I am here
    </button>
  );
}

export function ResumeButton({ sessionId }: { sessionId: string }) {
  const [pending, start] = useTransition();
  const toast = useDayToast();
  const router = useRouter();
  return (
    <Button
      variant="blue"
      size="md"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await setPaused(sessionId, false);
          toast(r.error ?? r.toast ?? "");
          router.refresh();
        })
      }
    >
      RESUME
    </Button>
  );
}

const CHIPS = [
  ["pain", "Pain today"],
  ["water", "I need water"],
  ["break", "I need a break"],
  ["other", "Something else"],
] as const;

/** "Tell your practitioner something": chips + a few words → Assessment.clientMessage, IssueReport, practitioner outbox. */
export function TellPanel({ sessionId, coach, onSent }: { sessionId: string; coach: string; onSent: () => void }) {
  const [chip, setChip] = useState<string>("");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const toast = useDayToast();
  const router = useRouter();
  const send = () =>
    start(async () => {
      const r = await tellPractitioner(sessionId, chip, text);
      if (r.error) return setErr(r.error);
      setErr("");
      setChip("");
      setText("");
      if (r.toast) toast(r.toast);
      onSent();
      router.refresh();
    });
  return (
    <div className={s.panel} id="tell-panel">
      <span className={s.label} id="tell-title">
        Tell your practitioner something
      </span>
      <div className={s.chips} role="radiogroup" aria-labelledby="tell-title">
        {CHIPS.map(([k, label]) => (
          <button key={k} type="button" role="radio" aria-checked={chip === k} className={`${s.chip} ${chip === k ? s.chipOn : ""}`} onClick={() => setChip(chip === k ? "" : k)}>
            {label}
          </button>
        ))}
      </div>
      <label className={s.srOnly} htmlFor="tell-text">
        A few words, optional
      </label>
      <input id="tell-text" className={s.input} placeholder="A few words, optional" value={text} maxLength={500} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
      {err && <span className={s.err}>{err}</span>}
      <Button variant="blue" size="md" full disabled={pending} onClick={send}>
        SEND TO {coach.toUpperCase()}
      </Button>
    </div>
  );
}

/** Sticky action bar (Tell / Pause) and the tell panel under it (04 today). */
export function TodayActions({ sessionId, coach, paused }: { sessionId: string; coach: string; paused: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const toast = useDayToast();
  const router = useRouter();
  const pause = () =>
    start(async () => {
      const r = await setPaused(sessionId, !paused);
      toast(r.error ?? r.toast ?? "");
      router.refresh();
    });
  return (
    <>
      <div className={s.actionBar}>
        <Button variant="outline" size="md" full onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="tell-panel">
          TELL {coach.toUpperCase()}
        </Button>
        <Button variant="outline" size="md" full disabled={pending} onClick={pause}>
          {paused ? "RESUME" : "PAUSE"}
        </Button>
      </div>
      {open && <TellPanel sessionId={sessionId} coach={coach} onSent={() => setOpen(false)} />}
    </>
  );
}

/** "How was today?" one tap rating + optional note, autosaved. */
export function RatingBox({ sessionId, score: initialScore, note: initialNote }: { sessionId: string; score: number; note: string }) {
  const [score, setScore] = useState(initialScore);
  const [note, setNote] = useState(initialNote);
  const [saved, setSaved] = useState<string>(initialScore ? "Saved" : "");
  const [, start] = useTransition();
  const save = (sc: number, nt: string) => {
    if (!sc) return setSaved(nt ? "Pick a number to save your note" : "");
    setSaved("Saving");
    start(async () => {
      const r = await rateSession(sessionId, sc, nt);
      setSaved(r.error ?? "Saved");
    });
  };
  return (
    <div className={s.panel}>
      <span className={s.label} id="rate-title">
        How was today?
      </span>
      <div className={s.rates} role="radiogroup" aria-labelledby="rate-title">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={score === n}
            aria-label={`${n} of 5`}
            className={`${s.rate} ${n <= score ? s.rateOn : ""}`}
            onClick={() => {
              setScore(n);
              save(n, note);
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <label className={s.srOnly} htmlFor="rate-note">
        Anything to add, optional
      </label>
      <input
        id="rate-note"
        className={`${s.input} ${s.inputSoft}`}
        placeholder="Anything to add, optional"
        value={note}
        maxLength={1000}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => note !== initialNote && save(score, note)}
        onKeyDown={(e) => e.key === "Enter" && save(score, note)}
      />
      <span className={s.saved} aria-live="polite">
        {saved}
      </span>
    </div>
  );
}
