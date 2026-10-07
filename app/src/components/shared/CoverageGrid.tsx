/** 21 Shared · Coverage Grid. Purely presentational; rows come from lib/coverage.ts. */
export type CoverageRow = {
  sys: string;
  nowL: string;
  nowFill: string;
  nextL: string;
  nextFill: string;
  change: boolean;
  why: string;
  tags: string;
};

export function CoverageGrid({ title = "What your plan covers", legend = "Full · Partial · Not covered", rows }: { title?: string; legend?: string; rows: CoverageRow[] }) {
  return (
    <div style={{ fontFamily: "var(--font-mono)", color: "var(--ink)", border: "2px solid var(--ink)", background: "#fff", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ padding: "12px 14px", borderBottom: "2px solid var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 16, textTransform: "uppercase" }}>{title}</span>
        <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--grey-600)" }}>{legend}</span>
      </div>
      {rows.map((r) => (
        <div key={r.sys} style={{ padding: "12px 14px", borderBottom: "1px solid var(--grey-200)", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 13, textTransform: "uppercase", minWidth: 110 }}>{r.sys}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 28, height: 12, boxShadow: "inset 0 0 0 2px var(--blue)", display: "block" }} aria-hidden>
                <span style={{ display: "block", height: "100%", width: r.nowFill, background: "var(--blue)" }} />
              </span>
              <b style={{ fontSize: 10, textTransform: "uppercase" }}>{r.nowL}</b>
            </span>
            {r.change && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--grey-600)" }}>
                <span style={{ fontSize: 11 }}>→</span>
                <span style={{ width: 28, height: 12, boxShadow: "inset 0 0 0 1.5px var(--grey-400)", display: "block" }} aria-hidden>
                  <span style={{ display: "block", height: "100%", width: r.nextFill, background: "var(--ice)" }} />
                </span>
                <span style={{ fontSize: 10, textTransform: "uppercase" }}>{r.nextL} when done</span>
              </span>
            )}
          </div>
          <span style={{ font: "400 13px/1.4 var(--font-sans)", color: "var(--grey-700)" }}>{r.why}</span>
          <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--blue)" }}>{r.tags}</span>
        </div>
      ))}
    </div>
  );
}
