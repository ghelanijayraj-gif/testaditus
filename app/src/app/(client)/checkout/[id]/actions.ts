"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireClient } from "@/server/auth/guards";
import { completeCheckout } from "@/server/checkout/handlers";
import { ensureInPersonModule } from "@/server/client/plan/common";
import { revalidatePath } from "next/cache";
import { now } from "@/lib/clock";

/** PAY ON SHOPIFY →: simulates Shopify payment, runs the purpose handler, returns to the portal. */
export async function payCheckout(id: string, addInPerson: boolean): Promise<{ error?: string }> {
  const { client } = await requireClient();
  const co = await prisma.checkout.findUnique({ where: { id: z.string().max(64).parse(id) } });
  if (!co || (co.clientId && co.clientId !== client.id)) return { error: "This checkout is not yours." };
  if (!co.clientId) await prisma.checkout.update({ where: { id: co.id }, data: { clientId: client.id } });
  const res = await completeCheckout(co.id);
  // Public checkout banner: "+ ADD TO ORDER" adds the in person session to the plan, paid.
  if (addInPerson && co.productSlug === "online-assessment" && client.inMumbaiArea) {
    const mod = await ensureInPersonModule(client.id);
    await prisma.planModule.update({ where: { id: mod.id }, data: { status: "NOT_STARTED", data: { paidAt: now().toISOString() } } });
    await prisma.clientProfile.update({ where: { id: client.id }, data: { recommendation: "ADDED" } });
  }
  revalidatePath("/", "layout");
  redirect(res.returnTo);
}
