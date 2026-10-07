import type { Metadata } from "next";
import Link from "next/link";
import { requireClient } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { dateLong, dayTime } from "@/lib/format";
import { KIND_OF } from "@/server/client/phase";
import { STATUS_LABEL, TYPE_INFO } from "@/server/client/shell/core";

export const metadata: Metadata = { title: "Search" };

const DOC_TYPE: Record<string, string> = {
  BLOOD_TEST: "Blood test",
  XRAY: "Scan",
  MRI: "Scan",
  PHYSIO_NOTE: "Notes",
  DOCTOR_NOTE: "Notes",
  ASSESSMENT_REPORT: "Assessment PDF",
  REASSESSMENT_REPORT: "Assessment PDF",
  PROGRESS_PHOTO: "Photos and videos",
  PROGRESS_VIDEO: "Photos and videos",
  INVOICE: "Invoice",
  CONSENT: "Consent",
  OTHER: "Other",
};

type Hit = { href: string; title: string; meta: string };

/** Top bar search: the client's own documents, released reports and sessions. */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { client } = await requireClient();
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").trim().slice(0, 80);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const match = (...fields: (string | null | undefined)[]) => {
    const hay = fields.filter(Boolean).join(" ").toLowerCase();
    return words.length > 0 && words.every((w) => hay.includes(w));
  };

  let groups: { title: string; hits: Hit[] }[] = [];
  if (words.length) {
    const [docs, reports, sessions] = await Promise.all([
      prisma.document.findMany({ where: { clientId: client.id, status: "READY" }, orderBy: { createdAt: "desc" } }),
      prisma.report.findMany({ where: { clientId: client.id, status: "RELEASED" }, orderBy: { releasedAt: "desc" }, include: { author: { include: { user: true } } } }),
      prisma.session.findMany({ where: { clientId: client.id }, orderBy: { startsAt: "desc" }, include: { coach: { include: { user: true } }, centre: true } }),
    ]);
    const reAll = reports.filter((r) => r.kind === "REASSESSMENT");
    groups = [
      {
        title: "Documents",
        hits: docs
          .filter((d) => match(d.title, d.filename, DOC_TYPE[d.type], d.source === "CLIENT" ? "added by you" : "aditus"))
          .map((d) => ({ href: `/documents?file=${d.id}`, title: d.title, meta: `${d.source === "CLIENT" ? "Added by you" : "ADITUS"} · ${DOC_TYPE[d.type]} · ${dateLong(d.testDate ?? d.createdAt)}` })),
      },
      {
        title: "Reports",
        hits: reports
          .map((r) => {
            const n = reAll.length - reAll.indexOf(r);
            const title = r.kind === "BASELINE" ? "Assessment report" : reAll.length > 1 ? `Reassessment ${n} report` : "Reassessment report";
            return { r, title };
          })
          .filter(({ r, title }) => match(title, r.kind === "BASELINE" ? "baseline" : "reassessment", r.author?.user.name, r.startingPoint))
          .map(({ r, title }) => ({ href: `/reports/${r.id}`, title, meta: `${r.kind === "BASELINE" ? "Baseline · " : ""}${r.releasedAt ? dateLong(r.releasedAt) : ""}${r.author?.user.name ? " · " + r.author.user.name : ""}` })),
      },
      {
        title: "Sessions",
        hits: sessions
          .filter((s) => match(s.title, TYPE_INFO[KIND_OF[s.type]].label, s.coach?.user.name, s.centre?.name, STATUS_LABEL[s.status], dayTime(s.startsAt)))
          .slice(0, 20)
          .map((s) => ({ href: `/calendar?session=${s.id}`, title: s.title, meta: `${dayTime(s.startsAt)} · ${TYPE_INFO[KIND_OF[s.type]].label} · ${STATUS_LABEL[s.status]}` })),
      },
    ];
  }
  const total = groups.reduce((n, g) => n + g.hits.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 880 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--grey-600)" }}>{q ? `${total} ${total === 1 ? "result" : "results"} for “${q}”` : "Documents, reports, sessions"}</span>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(30px,4.4vw,56px)", lineHeight: 0.88, textTransform: "uppercase" }}>Search.</h1>
      </div>
      <form action="/search" role="search" style={{ display: "flex", gap: 8 }}>
        <input
          name="q"
          type="search"
          defaultValue={q}
          aria-label="Search documents, reports, sessions"
          placeholder="Search documents, reports, sessions"
          style={{ flex: 1, height: 50, border: "2px solid var(--ink)", padding: "0 14px", fontSize: 13, fontFamily: "var(--font-mono)", borderRadius: 0, minWidth: 0 }}
        />
        <button type="submit" style={{ height: 50, padding: "0 20px", border: 0, background: "var(--ink)", color: "#fff", fontFamily: "var(--font-display)", fontSize: 13, cursor: "pointer" }}>
          SEARCH →
        </button>
      </form>
      {q && total === 0 && <span style={{ font: "400 15px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>Nothing matches. Try a document name, “report”, or a session type.</span>}
      {groups
        .filter((g) => g.hits.length)
        .map((g) => (
          <div key={g.title} style={{ border: "2px solid var(--ink)", display: "flex", flexDirection: "column" }}>
            <span style={{ padding: "14px 16px 10px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>
              {g.title} · {g.hits.length}
            </span>
            {g.hits.map((h) => (
              <Link key={h.href} href={h.href} style={{ borderTop: "1px solid var(--grey-200)", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 3, textDecoration: "none" }}>
                <span style={{ font: "600 14px var(--font-sans)" }}>{h.title}</span>
                <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>{h.meta}</span>
              </Link>
            ))}
          </div>
        ))}
    </div>
  );
}
