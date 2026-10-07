"use client";

import { useState } from "react";
import { Button } from "@/components/ds";
import { setTestKeys, startAssessment } from "@/server/consoles/actions";
import { SYS_LABEL, type TestDef } from "./lib";
import { Check, useFlash, useRun } from "./ui";
import s from "./consoles.module.css";

/** Suggested tests: the full bank, toggled in or out (Assessment.testKeys), then Start assessment. */
export function SuggestedTests({ assessmentId, bank, initial, why, online, started }: { assessmentId: string; bank: TestDef[]; initial: string[]; why: Record<string, string>; online: boolean; started: boolean }) {
  const [keys, setKeys] = useState<string[]>(initial);
  const { run, pending } = useRun();
  const flash = useFlash();
  const toggle = (k: string) => {
    const next = keys.includes(k) ? keys.filter((x) => x !== k) : [...keys, k];
    setKeys(next);
    setTestKeys(assessmentId, next).then((r) => r?.error && flash(r.error), () => flash("Saved on tablet. Check the connection."));
  };
  const n = keys.filter((k) => bank.some((t) => t.key === k)).length;
  return (
    <div className={s.sticky}>
      <div className={s.box}>
        <div className={s.boxHead}>
          <b>Suggested tests</b>
          <span className={s.boxMeta}>{n} tests · about XX min</span>
        </div>
        {bank.map((t) => {
          const on = keys.includes(t.key);
          const w = why[t.key] ?? (online && t.availability === "IN_PERSON" ? "In person only" : "");
          return (
            <button key={t.key} type="button" onClick={() => toggle(t.key)} aria-pressed={on} className={s.rowBtn} style={{ minHeight: 44, padding: "8px 16px", display: "grid", gridTemplateColumns: "24px minmax(0,1fr) auto", gap: 10, alignItems: "center" }}>
              <Check on={on} />
              <span style={{ font: "500 14px var(--font-sans)" }}>
                {t.name} <span style={{ font: "400 10px var(--font-mono)", color: "var(--grey-600)", textTransform: "uppercase" }}>· {SYS_LABEL[t.system]}</span>
              </span>
              <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--grey-600)" }}>{w}</span>
            </button>
          );
        })}
      </div>
      <Button variant="blue" size="lg" full disabled={pending || n === 0} onClick={() => run(() => startAssessment(assessmentId, keys))}>
        {started ? "BACK TO THE ASSESSMENT →" : "START ASSESSMENT →"}
      </Button>
    </div>
  );
}
