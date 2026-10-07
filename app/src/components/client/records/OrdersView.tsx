import Link from "next/link";
import { getOrdersView } from "@/server/client/records/orders";
import { payInvoice } from "@/server/client/records/actions";
import { prisma } from "@/server/db";
import { waLink } from "./catalog";
import { PageHead, Segments } from "./parts";
import { ActRaw } from "./ui";
import s from "./records.module.css";

const CHIP = {
  Paid: { background: "var(--ink)", color: "#fff", boxShadow: "none" },
  Overdue: { background: "var(--blue)", color: "#fff", boxShadow: "none" },
  Due: { background: "#fff", color: "var(--ink)", boxShadow: "inset 0 0 0 1.5px var(--ink)" },
} as const;

export async function OrdersView({ clientId }: { clientId: string }) {
  const v = await getOrdersView(clientId);
  const client = await prisma.clientProfile.findUniqueOrThrow({ where: { id: clientId } });
  return (
    <div className={s.page} style={{ maxWidth: 1120 }}>
      <PageHead kicker="Shopify orders and ADITUS GST invoices" title="Orders and invoices." />
      {(v.pkg || v.reassessed) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 16 }}>
          {v.pkg && (
            <div className={s.card} style={{ padding: 18, gap: 14 }}>
              <span style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>
                <span>Active package</span>
                <span style={{ color: "var(--grey-600)" }}>Valid till {v.pkg.validTill}</span>
              </span>
              <span className={s.display24}>{v.pkg.title}</span>
              <Segments used={v.pkg.used} total={v.pkg.total} height={10} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: "1px solid var(--grey-200)" }}>
                <span style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 2 }}>
                  <span className={s.meta}>Used</span>
                  <b style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 24 }}>{v.pkg.used}</b>
                </span>
                <span style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 2 }}>
                  <span className={s.meta}>Left</span>
                  <b style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 24 }}>{Math.max(0, v.pkg.total - v.pkg.used)}</b>
                </span>
                <span style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 2 }}>
                  <span className={s.meta}>Includes</span>
                  <b style={{ fontSize: 12, paddingTop: 6 }}>Baseline + reassessment</b>
                </span>
              </div>
            </div>
          )}
          {v.reassessed && (
            <div style={{ background: "var(--blue)", color: "#fff", padding: 18, display: "flex", flexDirection: "column", gap: 12, justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ice)" }}>Reassessment done</span>
              <span className={s.display24}>Talk to your coach about what is next.</span>
              <a href={waLink(`Hi, this is ${client.firstName} ${client.lastName}, ${client.code}. A message for Coach ${v.coach} about what is next.`)} target="_blank" rel="noreferrer" className={s.whiteBtn}>
                MESSAGE {v.coach.toUpperCase()} →
              </a>
            </div>
          )}
        </div>
      )}

      <div className={s.card}>
        <div className={`${s.thead} ${s.orderCols}`} style={{ gap: 12, padding: "12px 18px", borderBottom: "2px solid var(--ink)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--grey-600)" }}>
          <span>Number</span>
          <span>Package or item</span>
          <span>Date</span>
          <span>Amount</span>
          <span>GST</span>
          <span>Status</span>
          <span />
        </div>
        {v.rows.map((r) => (
          <div key={r.key} className={s.orderRow}>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <b style={{ fontSize: 12 }}>{r.no}</b>
              <span className={s.meta}>{r.src}</span>
            </span>
            <span style={{ font: "600 14px var(--font-sans)" }}>{r.item}</span>
            <span style={{ fontSize: 12 }}>{r.date}</span>
            <span style={{ font: "600 14px var(--font-sans)" }}>{r.amount}</span>
            <span style={{ fontSize: 12, color: "var(--grey-700)" }}>GST {r.gst}</span>
            <span>
              <span style={{ display: "inline-flex", height: 24, alignItems: "center", padding: "0 8px", fontSize: 10, textTransform: "uppercase", ...CHIP[r.status] }}>{r.status}</span>
            </span>
            {r.status === "Paid" ? (
              <Link href={`/orders/${encodeURIComponent(r.no)}/invoice`} className={s.link}>
                Download
              </Link>
            ) : (
              <ActRaw action={payInvoice.bind(null, r.no)} className={s.link} style={{ textAlign: "left" }}>
                Pay now
              </ActRaw>
            )}
          </div>
        ))}
        {v.rows.length === 0 && <p style={{ margin: 0, padding: 18, font: "400 15px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>No orders yet. Everything you buy from ADITUS appears here with its GST invoice.</p>}
      </div>
    </div>
  );
}
