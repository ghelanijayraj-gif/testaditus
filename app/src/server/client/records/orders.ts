import "server-only";
import { prisma } from "@/server/db";
import { dateLong } from "@/components/client/records/fmt";
import { currentPlan, gstLabel, planStatus, planTitle } from "./common";

export type LedgerRow = { key: string; no: string; src: "Shopify order" | "ADITUS invoice"; item: string; date: string; at: number; amount: string; gst: string; status: "Paid" | "Due" | "Overdue" };

export async function getLedger(clientId: string) {
  const [orders, invoices] = await Promise.all([prisma.order.findMany({ where: { clientId } }), prisma.invoice.findMany({ where: { clientId } })]);
  const rows: LedgerRow[] = [
    ...orders.map((o) => ({ key: "o" + o.id, no: o.number, src: "Shopify order" as const, item: o.item, date: dateLong(o.placedAt), at: o.placedAt.getTime(), amount: o.amountLabel, gst: gstLabel(o.amountLabel, o.amountPaise), status: "Paid" as const })),
    ...invoices.map((i) => ({ key: "i" + i.id, no: i.number, src: "ADITUS invoice" as const, item: i.item, date: dateLong(i.issuedAt), at: i.issuedAt.getTime() + 1, amount: i.amountLabel, gst: gstLabel(i.amountLabel, i.amountPaise, i.gstRate), status: (i.status === "PAID" ? "Paid" : i.status === "DUE" ? "Due" : "Overdue") as LedgerRow["status"] })),
  ];
  return rows.sort((a, b) => a.at - b.at);
}

export async function getOrdersView(clientId: string) {
  const rows = await getLedger(clientId);
  const { current } = await currentPlan(clientId);
  const pkg = current && ["Active", "Expiring soon"].includes(planStatus(current))
    ? { title: planTitle(current), validTill: dateLong(current.endsAt), used: current.sessionsUsed, total: current.sessionsTotal }
    : null;
  const reassessed = await prisma.report.count({ where: { clientId, kind: "REASSESSMENT", status: "RELEASED" } });
  const coach = current?.coachId ? await prisma.staffProfile.findUnique({ where: { id: current.coachId }, include: { user: true } }) : null;
  return { rows, pkg, reassessed: reassessed > 0, coach: coach?.user.name ?? "Shimyu" };
}

/** Printable invoice (Shopify order or ADITUS invoice) by number; client scoped. */
export async function getInvoiceDoc(clientId: string, number: string) {
  const client = await prisma.clientProfile.findUniqueOrThrow({ where: { id: clientId }, include: { user: true } });
  const inv = await prisma.invoice.findFirst({ where: { clientId, number } });
  const ord = inv ? null : await prisma.order.findFirst({ where: { clientId, number } });
  const r = inv ?? ord;
  if (!r) return null;
  const amount = r.amountLabel;
  const rate = inv?.gstRate ?? 18;
  return {
    kind: inv ? "Tax invoice" : "Order receipt",
    number,
    date: dateLong(inv ? inv.issuedAt : ord!.placedAt),
    item: r.item,
    amount,
    gst: gstLabel(amount, r.amountPaise, rate),
    rate,
    status: inv ? (inv.status === "PAID" ? "Paid" : inv.status === "DUE" ? "Due" : "Overdue") : "Paid",
    payment: ord?.paymentMethod ?? null,
    billTo: { name: `${client.firstName} ${client.lastName}`, code: client.code, email: client.user.email, city: client.city },
  };
}

/**
 * Return from the simulated Shopify checkout for an invoice (purpose invoice_payment):
 * when that checkout is paid, mark the invoice Paid. Idempotent.
 */
export async function settlePaidInvoice(clientId: string, number: string) {
  const inv = await prisma.invoice.findFirst({ where: { clientId, number } });
  if (!inv || inv.status === "PAID") return false;
  const paid = await prisma.checkout.findFirst({ where: { clientId, purpose: "invoice_payment", returnTo: `/orders?paid=${encodeURIComponent(number)}`, paidAt: { not: null } } });
  if (!paid) return false;
  await prisma.invoice.update({ where: { id: inv.id }, data: { status: "PAID" } });
  await prisma.activityLog.create({ data: { clientId, actorName: "Shopify", action: `Invoice ${number} paid` } });
  return true;
}
