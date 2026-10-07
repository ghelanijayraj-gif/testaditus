import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClient } from "@/server/auth/guards";
import { getInvoiceDoc } from "@/server/client/records/orders";
import { PrintButton } from "@/components/client/records/PrintButton";
import s from "@/components/client/records/records.module.css";

export const metadata: Metadata = { title: "Invoice" };

/** Printable invoice (Download on Orders). Print styles hide the portal chrome. */
export default async function InvoicePage({ params }: { params: Promise<{ number: string }> }) {
  const { client } = await requireClient();
  const { number } = await params;
  const inv = await getInvoiceDoc(client.id, decodeURIComponent(number));
  if (!inv) notFound();
  const row = (k: string, v: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--grey-200)", fontSize: 13 }}>
      <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--grey-600)" }}>{k}</span>
      <span style={{ textAlign: "right" }}>{v}</span>
    </div>
  );
  return (
    <div className={s.page} style={{ maxWidth: 760 }}>
      <style>{`@media print{body *{visibility:hidden}#invoice,#invoice *{visibility:visible}#invoice{position:absolute;left:0;top:0;width:100%;border:0!important}}`}</style>
      <div className={s.noPrint} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <Link href="/orders" className={s.link} style={{ fontWeight: 400, fontSize: 12 }}>
          ← Orders and invoices
        </Link>
        <PrintButton />
      </div>
      <div id="invoice" className={s.card} style={{ padding: "clamp(20px,4vw,40px)", gap: 22 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16 }}>
          <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>ADITUS</span>
            <span style={{ fontSize: 11, color: "var(--grey-600)", lineHeight: 1.5 }}>
              GSTIN placeholder · XXXXXXXXXXXXXXX
              <br />
              TIC Kandivali, Mumbai
            </span>
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "right" }}>
            <span className={s.kicker}>{inv.kind}</span>
            <b style={{ fontSize: 16 }}>{inv.number}</b>
            <span style={{ fontSize: 12 }}>{inv.date}</span>
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className={s.meta}>Billed to</span>
          <span style={{ font: "600 15px var(--font-sans)" }}>{inv.billTo.name}</span>
          <span style={{ fontSize: 12, color: "var(--grey-700)" }}>
            {inv.billTo.code} · {inv.billTo.email}
            {inv.billTo.city ? ` · ${inv.billTo.city}` : ""}
          </span>
        </div>
        <div>
          {row("Item", inv.item)}
          {row("Amount, GST included", inv.amount)}
          {row(`GST at ${inv.rate} percent`, inv.gst)}
          {inv.payment && row("Paid by", inv.payment)}
          {row("Status", inv.status)}
        </div>
        <span style={{ fontSize: 11, color: "var(--grey-600)", lineHeight: 1.5 }}>Prices are placeholders until the plan catalogue is final. Keep this for your records.</span>
      </div>
    </div>
  );
}
