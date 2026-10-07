// Account creation from a paid Shopify order. Database work only (no notifier, no "server-only"),
// so the dev seed can run the same code. `provision.ts` wraps it and sends the email.
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { hashToken, newRawToken, newTempPassword, SETUP_TTL_MS } from "./tokens";
import { inMumbaiArea } from "./mumbai";

export type OrderInput = {
  email: string;
  name: string;
  mobile?: string | null;
  city?: string | null;
  pin?: string | null;
  productSlug: string;
  orderNumber: string;
  productLine?: string | null;
  paymentMethod?: string | null;
  amountPaise?: number | null;
  shopifyId?: string | null;
};

/** "9876543210" or "+91 98765 43210" → "+91 98765 43210". */
export function formatMobile(raw?: string | null) {
  const d = (raw ?? "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  if (d.length !== 10) return raw?.trim() || null;
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}
/** Local part shown next to the +91 prefix: "98765 43210". */
export const mobileLocal = (m?: string | null) => (m ?? "").replace(/^\+91\s?/, "");

export function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}

async function nextClientCode(db: PrismaClient) {
  const rows = await db.clientProfile.findMany({ select: { code: true } });
  const max = rows.reduce((m, r) => Math.max(m, Number(r.code.replace(/\D/g, "")) || 0), 0);
  return `AD ${String(max + 1).padStart(4, "0")}`;
}

async function nextInvoiceNumber(db: PrismaClient, at: Date) {
  const year = at.getFullYear();
  const rows = await db.invoice.findMany({ where: { number: { startsWith: `INV ${year} ` } }, select: { number: true } });
  const max = rows.reduce((m, r) => Math.max(m, Number(r.number.split(" ").pop()) || 0), 0);
  return `INV ${year} ${String(max + 1).padStart(4, "0")}`;
}

/** Default plan: Intake + Online Capture from the latest published templates (like the seed's makePlan). */
export async function createDefaultPlan(db: PrismaClient, clientId: string, at: Date) {
  const existing = await db.assessmentPlan.findFirst({ where: { clientId, kind: "BASELINE" } });
  if (existing) return existing;
  const plan = await db.assessmentPlan.create({ data: { clientId, kind: "BASELINE", sentVersion: 1, createdAt: at } });
  for (const [order, family] of ["intake", "capture"].entries()) {
    const t = await db.moduleTemplate.findFirst({ where: { family, status: "PUBLISHED" }, orderBy: { version: "desc" } });
    if (!t) continue;
    await db.planModule.create({
      data: {
        planId: plan.id,
        templateId: t.id,
        templateVersion: t.version,
        key: family,
        order,
        name: t.name,
        purpose: t.purpose,
        shortLine: t.shortLine,
        type: t.type,
        timeEstimate: t.timeEstimate,
        coverage: t.coverage ?? [],
        addedBy: "SYSTEM",
        locked: true,
        paid: false,
        progressDone: family === "intake" ? 0 : null,
        progressTotal: family === "intake" ? 10 : null,
      },
    });
  }
  await db.planVersion.create({ data: { planId: plan.id, version: 1, summary: "Default plan: Intake, Online Capture", byName: "System", createdAt: at } });
  return plan;
}

/** Mint a 48 h setup link. Earlier unused links for the same account stop working. */
export async function mintSetupToken(db: PrismaClient, userId: string, at: Date, raw = newRawToken()) {
  await db.setupToken.deleteMany({ where: { userId, usedAt: null } });
  await db.setupToken.create({ data: { tokenHash: hashToken(raw), userId, purpose: "SETUP", expiresAt: new Date(at.getTime() + SETUP_TTL_MS), createdAt: at } });
  return raw;
}

export async function provisionCore(db: PrismaClient, input: OrderInput, opts: { at: Date; rawToken?: string; tempPassword?: string }) {
  const at = opts.at;
  const email = input.email.trim().toLowerCase();
  const number = "#" + input.orderNumber.trim().replace(/^#/, "");
  const product = await db.product.findUnique({ where: { slug: input.productSlug } });
  if (!product) throw new Error(`Unknown product ${input.productSlug}`);

  const dup = await db.order.findUnique({ where: { number }, include: { client: { include: { user: true } } } });
  if (dup) return { duplicate: true as const, order: dup, client: dup.client, user: dup.client.user, rawToken: null, tempPassword: null };

  let user = await db.user.findUnique({ where: { email }, include: { client: true } });
  if (user && user.kind !== "CLIENT") throw new Error("That email belongs to a staff account.");
  const { first, last } = splitName(input.name || email.split("@")[0]);
  const inside = await inMumbaiArea(db, input.city, input.pin);
  const tempPassword = opts.tempPassword ?? newTempPassword();
  const tempHash = await bcrypt.hash(tempPassword, 10);
  // The password provider compares against the real clock, so the temp password expiry uses it too.
  const tempExpires = new Date(Date.now() + SETUP_TTL_MS);

  if (!user) {
    user = await db.user.create({
      data: {
        email,
        name: `${first} ${last}`.trim(),
        kind: "CLIENT",
        signInMethod: "EMAIL_LINK",
        tempPasswordHash: tempHash,
        tempPasswordExpires: tempExpires,
        createdAt: at,
        client: {
          create: {
            code: await nextClientCode(db),
            firstName: first,
            lastName: last,
            mobile: formatMobile(input.mobile),
            city: input.city?.trim() || null,
            pin: input.pin?.replace(/\D/g, "") || null,
            inMumbaiArea: inside,
            recommendation: inside ? "NOT_SHOWN" : "NOT_ELIGIBLE",
            // Nothing is ticked for the client: WhatsApp is off until they turn it on in setup.
            whatsappUpdates: false,
            accountSetupDone: false,
            setupStep: 1,
            stage: "ASSESSMENT_PURCHASED",
            assessmentStatus: "PURCHASED",
            createdAt: at,
          },
        },
      },
      include: { client: true },
    });
  } else if (!user.client?.id) {
    throw new Error("Client account without a profile.");
  } else if (!user.client.accountSetupDone) {
    await db.user.update({ where: { id: user.id }, data: { tempPasswordHash: tempHash, tempPasswordExpires: tempExpires } });
  }
  const client = user.client!;

  const order = await db.order.create({
    data: {
      number,
      clientId: client.id,
      item: product.name,
      productLine: input.productLine ?? null,
      paymentMethod: input.paymentMethod ?? "UPI",
      amountLabel: input.amountPaise ? "₹" + new Intl.NumberFormat("en-IN").format(Math.round(input.amountPaise / 100)) : product.priceLabel,
      amountPaise: input.amountPaise ?? product.pricePaise ?? null,
      placedAt: at,
      shopifyId: input.shopifyId ?? null,
    },
  });
  await db.invoice.create({
    data: { number: await nextInvoiceNumber(db, at), clientId: client.id, item: product.name, amountLabel: order.amountLabel, amountPaise: order.amountPaise, status: "PAID", issuedAt: at },
  });
  if (product.kind === "ASSESSMENT") await createDefaultPlan(db, client.id, at);
  await db.activityLog.create({ data: { clientId: client.id, actorName: "Shopify", action: `Order ${number} paid · ${product.name}`, createdAt: at } });

  // Repeat buyers who already finished setup sign in as usual: no new setup link.
  const rawToken = client.accountSetupDone ? null : await mintSetupToken(db, user.id, at, opts.rawToken);
  if (!rawToken) await db.user.update({ where: { id: user.id }, data: { tempPasswordHash: null, tempPasswordExpires: null } });
  return { duplicate: false as const, order, client, user, rawToken, tempPassword: rawToken ? tempPassword : null };
}
