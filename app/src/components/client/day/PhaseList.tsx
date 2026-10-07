import type { Phase } from "./phases";
import s from "./day.module.css";

/** 04 today: the seven phase rows (box, name, status). Pure, usable from server and client. */
export function PhaseList({ phases, paused }: { phases: Phase[]; paused?: boolean }) {
  return (
    <ol className={s.phases} aria-label="Today's phases">
      {phases.map((p) => {
        const cur = p.state === "CURRENT";
        const done = p.state === "DONE";
        const nn = p.state === "NOT_NEEDED";
        return (
          <li key={p.key} className={`${s.phase} ${cur ? s.phaseCur : ""}`} aria-current={cur ? "step" : undefined}>
            <span className={`${s.box} ${done ? s.boxDone : cur ? s.boxCur : ""}`} aria-hidden>
              {done ? "✓" : ""}
            </span>
            <span className={`${s.phaseName} ${nn ? s.phaseNameMuted : ""}`}>{p.label}</span>
            <span className={s.phaseSt}>{done ? "Done" : cur ? (paused ? "Paused" : "Now") : nn ? "Not needed" : ""}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** 04 live side panel: compact phase rows; current row ink. */
export function LivePhaseList({ phases, captured, total }: { phases: Phase[]; captured: number; total: number }) {
  return (
    <ol className={s.lphases} aria-label="Session phases">
      {phases.map((p) => {
        const cur = p.state === "CURRENT";
        const done = p.state === "DONE";
        return (
          <li key={p.key} className={`${s.lphase} ${cur ? s.lphaseCur : ""}`} aria-current={cur ? "step" : undefined}>
            <span>
              {done ? "✓ " : cur ? "● " : ""}
              {p.label}
            </span>
            <span>{done ? "Done" : cur ? `${captured} of ${total}` : p.state === "NOT_NEEDED" ? "Not needed" : ""}</span>
          </li>
        );
      })}
    </ol>
  );
}
