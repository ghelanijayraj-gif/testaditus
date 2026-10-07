import Link from "next/link";
import { getExportView } from "@/server/client/records/exportpkg";
import { renewPlan, requestExport } from "@/server/client/records/actions";
import { PageHead } from "./parts";
import { ActBtn } from "./ui";
import { ExportDownload } from "./ExportDownload";
import s from "./records.module.css";

export async function ExportView({ clientId }: { clientId: string }) {
  const v = await getExportView(clientId);
  return (
    <div className={s.page} style={{ maxWidth: 960 }}>
      <PageHead kicker={v.kicker} title={v.pkg ? "Your export is ready." : "Your export."} h1Style={{ fontSize: "clamp(28px,4vw,52px)" }} />
      {v.grace && (
        <div style={{ background: "var(--grey-50)", padding: "14px 18px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span style={{ font: "400 15px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>
            <b style={{ color: "var(--ink)", fontWeight: 600 }}>You can still read and download everything.</b> {v.grace}
          </span>
          <ActBtn action={renewPlan} variant="blue" size="sm">
            RENEW PLAN →
          </ActBtn>
        </div>
      )}
      {v.pkg ? (
        <>
          <div style={{ background: "var(--ink)", color: "#fff", padding: 20, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
            <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ font: "600 17px var(--font-sans)" }}>ADITUS export, {v.name}.zip</span>
              <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--grey-300)" }}>
                {v.pkg.count} files · prepared {v.pkg.prepared}
              </span>
            </span>
            <ExportDownload />
          </div>
          <div className={s.card}>
            {v.pkg.items.map((x) => (
              <div key={x.key} style={{ padding: "13px 18px", display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "center" }} className={s.rowLine}>
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ font: "600 15px var(--font-sans)" }}>{x.t}</span>
                  <span className={s.meta}>{x.d}</span>
                </span>
                {x.files.length === 1 ? (
                  <a href={x.files[0].href} className={s.link}>
                    PDF →
                  </a>
                ) : (
                  <Link href={`/export/index#${x.key}`} className={s.link}>
                    PDF →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={s.card} style={{ padding: "clamp(20px,3vw,32px)", gap: 12, maxWidth: 640 }}>
          <span className={s.display24}>Nothing prepared yet.</span>
          <span className={s.body}>We put every report, the Compare summary, your documents, invoices and consents into one download.</span>
          <div>
            <ActBtn action={requestExport} variant="ink" size="md">
              PREPARE MY EXPORT →
            </ActBtn>
          </div>
        </div>
      )}
      <span style={{ font: "400 14px/1.5 var(--font-sans)", color: "var(--grey-700)" }}>After access ends we keep your records for the period the law requires, then delete them. You can ask us to delete them sooner from Account.</span>
    </div>
  );
}
