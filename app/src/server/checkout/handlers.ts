import "server-only";
import type { Checkout, Product } from "@prisma/client";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";
import { dayLabel } from "@/lib/format";
import { nextOrderNumber } from "@/server/integrations/shopify";
import { notifier } from "@/server/integrations/notify";
import { ensureInPersonModule } from "@/server/client/plan/common";

/**
 * Simulated Shopify "orders/paid" webhook. Each purpose (brief: Shared contracts) creates
 * Order + Invoice (GST 18%), an ActivityLog row, an outbox message, and its state change.
 * Idempotent: a paid checkout returns its returnTo without side effects.
 */
export type PaidResult = { returnTo: string; orderNumber: string };

async function nextInvoiceNumber() {
  const year = now().getFullYear();
  const n = await prisma.invoice.count();
  return `INV ${year} ${String(420 + n).padStart(4, "0")}`;
}

function withParam(url: string, k: string, v: string) {
  return url + (url.includes("?") ? "&" : "?") + `${k}=${encodeURIComponent(v)}`;
}

export async function completeCheckout(checkoutId: string, paymentMethod = "UPI"): Promise<PaidResult> {
  const co = await prisma.checkout.findUnique({ where: { id: checkoutId } });
  if (!co) throw new Error("Checkout not found");
  if (co.paidAt) return { returnTo: co.returnTo, orderNumber: co.orderNumber ?? "" };
  if (!co.clientId) throw new Error("Checkout has no client");
  if (co.purpose.split(":")[0] === "invoice_payment") return payInvoice(co);
  const product = await prisma.product.findUnique({ where: { slug: co.productSlug } });
  if (!product) throw new Error("Unknown product " + co.productSlug);
  const client = await prisma.clientProfile.findUniqueOrThrow({ where: { id: co.clientId }, include: { user: true } });
  const at = now();

  const number = await nextOrderNumber();
  await prisma.order.create({
    data: { number, clientId: client.id, item: product.name, productLine: product.slug, paymentMethod, amountLabel: product.priceLabel, amountPaise: product.pricePaise, placedAt: at, shopifyId: `gid://shopify/Order/${co.id}` },
  });
  await prisma.invoice.create({ data: { number: await nextInvoiceNumber(), clientId: client.id, item: product.name, amountLabel: product.priceLabel, amountPaise: product.pricePaise, gstRate: 18, status: "PAID", issuedAt: at } });
  await prisma.checkout.update({ where: { id: co.id }, data: { paidAt: at, orderNumber: number } });

  const who = `${client.firstName} ${client.lastName}`;
  const purpose = co.purpose.split(":")[0];
  let returnTo = co.returnTo;
  let message = `Hi ${client.firstName}, thanks for your payment. Order ${number}: ${product.name}, ${product.priceLabel}.`;

  if (purpose === "in_person") {
    await handleInPerson(client.id);
    message += " Pick a centre and a time in your portal.";
    returnTo = withParam(returnTo, "t", "paid");
  } else if (purpose === "training_plan" || purpose === "renewal") {
    const plan = await handleTraining(co, product, client.id, purpose === "renewal");
    message += ` Your plan runs until ${dayLabel(plan.endsAt)}.`;
  } else if (purpose === "module_payment") {
    await handleModulePayment(co, client.id);
  }

  await prisma.activityLog.create({ data: { clientId: client.id, actorName: who, action: `Paid for ${product.name} · ${number}`, createdAt: at } });
  await notifier.send({ clientId: client.id, to: client.user.email, channel: "EMAIL", template: "order_paid", subject: `Order ${number} · ${product.name}`, body: message });
  return { returnTo, orderNumber: number };
}

/** in_person: the in person module is paid; the client continues to centre and time. */
async function handleInPerson(clientId: string) {
  const mod = await ensureInPersonModule(clientId);
  const data = { ...((mod.data as Record<string, unknown>) ?? {}), paidAt: now().toISOString() };
  await prisma.planModule.update({ where: { id: mod.id }, data: { paid: true, data, status: mod.status === "BOOKED" ? "BOOKED" : "NOT_STARTED", extraLine: null } });
  await prisma.clientProfile.update({ where: { id: clientId }, data: { recommendation: mod.status === "BOOKED" ? "BOOKED" : "ADDED", recommendationAt: now() } });
}

/** training_plan / renewal: ClientPlan (used 0, starts now, ends now + validity), stage TRAINING. */
async function handleTraining(co: Checkout, product: Product, clientId: string, renewal: boolean) {
  const at = now();
  const endsAt = new Date(at.getTime() + (product.validityDays ?? 45) * 86_400_000);
  const coach = await prisma.clientCoach.findFirst({ where: { clientId, role: product.kind === "GROUP_TRAINING" ? "GROUP_TRAINING" : "PERSONAL_TRAINING" } });
  let plan;
  const current = renewal ? await prisma.clientPlan.findFirst({ where: { clientId }, orderBy: { startsAt: "desc" } }) : null;
  if (current) {
    plan = await prisma.clientPlan.update({
      where: { id: current.id },
      data: { productId: product.id, name: product.name, startsAt: at, endsAt, sessionsTotal: product.sessions ?? current.sessionsTotal, sessionsUsed: 0, status: "ACTIVE", renewalDecision: "renew" },
    });
  } else {
    plan = await prisma.clientPlan.create({
      data: { clientId, productId: product.id, name: product.name, startsAt: at, endsAt, sessionsTotal: product.sessions ?? 12, sessionsUsed: 0, coachId: coach?.staffId ?? null, status: "ACTIVE", renewalDecision: renewal ? "renew" : null },
    });
  }
  await prisma.clientProfile.update({ where: { id: clientId }, data: { stage: "TRAINING", graceEndsAt: null, accessEndsAt: null } });
  void co;
  return plan;
}

/**
 * module_payment: a paid custom module added by staff. The module id travels in the purpose
 * ("module_payment:<planModuleId>"); without it, the client's first module waiting for payment.
 */
async function handleModulePayment(co: Checkout, clientId: string) {
  const id = co.purpose.split(":")[1];
  // Staff payment links store the checkout id on the module (Admin plan editor).
  const byCheckout = await prisma.planModule.findFirst({ where: { plan: { clientId }, data: { path: ["checkoutId"], equals: co.id } } });
  const mod = byCheckout
    ? byCheckout
    : id
    ? await prisma.planModule.findFirst({ where: { id, plan: { clientId } } })
    : await prisma.planModule.findFirst({ where: { plan: { clientId }, status: "WAITING_FOR_PAYMENT", type: { not: "IN_PERSON" }, removed: false }, orderBy: { order: "asc" } });
  if (!mod) return;
  const hasSession = await prisma.session.count({ where: { planModuleId: mod.id, status: { in: ["SCHEDULED", "CONFIRMED"] } } });
  const data = { ...((mod.data as Record<string, unknown>) ?? {}), paidAt: now().toISOString() };
  await prisma.planModule.update({ where: { id: mod.id }, data: { paid: true, data, status: hasSession ? "BOOKED" : "NOT_STARTED", extraLine: null } });
}

/** Invoice number for an invoice_payment checkout: "invoice_payment:<number>" or returnTo "?paid=<number>". */
export function invoiceNumberOf(co: Pick<Checkout, "purpose" | "returnTo">) {
  const fromPurpose = co.purpose.split(":").slice(1).join(":");
  if (fromPurpose) return fromPurpose;
  const q = co.returnTo.split("?")[1] ?? "";
  return new URLSearchParams(q).get("paid");
}

/** invoice_payment (Records → Orders "Pay now"): Invoice → PAID, ActivityLog, outbox receipt. No new Order. */
async function payInvoice(co: Checkout): Promise<PaidResult> {
  const number = invoiceNumberOf(co);
  const inv = number ? await prisma.invoice.findFirst({ where: { number, clientId: co.clientId! } }) : null;
  if (!inv) throw new Error("Invoice not found");
  const at = now();
  const client = await prisma.clientProfile.findUniqueOrThrow({ where: { id: co.clientId! }, include: { user: true } });
  if (inv.status !== "PAID") await prisma.invoice.update({ where: { id: inv.id }, data: { status: "PAID" } });
  await prisma.checkout.update({ where: { id: co.id }, data: { paidAt: at, orderNumber: inv.number } });
  await prisma.activityLog.create({ data: { clientId: client.id, actorName: `${client.firstName} ${client.lastName}`, action: `Paid invoice ${inv.number} · ${inv.item}`, createdAt: at } });
  await notifier.send({ clientId: client.id, to: client.user.email, channel: "EMAIL", template: "invoice_paid", subject: `Receipt · ${inv.number}`, body: `Hi ${client.firstName}, thanks for your payment. Invoice ${inv.number}: ${inv.item}, ${inv.amountLabel} (incl. GST ${inv.gstRate}%). Paid ${dayLabel(at)}.` });
  return { returnTo: co.returnTo, orderNumber: inv.number };
}
