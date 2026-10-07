"use server";

import { redirect } from "next/navigation";
import { requireClient } from "@/server/auth/guards";
import { clientSignOut } from "@/server/auth/client";
import { shopify } from "@/server/integrations/shopify";
import { getClientPhase } from "@/server/client/phase";
import { logActivity } from "@/server/client/shell/core";

export async function signOutClient() {
  await clientSignOut({ redirectTo: "/signin" });
}

/** Plan ended → Renew: a Shopify checkout for the same product (purpose "renewal"). */
export async function renewPlan() {
  const { client } = await requireClient();
  const ph = await getClientPhase(client.id);
  const slug = ph.plan?.productSlug ?? "pt-12";
  const c = await shopify.createCheckout({ clientId: client.id, productSlug: slug, purpose: "renewal", returnTo: "/" });
  await logActivity(client.id, `${client.firstName} ${client.lastName}`, "Started plan renewal checkout");
  redirect(c.url);
}
