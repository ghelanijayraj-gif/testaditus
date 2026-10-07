import { SYSTEMS, foldMeasures, fmtV, hasValue, type MeasureRow, type TestDef } from "./lib";
import s from "./consoles.module.css";

/** All measures by system (static), as in the console's live summary. */
export function MeasureSummary({ bank, testKeys, measures }: { bank: TestDef[]; testKeys: string[]; measures: MeasureRow[] }) {
  const st = foldMeasures(measures);
  const keys = new Set([...testKeys, ...Object.keys(st)]);
  const tests = bank.filter((t) => keys.has(t.key));
  return (
    <div className={s.box}>
      {SYSTEMS.map((g) => {
        const rows = tests.filter((t) => t.system === g.key);
        if (!rows.length) return null;
        return (
          <div key={g.key} style={{ padding: "10px 16px", borderBottom: "1px solid var(--grey-200)", display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--blue)" }}>{g.label}</span>
            {rows.map((t) => {
              const v = st[t.key];
              return (
                <span key={t.key} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, color: hasValue(v) || v?.skipped ? "var(--ink)" : "var(--grey-400)" }}>
                  <span>
                    {v?.flag ? "● " : ""}
                    {t.name}
                  </span>
                  <b style={{ whiteSpace: "nowrap" }}>{fmtV(t, v)}</b>
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
