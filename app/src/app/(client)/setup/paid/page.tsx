import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { clientAuth } from "@/server/auth/client";
import { Button, Label } from "@/components/ds";
import { AccessShell } from "@/components/client/access/AccessShell";
import { checkOrderSig } from "@/server/onboarding/tokens";
import { dayLabel, rupees } from "@/lib/format";
import { TZ } from "@/lib/clock";
import s from "@/components/client/access/access.module.css";

export const metadata: Metadata = { title: "Payment confirmed", robots: { index: false } };

/**
 * 01 `paid`: "Your assessment starts here." with the Shopify order summary. Reached from the
 * checkout return and the welcome email. Shown with the signed link we hand out (`k`), or to
 * the signed in owner of the order.
 */
export default async function PaidPage({ searchParams }: { searchParams: Promise<{ order?: string; k?: string }> }) {
  const sp = await searchParams;
  const n = (sp.order ?? "").replace(/^#/, "");
  if (!n) notFound();
  const order = await prisma.order.findUnique({ where: { number: "#" + n }, include: { client: { include: { user: true } } } });
  if (!order) notFound();
  let ok = checkOrderSig(n, sp.k);
  if (!ok) {
    const session = await clientAuth();
    ok = !!session?.user?.id && session.user.id === order.client.userId;
  }
  if (!ok) notFound();
  const { client } = order;
  const email = client.user.email;
  const year = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric" }).format(order.placedAt);
  const gst = order.amountPaise ? rupees(Math.round((order.amountPaise * 18) / 118)) : "₹X,XXX";
  const meta: [string, string][] = [
    ["Date", `${dayLabel(order.placedAt)} ${year}`],
    ["Paid with", order.paymentMethod ?? "Card"],
    ["Includes GST", gst],
  ];
  const next = client.accountSetupDone ? "/" : `/signin?email=${encodeURIComponent(email)}`;
  return (
    <AccessShell screen="paid" first={client.firstName} right={`Order ${order.number}`}>
      <div className={s.ruled}>
        <div className={s.orderHead}>
          <span className={s.orderNo}>Order {order.number}</span>
          <Label tone="ink">✓ PAID</Label>
        </div>
        <div className={s.orderItem}>
          <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className={s.orderTitle}>{order.item}</span>
            {order.productLine && <span className={s.orderLine}>{order.productLine}</span>}
          </span>
          <span className={s.orderTitle} style={{ whiteSpace: "nowrap" }}>{order.amountLabel}</span>
        </div>
        <div className={s.orderMeta}>
          {meta.map(([k, v]) => (
            <div key={k} className={s.metaCell}>
              <span className={s.metaKey}>{k}</span>
              <span className={s.metaVal}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      {!client.accountSetupDone && (
        <div className={s.ice}>
          <span className={s.iceTitle}>We have emailed you a link to set up your account.</span>
          <span className={s.iceLine}>Sent to {email} · The link expires in 48 hours</span>
        </div>
      )}
      <Button href={next} variant="ink" size="lg" full>CONTINUE TO ADITUS →</Button>
      <span className={s.note}>No email? Check spam, or WhatsApp us on +91 98200 41700.</span>
    </AccessShell>
  );
}
