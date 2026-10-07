import Link from "next/link";
import { Block, Grid, PageHead, type Row } from "@/components/staff/Page";
import { AccessDrawer } from "@/components/staff/admin/FormDrawers";
import { linkBtn } from "@/components/staff/admin/styles";
import { clientScope, requireStaff } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";
import { dateShort, dayLabel } from "@/lib/format";
import { isoDay, planShort } from "@/server/staff/common";
import { saveAccessDates } from "@/server/staff/actions/admin";

export const metadata = { title: "Plans and billing" };

function ago(d: Date) {
  const m = Math.max(1, Math.round((now().getTime() - d.getTime()) / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h ago` : dayLabel(d);
}

/** 12 Plans and billing: catalogue, expiring and renewals, invoices with GST, Shopify sync, access end scheduling. */
export default async function Billing({ searchParams }: { searchParams: Promise<{ access?: string }> }) {
  const ctx = await requireStaff({ section: "billing" });
  const sp = await searchParams;
  const scope = clientScope(ctx);
  const [products, plans, invoices, lastOrder, pendingOrders, sync] = await Promise.all([
    prisma.product.findMany({ where: { active: true, kind: { in: ["PERSONAL_TRAINING", "GROUP_TRAINING", "ASSESSMENT", "IN_PERSON_SESSION"] } } }),
    prisma.clientPlan.findMany({ where: { client: scope }, include: { client: true, product: true }, orderBy: { endsAt: "asc" } }),
    prisma.invoice.findMany({ where: { client: scope }, include: { client: true }, orderBy: [{ issuedAt: "desc" }, { number: "desc" }], take: 30 }),
    prisma.order.findFirst({ orderBy: { placedAt: "desc" } }),
    prisma.order.count({ where: { syncStatus: { not: "SYNCED" } } }),
    prisma.setting.findUnique({ where: { key: "shopify_sync" } }),
  ]);
  const syncAt = [lastOrder?.placedAt, (sync?.value as { lastSyncAt?: string } | null)?.lastSyncAt ? new Date((sync!.value as { lastSyncAt: string }).lastSyncAt) : undefined].filter((x): x is Date => !!x && x <= now()).sort((a, b) => b.getTime() - a.getTime())[0];

  const order = ["PERSONAL_TRAINING", "GROUP_TRAINING", "ASSESSMENT", "IN_PERSON_SESSION"];
  const catalogue: Row[] = products
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
    .map((p) => ({ key: p.id, cells: [{ v: p.name, sans: true, b: true }, p.sessions ? String(p.sessions) : "·", p.validityDays ? `${p.validityDays} days` : "·", p.priceLabel] }));

  const horizon = now().getTime() + 30 * 86_400_000;
  const live = plans.filter((p) => p.endsAt >= now() && p.endsAt.getTime() <= horizon && p.status !== "COMPLETED");
  const expiring: Row[] = live.map((p) => {
    const soon = p.endsAt.getTime() - now().getTime() <= 7 * 86_400_000;
    return { key: p.id, cells: [{ v: `${p.client.firstName} ${p.client.lastName}`, sans: true, b: true }, planShort(p), `${p.sessionsTotal - p.sessionsUsed} sessions${p.renewalDecision ? ` · ${p.renewalDecision === "renew" ? "renewing" : "not renewing"}` : ""}`, { v: dateShort(p.endsAt), chip: true, flag: soon }] };
  });

  const inv: Row[] = invoices.map((i) => ({ key: i.id, cells: [i.number, { v: `${i.client.firstName} ${i.client.lastName}`, sans: true }, i.amountLabel, `${i.gstRate}%`, { v: i.status === "PAID" ? "Paid" : i.status === "DUE" ? "Due" : "Overdue", chip: true, flag: i.status !== "PAID" }] }));

  // Access end scheduling: declined renewals, ended plans, grace periods.
  const endingClients = new Map<string, { id: string; name: string; unused: number; grace: Date | null; access: Date | null; ends: Date }>();
  for (const p of plans) {
    const c = p.client;
    const ending = p.renewalDecision === "declined" || ["PLAN_ENDED", "GRACE"].includes(c.stage) || (p.endsAt < now() && c.stage !== "TRAINING" && c.stage !== "ACCESS_ENDED");
    if (!ending) continue;
    const prev = endingClients.get(c.id);
    if (prev && prev.ends > p.endsAt) continue;
    endingClients.set(c.id, { id: c.id, name: `${c.firstName} ${c.lastName}`, unused: Math.max(0, p.sessionsTotal - p.sessionsUsed), grace: c.graceEndsAt, access: c.accessEndsAt, ends: p.endsAt });
  }
  const canEdit = ctx.role !== "FINANCE";
  const accessRows: Row[] = [...endingClients.values()].map((e) => ({
    key: e.id,
    cells: [
      { v: e.name, sans: true, b: true },
      `${e.unused} session${e.unused === 1 ? "" : "s"}`,
      e.grace ? dayLabel(e.grace) : "Not set",
      e.access ? dayLabel(e.access) : "Not set",
      <Link key="e" href={`/staff/billing?access=${e.id}`} scroll={false} style={linkBtn}>
        {canEdit ? "EDIT →" : "VIEW →"}
      </Link>,
    ],
  }));
  const sel = sp.access ? endingClients.get(sp.access) : undefined;

  return (
    <>
      <PageHead kicker={`Shopify sync · ${syncAt ? `synced ${ago(syncAt)}` : "not synced yet"}${pendingOrders ? ` · ${pendingOrders} pending` : ""}`} title="Plans and billing" />
      <Grid variant="two">
        <Block title="Plan catalogue" sub="Mirrored from Shopify · prices are placeholders" head={["Plan", "Sessions", "Valid", "Price"]} cols="1.4fr .7fr .7fr .8fr" rows={catalogue} />
        <Block title="Expiring and renewals" head={["Client", "Plan", "Left", "Ends"]} cols="1.2fr .8fr .8fr .8fr" rows={expiring} empty="Clear. Nothing waiting." />
        <Block title="Invoices" head={["Number", "Client", "Amount", "GST", "Status"]} cols="1fr 1.2fr .8fr .7fr .7fr" rows={inv} minW="520px" empty="No invoices yet." />
        <Block title="Access end scheduling" head={["Client", "Unused at expiry", "Grace ends", "Access ends", ""]} cols="1.2fr 1fr .9fr .9fr .5fr" rows={accessRows} minW="520px" empty="Nobody is leaving." />
      </Grid>
      {sel && (
        <AccessDrawer
          key={sel.id}
          name={sel.name}
          unused={`${sel.unused} session${sel.unused === 1 ? "" : "s"}`}
          grace={sel.grace ? isoDay(sel.grace) : ""}
          access={sel.access ? isoDay(sel.access) : ""}
          closeHref="/staff/billing"
          canEdit={canEdit}
          save={saveAccessDates.bind(null, sel.id)}
        />
      )}
    </>
  );
}
