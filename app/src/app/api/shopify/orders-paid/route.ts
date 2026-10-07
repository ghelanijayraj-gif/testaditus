import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { provisionFromOrder } from "@/server/onboarding/provision";

/**
 * Shopify "orders/paid" webhook (simplified payload). Dev: open. Otherwise it needs the shared
 * secret in `x-aditus-webhook-secret` (env SHOPIFY_WEBHOOK_SECRET). A real Shopify integration
 * would verify `x-shopify-hmac-sha256` over the raw body and map the order JSON to this shape.
 *
 * POST { email, name, mobile?, city?, pin?, productSlug, orderNumber, productLine?, paymentMethod?, amountPaise? }
 */
const Body = z.object({
  email: z.email(),
  name: z.string().min(1).max(120),
  mobile: z.string().max(20).nullish(),
  city: z.string().max(80).nullish(),
  pin: z.string().max(10).nullish(),
  productSlug: z.string().min(1),
  orderNumber: z.string().regex(/^#?[A-Z]{2,5}\d{3,8}$/),
  productLine: z.string().max(160).nullish(),
  paymentMethod: z.string().max(40).nullish(),
  amountPaise: z.number().int().positive().nullish(),
  shopifyId: z.string().max(80).nullish(),
});

function allowed(req: NextRequest) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (secret) {
    const got = Buffer.from(req.headers.get("x-aditus-webhook-secret") ?? "");
    const want = Buffer.from(secret);
    return got.length === want.length && timingSafeEqual(got, want);
  }
  return process.env.NODE_ENV !== "production";
}

export async function POST(req: NextRequest) {
  if (!allowed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  try {
    const r = await provisionFromOrder(parsed.data);
    const { setupPath, ...rest } = r;
    // The setup link is a credential: only echoed back in development.
    const dev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      { ok: true, ...rest, setupUrl: dev && setupPath ? new URL(setupPath, req.url).toString() : undefined, paidUrl: new URL(r.paidPath, req.url).toString() },
      { status: r.duplicate ? 200 : 201 },
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
}
