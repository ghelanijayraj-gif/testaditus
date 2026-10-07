import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { requireClient } from "@/server/auth/guards";
import { ToastProvider } from "@/components/ui/Toast";
import { PlanHeader } from "@/components/client/plan/PlanHeader";
import { invoiceNumberOf } from "@/server/checkout/handlers";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = { title: "Checkout" };

const COPY: Record<string, [string, string]> = {
  "online-assessment": ["Online Assessment.", "An intake, then guided photos, movement videos and self tests at home. A practitioner reviews everything and writes your report."],
  "in-person-session": ["In person session.", "Movement Assessment, Breath Session and Trial Training with a practitioner at the centre."],
};

/** Dev Shopify checkout (simulated). Real build: Shopify Storefront checkout + orders/paid webhook. */
export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client } = await requireClient();
  const co = await prisma.checkout.findUnique({ where: { id } });
  if (!co || (co.clientId && co.clientId !== client.id)) notFound();
  if (co.purpose.split(":")[0] === "invoice_payment") {
    const number = invoiceNumberOf(co);
    const inv = number ? await prisma.invoice.findFirst({ where: { number, clientId: client.id } }) : null;
    if (!inv) notFound();
    return (
      <ToastProvider bottom={24}>
        <div style={{ minHeight: "100vh", fontFamily: "var(--font-mono)", color: "var(--ink)", display: "flex", flexDirection: "column", background: "#fff" }}>
          <PlanHeader name={`${client.firstName} ${client.lastName}`} city={client.city ?? ""} />
          <CheckoutView id={co.id} title={`Invoice ${inv.number}.`} lead={`${inv.item}. Includes GST at ${inv.gstRate}%.`} item={inv.item} price={inv.amountLabel} city={client.city ?? ""} pin={client.pin ?? ""} mumbai={client.inMumbaiArea} offerInPerson={false} paid={!!co.paidAt || inv.status === "PAID"} />
        </div>
      </ToastProvider>
    );
  }
  const product = await prisma.product.findUnique({ where: { slug: co.productSlug } });
  if (!product) notFound();
  const [title, lead] =
    COPY[product.slug] ??
    [`${product.name}.`, product.sessions ? `${product.sessions} sessions over ${product.validityDays ?? 45} days with your coach, built from your report.` : product.name];
  return (
    <ToastProvider bottom={24}>
      <div style={{ minHeight: "100vh", fontFamily: "var(--font-mono)", color: "var(--ink)", display: "flex", flexDirection: "column", background: "#fff" }}>
        <PlanHeader name={`${client.firstName} ${client.lastName}`} city={client.city ?? ""} />
        <CheckoutView
          id={co.id}
          title={title}
          lead={lead}
          item={product.name}
          price={product.priceLabel}
          city={client.city ?? ""}
          pin={client.pin ?? ""}
          mumbai={client.inMumbaiArea}
          offerInPerson={client.inMumbaiArea && product.slug === "online-assessment"}
          paid={!!co.paidAt}
        />
      </div>
    </ToastProvider>
  );
}
