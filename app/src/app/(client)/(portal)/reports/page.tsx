import type { Metadata } from "next";
import Link from "next/link";
import { requireClient } from "@/server/auth/guards";
import { listReports } from "@/server/client/results";
import s from "@/components/client/results/results.module.css";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

/** 05 Reports list: released reports only, plus the reassessment placeholder after a baseline. */
export default async function ReportsPage() {
  const { client } = await requireClient();
  const items = await listReports(client.id);
  const hasRe = items.some((r) => r.kind === "REASSESSMENT");
  const rows = [
    ...items.map((r) => ({ key: r.id, type: r.type, meta: r.meta, href: `/reports/${r.id}` as string | null })),
    ...(items.length && !hasRe ? [{ key: "re", type: "Reassessment report", meta: "After your reassessment", href: null }] : []),
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1100 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span className={s.kicker}>Released after head coach review · saved to Documents</span>
        <h1 className={s.h1}>Reports.</h1>
      </div>
      {rows.length > 0 && (
        <div style={{ border: "2px solid var(--ink)", display: "flex", flexDirection: "column" }}>
          {rows.map((r) => {
            const inner = (
              <>
                <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ font: "600 17px var(--font-sans)", color: r.href ? "var(--ink)" : "var(--grey-400)" }}>{r.type}</span>
                  <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--grey-600)" }}>{r.meta}</span>
                </span>
                <span style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700, color: r.href ? "var(--ink)" : "var(--grey-400)" }}>{r.href ? "Open →" : "Not yet"}</span>
              </>
            );
            const st = { borderBottom: "1px solid var(--grey-200)", padding: 18, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "6px 16px", alignItems: "center" } as const;
            return r.href ? (
              <Link key={r.key} href={r.href} className={s.rowBtn} style={st}>
                {inner}
              </Link>
            ) : (
              <div key={r.key} style={{ ...st, cursor: "default" }} aria-disabled="true">
                {inner}
              </div>
            );
          })}
        </div>
      )}
      {rows.length === 0 && <p style={{ margin: 0, font: "400 15px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>No reports yet. Your assessment report is released after practitioner and head coach review.</p>}
    </div>
  );
}
