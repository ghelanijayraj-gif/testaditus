"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { assignEvaluation } from "@/server/evaluation/actions";
import type { AssignBoard as Board } from "@/server/evaluation/assign";
import { useToast } from "@/components/ui/Toast";
import s from "./flow.module.css";

/** Head of department: assign evaluations to coaches, approve what comes back, see who has what. */
export function AssignBoard({ b }: { b: Board }) {
  const [open, setOpen] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const assign = (clientId: string, coachId: string) =>
    start(async () => {
      const r = await assignEvaluation(clientId, coachId);
      toast(r.error ?? r.toast ?? "Assigned.");
      if (!r.error) {
        setOpen(null);
        router.refresh();
      }
    });

  const Picker = ({ clientId, current }: { clientId: string; current?: string | null }) => (
    <div className={s.picker}>
      <span className={s.pickHint}>{current ? "Move to" : "Assign to"}</span>
      <div className={s.coaches}>
        {b.coaches.map((c) => (
          <button key={c.id} type="button" className={s.coach + (c.id === current ? " " + s.coachOn : "")} disabled={pending || c.id === current} onClick={() => assign(clientId, c.id)}>
            <span className={s.coachName}>{c.name}</span>
            <span className={s.coachLoad}>{c.open === 0 ? "Free" : `${c.open} open`}</span>
          </button>
        ))}
      </div>
      <button type="button" className={s.link} style={{ alignSelf: "flex-start" }} onClick={() => setOpen(null)}>
        Cancel
      </button>
    </div>
  );

  return (
    <div className={s.lanes}>
      <section className={s.lane} aria-labelledby="lane-ready">
        <div className={s.laneHead}>
          <h2 className={s.laneTitle} id="lane-ready">
            1 · Ready to assign <span className={s.laneN}>{b.ready.length}</span>
          </h2>
          <span className={s.laneHint}>Photos and videos are in</span>
        </div>
        {b.ready.length === 0 && <span className={s.empty}>Nothing waiting. New uploads land here.</span>}
        {b.ready.map((r) => (
          <div key={r.clientId} className={s.row}>
            <div className={s.rowMain}>
              <span className={s.who}>
                <span className={s.name}>{r.name}</span>
                <span className={s.meta}>
                  {[r.city, `${r.uploads} uploads`, r.submitted ? `Submitted ${r.submitted}` : null].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className={s.right}>
                {open !== r.clientId && (
                  <button type="button" className={s.go + " " + s.goBlue} onClick={() => setOpen(r.clientId)}>
                    Assign →
                  </button>
                )}
              </span>
            </div>
            {open === r.clientId && <Picker clientId={r.clientId} />}
          </div>
        ))}
      </section>

      <section className={s.lane} aria-labelledby="lane-approve">
        <div className={s.laneHead}>
          <h2 className={s.laneTitle} id="lane-approve">
            2 · Waiting for your approval <span className={s.laneN}>{b.approval.length}</span>
          </h2>
          <span className={s.laneHint}>Coach has submitted</span>
        </div>
        {b.approval.length === 0 && <span className={s.empty}>Nothing to approve.</span>}
        {b.approval.map((r) => (
          <div key={r.reportId} className={s.row}>
            <Link href={`/staff/review/${r.reportId}`} className={s.rowMain}>
              <span className={s.who}>
                <span className={s.name}>{r.name}</span>
                <span className={s.meta}>
                  By {r.coach}
                  {r.submitted ? ` · submitted ${r.submitted}` : ""}
                </span>
              </span>
              <span className={s.right}>
                {r.due && <span className={s.due}>{r.due}</span>}
                <span className={s.go}>Review →</span>
              </span>
            </Link>
          </div>
        ))}
      </section>

      <section className={s.lane} aria-labelledby="lane-coaches">
        <div className={s.laneHead}>
          <h2 className={s.laneTitle} id="lane-coaches">
            3 · With coaches <span className={s.laneN}>{b.withCoaches.length}</span>
          </h2>
          <span className={s.laneHint}>Being evaluated</span>
        </div>
        {b.withCoaches.length === 0 && <span className={s.empty}>No evaluations in progress.</span>}
        {b.withCoaches.map((r) => (
          <div key={r.reportId} className={s.row}>
            <div className={s.rowMain}>
              <span className={s.who}>
                <span className={s.name}>{r.name}</span>
                <span className={s.meta}>
                  {r.coach}
                  {r.due ? ` · ${r.due}` : ""}
                </span>
              </span>
              <span className={s.right}>
                <span className={s.chip + (r.state.tone === "blue" ? " " + s.chipBlue : r.state.tone === "ink" ? " " + s.chipInk : "")}>{r.state.label}</span>
                {open !== r.reportId && (
                  <button type="button" className={s.link} onClick={() => setOpen(r.reportId)}>
                    Change coach
                  </button>
                )}
              </span>
            </div>
            {open === r.reportId && <Picker clientId={r.clientId} current={r.coachId} />}
          </div>
        ))}
      </section>
    </div>
  );
}
