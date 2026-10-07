import type { Metadata } from "next";
import Link from "next/link";
import { consoleCtx } from "@/server/consoles/access";
import { loadReviewQueue } from "@/server/consoles/data";
import { NoAccess, TitleRow } from "@/components/staff/consoles/Bits";
import s from "@/components/staff/consoles/consoles.module.css";

export const metadata: Metadata = { title: "Review queue" };

/** 10.9 Head coach queue: reports waiting, returned and recently released. */
export default async function ReviewQueuePage() {
  const ctx = await consoleCtx();
  if (!ctx.allowed) return <NoAccess what="the head coach review queue" />;
  const rows = await loadReviewQueue(ctx);
  return (
    <main className={s.main}>
      <TitleRow ctx={ctx.canApprove ? "Head coach · Assessments waiting" : "Read only · the head coach approves"} title="Review queue." />
      <div className={s.box}>
        {rows.length === 0 && <div style={{ padding: "14px 18px", font: "400 15px var(--font-sans)" }}>Nothing waiting for review.</div>}
        {rows.map((q) => {
          const chip = q.status === "Released" ? { background: "var(--ink)", color: "#fff" } : q.status === "Waiting" ? { background: "var(--ice)", color: "var(--ink)" } : { background: "#fff", color: "var(--ink)" };
          return (
            <Link key={q.id} href={`/staff/review/${q.id}`} className={s.qRow} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,160px),1fr))", gap: "6px 16px", alignItems: "center" }}>
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <b style={{ font: "600 15px var(--font-sans)" }}>{q.client}</b>
                <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>{q.what}</span>
              </span>
              <span style={{ fontSize: 12 }}>
                {q.coach} · {q.when}
                {q.due ? <span style={{ color: "var(--grey-600)" }}> · {q.due}</span> : null}
              </span>
              <span style={{ fontSize: 10, textTransform: "uppercase", justifySelf: "start", padding: "3px 7px", boxShadow: "inset 0 0 0 1.5px var(--ink)", ...chip }}>{q.status}</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
