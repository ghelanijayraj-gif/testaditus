import Link from "next/link";
import type { MyEvaluations as Data } from "@/server/evaluation/assign";
import s from "./flow.module.css";

/** A coach's evaluations: what to do now first, the rest folded away. */
export function MyEvaluations({ d }: { d: Data }) {
  return (
    <div className={s.lanes}>
      <section className={s.lane} aria-labelledby="mine-todo">
        <div className={s.laneHead}>
          <h2 className={s.laneTitle} id="mine-todo">
            To do <span className={s.laneN}>{d.todo.length}</span>
          </h2>
          <span className={s.laneHint}>Assigned to you by the head coach</span>
        </div>
        {d.todo.length === 0 && <span className={s.empty}>Nothing assigned to you right now. New evaluations show up here.</span>}
        {d.todo.map((r) => {
          const started = r.progress.done > 0;
          return (
            <div key={r.reportId} className={s.row}>
              <Link href={`/staff/evaluate/${r.clientId}`} className={s.rowMain}>
                <span className={s.who}>
                  <span className={s.name}>{r.name}</span>
                  <span className={s.meta}>{[r.city, r.assigned].filter(Boolean).join(" · ")}</span>
                  {started && (
                    <span className={s.bar} aria-label={`${r.progress.done} of ${r.progress.total} answered`}>
                      <span className={s.barFill} style={{ display: "block", width: `${Math.round((r.progress.done / r.progress.total) * 100)}%` }} />
                    </span>
                  )}
                </span>
                <span className={s.right}>
                  {r.returned && <span className={s.chip + " " + s.chipBlue}>Returned</span>}
                  {r.due && <span className={s.due}>{r.due}</span>}
                  <span className={s.go + (r.returned ? " " + s.goBlue : "")}>{r.returned ? "Fix →" : started ? "Continue →" : "Start →"}</span>
                </span>
              </Link>
              {r.returned && <p className={s.note}>“{r.returned}”</p>}
            </div>
          );
        })}
      </section>

      {d.waiting.length > 0 && (
        <details className={s.more}>
          <summary>
            <span>With the head coach · {d.waiting.length}</span>
          </summary>
          {d.waiting.map((r) => (
            <div key={r.reportId} className={s.row}>
              <Link href={`/staff/evaluate/${r.clientId}`} className={s.rowMain}>
                <span className={s.who}>
                  <span className={s.name}>{r.name}</span>
                  <span className={s.meta}>Submitted · waiting for approval</span>
                </span>
                <span className={s.right}>
                  <span className={s.chip + " " + s.chipInk}>With head coach</span>
                </span>
              </Link>
            </div>
          ))}
        </details>
      )}

      {d.done.length > 0 && (
        <details className={s.more}>
          <summary>
            <span>Released recently · {d.done.length}</span>
          </summary>
          {d.done.map((r) => (
            <div key={r.reportId} className={s.row}>
              <Link href={`/staff/review/${r.reportId}`} className={s.rowMain}>
                <span className={s.who}>
                  <span className={s.name}>{r.name}</span>
                  <span className={s.meta}>Released {r.releasedAt}</span>
                </span>
              </Link>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}
