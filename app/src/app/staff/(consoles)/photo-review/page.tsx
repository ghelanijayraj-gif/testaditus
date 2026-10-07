import type { Metadata } from "next";
import Link from "next/link";
import { consoleCtx } from "@/server/consoles/access";
import { loadPhotoQueue } from "@/server/consoles/data";
import { NoAccess } from "@/components/staff/consoles/Bits";
import s from "@/components/staff/consoles/consoles.module.css";

export const metadata: Metadata = { title: "Assessments to review" };

const VN = { photo: "Photo", video: "Video", inperson: "In Person" } as const;
const FILTERS = [["all", "All"], ["photo", "Photo"], ["video", "Video"], ["inperson", "In Person"]] as const;

/** 11 queue: every assessment item by module with its due time, filtered by version. */
export default async function PhotoQueuePage({ searchParams }: { searchParams: Promise<{ version?: string }> }) {
  const ctx = await consoleCtx();
  if (!ctx.allowed) return <NoAccess what="the assessment review queue" />;
  const vf = (await searchParams).version ?? "all";
  const rows = (await loadPhotoQueue(ctx)).filter((r) => vf === "all" || r.version === vf);
  return (
    <>
      <div className={s.filterBar}>
        <span style={{ flex: "none", fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)", marginRight: 4 }}>Version</span>
        {FILTERS.map(([k, l]) => (
          <Link key={k} href={k === "all" ? "/staff/photo-review" : `/staff/photo-review?version=${k}`} scroll={false} className={s.filter + (vf === k ? " " + s.filterOn : "")} aria-current={vf === k ? "true" : undefined}>
            {l}
          </Link>
        ))}
      </div>
      <main className={s.qMain}>
        <h1 className={s.qH1}>Assessments to review.</h1>
        <div className={s.box}>
          <div className={s.qCols + " " + s.qHead}>
            <span>Client</span>
            <span>Version</span>
            <span>Status</span>
            <span>Due</span>
          </div>
          {rows.length === 0 && <div style={{ padding: "14px 18px", font: "400 15px var(--font-sans)" }}>Nothing to review here.</div>}
          {rows.map((q) => {
            const strong = q.status === "Ready to review" || q.status === "Submitted for review";
            const more = q.status === "More photos needed";
            const chip = { background: more ? "var(--ice)" : strong ? "var(--ink)" : "#fff", color: strong ? "#fff" : "var(--ink)", boxShadow: `inset 0 0 0 1.5px ${more ? "var(--blue)" : "var(--ink)"}` };
            const body = (
              <>
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <b style={{ font: "600 15px var(--font-sans)" }}>{q.client}</b>
                  <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>
                    {q.city} · {q.coach}
                  </span>
                </span>
                <span style={{ fontSize: 12 }}>{VN[q.version]}</span>
                <span style={{ justifySelf: "start", fontSize: 10, textTransform: "uppercase", padding: "3px 7px", ...chip }}>{q.status}</span>
                <b style={{ fontSize: 12 }}>{q.due}</b>
              </>
            );
            return q.href ? (
              <Link key={q.key} href={q.href} className={s.qCols + " " + s.qRow}>
                {body}
              </Link>
            ) : (
              <div key={q.key} className={s.qCols + " " + s.qRow}>
                {body}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
