import { RatingBox } from "./DayActions";
import s from "./day.module.css";

/** 04 close (in person and live online). */
export function CloseView({ sessionId, coach, score, note, online }: { sessionId: string; coach: string; score: number; note: string; online?: boolean }) {
  const lines = [
    `${coach} writes up your results and picks your 3 to 5 priorities.`,
    "The head coach checks every report before it is released.",
    "You get a WhatsApp and an email when it is ready. Then you choose a plan.",
  ];
  return (
    <>
      <span className={`${s.kicker} ${s.kickerBlue}`}>✓ All phases done</span>
      <h1 className={s.h1}>Your assessment is done.</h1>
      <span className={s.lead}>Your report will be ready within XX hours. We will tell you on WhatsApp and email.</span>
      {online && <span className={s.micro}>Online measures that need hands on contact are tagged Observed</span>}
      <RatingBox sessionId={sessionId} score={score} note={note} />
      <div className={s.next}>
        <span className={s.kicker} style={{ color: "var(--ink)" }}>
          What happens next
        </span>
        {lines.map((t, i) => (
          <span key={i} className={s.nextLine}>
            <span className={s.nextN}>{String(i + 1).padStart(2, "0")}</span>
            {t}
          </span>
        ))}
      </div>
    </>
  );
}
