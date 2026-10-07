"use client";

import { useEffect } from "react";
import { markReportStep } from "@/server/client/results/actions";
import { useReadOnly } from "@/components/client/readonly";

/** Records that the client opened a report (step 0) or reached a walkthrough step. */
export function MarkReportStep({ reportId, step }: { reportId: string; step: number }) {
  const ro = useReadOnly();
  useEffect(() => {
    if (!ro) void markReportStep(reportId, step).catch(() => {});
  }, [reportId, step, ro]);
  return null;
}

/** Print route: open the browser's print dialog once the page has rendered (Save as PDF). */
export function PrintOnLoad() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <button type="button" data-noprint onClick={() => window.print()} style={{ alignSelf: "flex-start", height: 36, border: "2px solid var(--ink)", background: "#fff", padding: "0 14px", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: 12, textTransform: "uppercase" }}>
      Print or save as PDF
    </button>
  );
}
