import type { Metadata } from "next";
import Link from "next/link";
import { requireClient } from "@/server/auth/guards";
import { getExportView } from "@/server/client/records/exportpkg";
import { PrintButton } from "@/components/client/records/PrintButton";
import s from "@/components/client/records/records.module.css";

export const metadata: Metadata = { title: "Export index" };

/** Printable index of the export pack: every item with a link to each file. Stands in for the zip. */
export default async function ExportIndexPage() {
  const { client } = await requireClient();
  const v = await getExportView(client.id);
  return (
    <div className={s.page} style={{ maxWidth: 860 }}>
      <style>{`@media print{body *{visibility:hidden}#export-index,#export-index *{visibility:visible}#export-index{position:absolute;left:0;top:0;width:100%}}`}</style>
      <div className={s.noPrint} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <Link href="/export" className={s.link} style={{ fontWeight: 400, fontSize: 12 }}>
          ← Your export
        </Link>
        <PrintButton label="PRINT THIS INDEX" />
      </div>
      <div id="export-index" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className={s.titleCol}>
          <span className={s.kicker}>{v.pkg ? `${v.pkg.count} files · prepared ${v.pkg.prepared}` : "Not prepared yet"}</span>
          <h1 className={s.h1} style={{ fontSize: "clamp(26px,3.4vw,40px)" }}>
            ADITUS export, {v.name}.
          </h1>
        </div>
        {(v.pkg?.items ?? []).map((x) => (
          <section key={x.key} id={x.key} className={s.card}>
            <div style={{ padding: "13px 18px", display: "flex", flexDirection: "column", gap: 2 }} className={s.rowLine}>
              <span style={{ font: "600 16px var(--font-sans)" }}>{x.t}</span>
              <span className={s.meta}>{x.d}</span>
            </div>
            {x.files.map((f) => (
              <div key={f.href} style={{ padding: "11px 18px", display: "flex", justifyContent: "space-between", gap: 12 }} className={s.rowLine}>
                <span style={{ fontSize: 13 }}>{f.label}</span>
                <a href={f.href} className={s.link}>
                  {f.href.includes("/invoice") ? "Open →" : "PDF →"}
                </a>
              </div>
            ))}
            {x.files.length === 0 && <span style={{ padding: "11px 18px", fontSize: 12, color: "var(--grey-600)" }}>Included in the emailed download.</span>}
          </section>
        ))}
      </div>
    </div>
  );
}
