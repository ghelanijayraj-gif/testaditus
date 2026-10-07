"use client";

import { useState } from "react";
import { Button } from "@/components/ds";
import { approveAndRelease, returnWithComment } from "@/server/consoles/actions";
import { useRun } from "@/components/staff/consoles/ui";
import s from "./evaluate.module.css";

/** Head coach actions on an evaluation report: approve and release, return with a comment, or edit the evaluation. */
export function EvalReviewActions({ reportId, clientId, status, canAct, line }: { reportId: string; clientId: string; status: string; canAct: boolean; line: string }) {
  const { run, pending } = useRun();
  const [returning, setReturning] = useState(false);
  const [comment, setComment] = useState("");
  const waiting = status === "PENDING_APPROVAL";
  const released = status === "RELEASED";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className={s.bar}>
        <div className={s.status}>
          <span className={s.chip + (released || waiting ? " " + s.chipInk : "")}>{released ? "Released" : waiting ? "Waiting for you" : status === "RETURNED" ? "Returned" : "Draft"}</span>
          <span>{line}</span>
        </div>
        <div className={s.actions}>
          {canAct && (
            <>
              <Button variant={released ? "ink" : "blue"} size="sm" disabled={!waiting || pending} onClick={() => run(() => approveAndRelease(reportId))}>
                {released ? "✓ RELEASED" : "APPROVE AND RELEASE"}
              </Button>
              <Button variant="outline" size="sm" disabled={!waiting || pending} onClick={() => setReturning(!returning)}>
                RETURN WITH COMMENT
              </Button>
            </>
          )}
          {!released && (
            <Button variant="outline" size="sm" href={`/staff/evaluate/${clientId}`}>
              {canAct ? "EDIT EVALUATION" : "OPEN EVALUATION"}
            </Button>
          )}
        </div>
      </div>
      {returning && (
        <div className={s.card}>
          <div className={s.input}>
            <textarea className={s.text} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What should the coach change?" aria-label="Comment for the coach" />
            <div className={s.actions}>
              <Button variant="ink" size="sm" disabled={pending || comment.trim().length < 3} onClick={() => run(() => returnWithComment(reportId, comment), { onOk: () => setReturning(false) })}>
                SEND BACK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
