"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireClient } from "@/server/auth/guards";
import { shopify } from "@/server/integrations/shopify";
import { now } from "@/lib/clock";

const slugSchema = z.string().regex(/^[a-z0-9-]{1,40}$/);

/** Plan card "Start training →": Shopify checkout for a training plan, then the checkout page. */
export async function startTraining(formData: FormData) {
  const { client } = await requireClient();
  const parsed = slugSchema.safeParse(formData.get("productSlug"));
  if (!parsed.success) redirect("/reports");
  const product = await prisma.product.findUnique({ where: { slug: parsed.data } });
  if (!product?.active || (product.kind !== "PERSONAL_TRAINING" && product.kind !== "GROUP_TRAINING")) redirect("/reports");
  const co = await shopify.createCheckout({ clientId: client.id, productSlug: parsed.data, purpose: "training_plan", returnTo: "/" });
  redirect(co.url);
}

const idSchema = z.string().min(1).max(64);

/** Report opened (05 report_ready → plan_options) or walkthrough step reached (04 reveal). */
export async function markReportStep(reportId: string, step: number) {
  const { client } = await requireClient();
  const id = idSchema.parse(reportId);
  const n = z.number().int().min(0).max(6).parse(step);
  const report = await prisma.report.findFirst({ where: { id, clientId: client.id, status: "RELEASED" }, select: { id: true } });
  if (!report) return { error: "Report not found." };
  try {
    return await saveStep(client.id, id, n);
  } catch (e) {
    console.error("markReportStep", e);
    return {};
  }
}

async function saveStep(clientId: string, id: string, n: number) {
  const client = { id: clientId };
  const prev = await prisma.reportView.findUnique({ where: { reportId_clientId: { reportId: id, clientId: client.id } } });
  const step2 = Math.max(prev?.step ?? 0, n);
  await prisma.reportView.upsert({
    where: { reportId_clientId: { reportId: id, clientId: client.id } },
    update: { step: step2, walkthroughDoneAt: n === 6 ? (prev?.walkthroughDoneAt ?? now()) : prev?.walkthroughDoneAt },
    create: { reportId: id, clientId: client.id, step: n, openedAt: now(), walkthroughDoneAt: n === 6 ? now() : null },
  });
  if (!prev) revalidatePath("/");
  return {};
}
