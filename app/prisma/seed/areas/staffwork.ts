import type { Prisma, PrismaClient } from "@prisma/client";
import { d, type Base } from "../base";

/**
 * Admin console area (12). Enriches what the console needs on top of the other areas:
 * review state on submitted modules (so "Needs review" matches 12), Kabir's follow up
 * photos due timer, Diya's stalled capture, today's group classes for the schedule grid,
 * media views for the access log, saved views, the Shopify sync stamp and a product for
 * staff added paid modules. Runs after lifecycle, results, records, onboarding, plan, dayof.
 * All data is fictional. Pinned clock: Wed 7 Oct 2026, 7:52 PM IST.
 */
export default async function seedStaffwork(db: PrismaClient, base: Base) {
  const { tic, samyah, jayraj, shimyu } = base;
  const byEmail = (email: string) => db.clientProfile.findFirst({ where: { user: { email } } });
  const mod = async (clientId: string, key: string) => db.planModule.findFirst({ where: { plan: { clientId }, key } });
  const markReviewed = async (clientId: string, key: string, at: string) => {
    const m = await mod(clientId, key);
    if (m && m.status === "SUBMITTED") await db.planModule.update({ where: { id: m.id }, data: { data: { ...((m.data as object) ?? {}), reviewedAt: d(at).toISOString(), reviewedBy: "Jayraj" } as Prisma.InputJsonValue, updatedAt: m.updatedAt } });
  };

  // ── Review state: Aarav's capture and Ishaan's MRI were reviewed by Jayraj (12 shows only Meera and Kabir in Needs review) ──
  const aarav = await byEmail("aarav@example.com");
  const ishaan = await byEmail("ishaan@example.com");
  const dhruv = await byEmail("dhruv@example.com");
  if (aarav) await markReviewed(aarav.id, "capture", "2026-10-06 18:00");
  if (ishaan) await markReviewed(ishaan.id, "mri", "2026-10-07 10:00");
  if (dhruv) await markReviewed(dhruv.id, "capture", "2026-10-04 12:00");

  // ── Kabir: follow up photos submitted this afternoon → 30 h left on the review timer (36 h SLA) ──
  const kabir = await byEmail("kabir@example.com");
  if (kabir) {
    const m = await mod(kabir.id, "photos");
    if (m && !m.submittedAt) await db.planModule.update({ where: { id: m.id }, data: { submittedAt: d("2026-10-07 13:52") } });
  }

  // ── Diya: capture 70 percent, last touched Tue 6 Oct 5:50 PM → 26 h stalled ──
  const diya = await byEmail("diya@example.com");
  if (diya) {
    const m = await mod(diya.id, "capture");
    if (m && m.status === "IN_PROGRESS") await db.planModule.update({ where: { id: m.id }, data: { updatedAt: d("2026-10-06 17:50") } });
  }

  // ── Aarav: Jayraj viewed the front and side photos (Media tab "viewed by Jayraj") ──
  if (aarav) {
    const media = await db.mediaAsset.findMany({ where: { clientId: aarav.id, view: { in: ["front", "side"] } } });
    for (const m of media) {
      const seen = await db.accessLog.findFirst({ where: { clientId: aarav.id, resourceId: m.id } });
      if (!seen) await db.accessLog.create({ data: { clientId: aarav.id, actorUserId: jayraj.userId, actorName: "Jayraj", resourceType: "media", resourceId: m.id, resourceName: m.label, action: "VIEWED", createdAt: d(m.view === "side" ? "2026-10-07 18:12" : "2026-10-06 18:02") } });
    }
  }

  // ── Today's group classes (Group room column, Sessions today) ──
  const group: [string, string, string, string | null, number, number][] = [
    ["2026-10-07 07:30", "Fundamentals", tic.id, shimyu.id, 10, 12],
    ["2026-10-07 09:00", "Mobility Lab", samyah.id, shimyu.id, 8, 12],
    ["2026-10-07 17:30", "Breath Session", tic.id, null, 6, 10],
    ["2026-10-08 07:00", "Mobility Lab", samyah.id, shimyu.id, 9, 12],
  ];
  for (const [at, title, centreId, coachId, booked, capacity] of group) {
    const exists = await db.session.findFirst({ where: { clientId: null, title, startsAt: d(at) } });
    if (!exists) await db.session.create({ data: { type: title === "Breath Session" ? "BREATH_SESSION" : "GROUP_TRAINING", title, startsAt: d(at), durationMin: 60, status: "CONFIRMED", coachId, centreId, room: "Group room", booked, capacity, bookedBy: "front_desk", createdAt: d("2026-09-30 10:00") } });
  }

  // ── Product for paid custom modules (plan editor "Paid · Shopify link") ──
  await db.product.upsert({ where: { slug: "module-payment" }, update: {}, create: { slug: "module-payment", name: "Custom assessment module", kind: "ADD_ON", priceLabel: "₹X,XXX", shopifyProductId: "gid://shopify/Product/module-payment" } });

  // ── Shopify sync stamp ("synced 2 min ago") ──
  await db.setting.upsert({ where: { key: "shopify_sync" }, update: { value: { lastSyncAt: d("2026-10-07 19:50").toISOString() } }, create: { key: "shopify_sync", value: { lastSyncAt: d("2026-10-07 19:50").toISOString() } } });

  // ── Rohan: renewal invoice due (Invoices "Due") ──
  const rohan = await byEmail("rohan@example.com");
  if (rohan && !(await db.invoice.findUnique({ where: { number: "INV 2026 0409" } }))) {
    await db.invoice.create({ data: { number: "INV 2026 0409", clientId: rohan.id, item: "Personal Training · renewal", amountLabel: "₹XX,XXX", status: "DUE", issuedAt: d("2026-10-04 10:00") } });
  }

  // ── Saved views ──
  await db.savedView.createMany({
    data: [
      { staffId: jayraj.id, name: "Kandivali", filters: { view: "All", q: "Kandivali" } },
      { staffId: shimyu.id, name: "My actions", filters: { view: "Needs action", q: "" } },
    ],
  });

  // ── A few more audit entries (Settings → Audit log) ──
  for (const [at, who, what] of [
    ["2026-10-07 13:52", "Shimyu", "Submitted report · Kabir Nair"],
    ["2026-10-07 10:00", "Jayraj", "Reviewed Ishaan Rao · Upload your last MRI"],
    ["2026-10-06 10:00", "Jayraj", "Requested retake · Ishaan Rao · side view photos"],
    ["2026-10-05 20:30", "System", "Shopify order #ADT4490 · In person session · Aarav Mehta"],
  ] as const) await db.auditLog.create({ data: { actorName: who, action: "SEED", detail: what, createdAt: d(at) } });
}
