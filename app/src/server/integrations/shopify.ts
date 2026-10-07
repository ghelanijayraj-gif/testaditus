import "server-only";
import { prisma } from "@/server/db";

/**
 * Shopify. Real implementation: Storefront cart/checkout + orders/paid webhook.
 * Dev implementation: a Checkout row and a local page at /checkout/[id] that
 * simulates payment, then calls `onPaid` side effects through /api/dev/shopify.
 */
export interface Shopify {
  createCheckout(input: { clientId?: string; productSlug: string; purpose: string; returnTo: string }): Promise<{ url: string; id: string }>;
}

export const shopify: Shopify = {
  async createCheckout(input) {
    const c = await prisma.checkout.create({ data: { clientId: input.clientId, productSlug: input.productSlug, purpose: input.purpose, returnTo: input.returnTo } });
    return { id: c.id, url: `/checkout/${c.id}` };
  },
};

/** Next order number in the #ADT series. */
export async function nextOrderNumber() {
  const n = await prisma.order.count();
  return `#ADT${4500 + n}`;
}
