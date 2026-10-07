import Link from "next/link";
import { ImageSlot, Label, Pill } from "@/components/ds";
import { getDocumentsView, type DocFilters } from "@/server/client/records/documents";
import { DOC_FILTERS } from "./catalog";
import { PageHead } from "./parts";
import { UrlDrawer } from "./ui";
import { Uploader } from "./Uploader";
import { LinkSelect } from "./LinkSelect";
import s from "./records.module.css";

const DEFAULTS: Required<Omit<DocFilters, "file">> = { tab: "files", type: "All", source: "All", link: "all", date: "all", layout: "grid" };

export async function DocumentsView({ clientId, filters }: { clientId: string; filters: DocFilters }) {
  const v = await getDocumentsView(clientId, filters);
  const cur = { ...v.filters };
  const href = (over: Partial<DocFilters>) => {
    const next = { ...cur, ...over } as Record<string, string | undefined>;
    const q = new URLSearchParams();
    for (const [k, val] of Object.entries(next)) if (val && k !== "file" && val !== (DEFAULTS as Record<string, string>)[k]) q.set(k, val);
    if (over.file) q.set("file", over.file);
    const qs = q.toString();
    return "/documents" + (qs ? "?" + qs : "");
  };
  const pill = { whiteSpace: "nowrap", flex: "none" } as const;

  return (
    <div className={s.page}>
      <PageHead
        kicker="Evidence vault"
        title="Documents."
        who={`Who can see this: you, Coach ${v.coach} and the head coach`}
        right={
          <nav className={s.tabs} aria-label="Documents">
            {[
              ["files", "All files"],
              ["sent", "Sent to you"],
            ].map(([k, l]) => (
              <Link key={k} href={href({ tab: k })} scroll={false} className={`${s.tab} ${cur.tab === k ? s.tabOn : ""}`} aria-current={cur.tab === k ? "page" : undefined}>
                {l}
              </Link>
            ))}
          </nav>
        }
      />

      {cur.tab === "files" && (
        <>
          <Uploader closed={v.readOnly} />

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }} aria-label="Type">
              {DOC_FILTERS.map(([k, l]) => (
                <Pill key={k} href={href({ type: k })} active={cur.type === k} style={pill}>
                  {l}
                </Pill>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[
                  ["All", "All sources"],
                  ["you", "Added by you"],
                  ["aditus", "Shared by ADITUS"],
                ].map(([k, l]) => (
                  <Pill key={k} href={href({ source: k })} active={cur.source === k} style={pill}>
                    {l}
                  </Pill>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <LinkSelect
                  label="Date"
                  value={cur.date}
                  options={[
                    ["all", "All time"],
                    ["30d", "Last 30 days"],
                    ["6m", "Last 6 months"],
                  ].map(([value, label]) => ({ value, label, href: href({ date: value }) }))}
                />
                <LinkSelect
                  label="Linked measure"
                  value={cur.link}
                  options={[
                    ["all", "Any measure"],
                    ["movement", "Movement"],
                    ["breathwork", "Breath"],
                    ["recovery", "Recovery"],
                    ["performance", "Performance"],
                  ].map(([value, label]) => ({ value, label, href: href({ link: value }) }))}
                />
                <div className={s.seg} style={{ gridTemplateColumns: "1fr 1fr" }} role="group" aria-label="Layout">
                  {[
                    ["grid", "Grid"],
                    ["list", "List"],
                  ].map(([k, l]) => (
                    <Link key={k} href={href({ layout: k })} scroll={false} className={`${s.segBtn} ${cur.layout === k ? s.segOn : ""}`} style={{ height: 33 }} aria-current={cur.layout === k ? "true" : undefined}>
                      {l}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {v.files.length > 0 && cur.layout === "grid" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,220px),1fr))", borderTop: "1px solid var(--grey-200)", borderLeft: "1px solid var(--grey-200)" }}>
              {v.files.map((f) => (
                <Link key={f.id} href={href({ file: f.id })} scroll={false} className={s.rowBtn} style={{ borderRight: "1px solid var(--grey-200)", borderBottom: "1px solid var(--grey-200)", padding: 0, display: "flex", flexDirection: "column" }}>
                  <div style={{ position: "relative", aspectRatio: "4/3", width: "100%" }}>
                    <ImageSlot caption={f.cap} src={f.image ? `/api/files/${f.id}?preview=1` : undefined} />
                    <span style={{ position: "absolute", top: 12, left: 12 }}>
                      <Label tone={f.mine ? "ice" : "ink"}>{f.source}</Label>
                    </span>
                  </div>
                  <div style={{ padding: "12px 14px 16px", display: "flex", flexDirection: "column", gap: 4, borderTop: "2px solid var(--ink)", width: "100%" }}>
                    <span style={{ font: "600 15px/1.3 var(--font-sans)" }}>{f.name}</span>
                    <span className={s.meta}>
                      {f.type} · {f.date}
                    </span>
                    {f.supports && <span style={{ fontSize: 10, color: "var(--blue)" }}>Supports: {f.supports}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
          {v.files.length > 0 && cur.layout === "list" && (
            <div className={s.card}>
              {v.files.map((f) => (
                <Link key={f.id} href={href({ file: f.id })} scroll={false} className={`${s.rowBtn} ${s.docRow}`}>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ font: "600 15px var(--font-sans)" }}>{f.name}</span>
                    <span className={s.meta}>{f.type}</span>
                  </span>
                  <span style={{ fontSize: 11 }}>{f.date}</span>
                  <span>
                    <Label tone={f.mine ? "ice" : "ink"}>{f.source}</Label>
                  </span>
                  <span style={{ fontSize: 11, color: "var(--blue)" }}>{f.supports}</span>
                </Link>
              ))}
            </div>
          )}
          {v.files.length === 0 && <p style={{ margin: 0, font: "400 15px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>No files here yet. Anything you upload, and everything we share with you, lands in this vault.</p>}
        </>
      )}

      {cur.tab === "sent" && (
        <div className={s.card}>
          <div className={`${s.thead} ${s.sentCols}`} style={{ gap: 12, padding: "12px 18px", borderBottom: "2px solid var(--ink)", fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>
            <span>Date</span>
            <span>What we sent</span>
            <span>Channel</span>
            <span />
          </div>
          {v.sent.map((x) => (
            <div key={x.d + x.t} className={s.sentRow}>
              <span style={{ fontSize: 12 }}>{x.d}</span>
              <span style={{ font: "600 15px var(--font-sans)" }}>{x.t}</span>
              <span style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {x.ch.map((c) => (
                  <span key={c} style={{ fontSize: 9, textTransform: "uppercase", padding: "3px 6px", boxShadow: "inset 0 0 0 1.5px var(--ink)" }}>
                    {c}
                  </span>
                ))}
              </span>
              {x.docId ? (
                <Link href={href({ tab: "files", file: x.docId })} scroll={false} className={s.link}>
                  View
                </Link>
              ) : (
                <span />
              )}
            </div>
          ))}
          {v.sent.length === 0 && <p style={{ margin: 0, padding: 18, font: "400 15px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>Nothing sent yet. Reports, invoices and anything else we send you are listed here with the date and channel.</p>}
        </div>
      )}

      {v.open && (
        <UrlDrawer kicker="File" closeHref={href({})}>
          <div style={{ aspectRatio: "4/3", borderBottom: "2px solid var(--ink)", flex: "none", position: "relative" }}>
            {v.open.pdf ? (
              <iframe title={v.open.name} src={`/api/files/${v.open.id}`} style={{ width: "100%", height: "100%", border: 0, display: "block" }} />
            ) : (
              <ImageSlot caption={v.open.cap} src={v.open.image ? `/api/files/${v.open.id}` : undefined} />
            )}
          </div>
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8 }} className={s.rowLine}>
            <Label tone={v.open.mine ? "ice" : "ink"}>{v.open.source}</Label>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 0.92, textTransform: "uppercase" }}>{v.open.name}</span>
            <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--grey-600)" }}>
              {v.open.type} · {v.open.date}
            </span>
          </div>
          {v.open.rows.map(([k, val]) => (
            <div key={k} style={{ padding: "12px 18px", display: "flex", justifyContent: "space-between", gap: 14 }} className={s.rowLine}>
              <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--grey-600)" }}>{k}</span>
              <span style={{ fontSize: 13, textAlign: "right" }}>{val}</span>
            </div>
          ))}
          {v.open.values.length > 0 && (
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }} className={s.rowLine}>
              <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <b style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>Recorded values</b>
                <span style={{ fontSize: 10, color: "var(--grey-600)" }}>As written in your report</span>
              </span>
              <div style={{ border: "1px solid var(--grey-300)" }}>
                {v.open.values.map((x) => (
                  <div key={x.k} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, padding: "9px 12px", fontSize: 12 }} className={s.rowLine}>
                    <span>{x.k}</span>
                    <b>{x.v}</b>
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 10, color: "var(--grey-600)" }}>Copied from the PDF you uploaded. We do not interpret these here. Ask your doctor.</span>
            </div>
          )}
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
            <b style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>Access log</b>
            {v.open.log.map((lg, i) => (
              <span key={i} style={{ fontSize: 12, display: "flex", justifyContent: "space-between", gap: 10, borderBottom: "1px solid var(--grey-200)", paddingBottom: 6 }}>
                <span>{lg.who}</span>
                <span style={{ color: "var(--grey-600)" }}>{lg.when}</span>
              </span>
            ))}
          </div>
          <div style={{ padding: "4px 18px 22px", display: "flex", gap: 8 }}>
            <a href={`/api/files/${v.open.id}?download=1`} className={s.dlBtn}>
              DOWNLOAD
            </a>
          </div>
        </UrlDrawer>
      )}
    </div>
  );
}
