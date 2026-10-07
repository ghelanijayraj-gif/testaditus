"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ModuleType, Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { audit, canOnClient, requireStaff, type StaffCtx } from "@/server/auth/guards";
import { sendTemplate } from "@/server/integrations/notify";
import { shopify } from "@/server/integrations/shopify";
import { now } from "@/lib/clock";
import { dayLabel } from "@/lib/format";
import { OPS_TYPES, QUICK, type ModuleData, type Pending } from "@/components/staff/admin/planConstants";

type R = { toast?: string; error?: string; redirect?: string };
const OPS_NOTE = "Ops admin: you can add payment and booking modules only.";

async function gate(clientId: string): Promise<StaffCtx | R> {
  const ctx = await requireStaff({ section: "clients" });
  if (!(await canOnClient(ctx, "modules.add", clientId))) return { error: "You cannot change this plan." };
  return ctx;
}
const isErr = (x: StaffCtx | R): x is R => !("staff" in x);
const opsBlocked = (ctx: StaffCtx, type: ModuleType) => ctx.role === "OPS" && !(OPS_TYPES as readonly string[]).includes(type);
const dataOf = (m: { data: unknown }) => ((m.data as ModuleData) ?? {}) as ModuleData;
const revalidate = (clientId: string) => revalidatePath(`/staff/clients/${clientId}`);

async function latestPlan(clientId: string) {
  return prisma.assessmentPlan.findFirst({ where: { clientId }, orderBy: { createdAt: "desc" }, include: { modules: { orderBy: { order: "asc" } }, client: true } });
}

async function paymentLink(clientId: string, type: ModuleType) {
  const c = await shopify.createCheckout({ clientId, productSlug: type === "IN_PERSON" ? "in-person-session" : "module-payment", purpose: "module_payment", returnTo: "/assessment/plan" });
  return { paymentUrl: c.url, checkoutId: c.id };
}

const addSchema = z.object({
  clientId: z.string().min(1),
  quick: z.enum(["photos", "document", "question", "live", "recommend"]).optional(),
  family: z.string().optional(),
  strong: z.boolean().optional(),
  reason: z.string().max(500).optional(),
});

/** Quick actions and "From library": adds an unsent draft module (invisible to the client until sent). */
export async function addPlanModule(input: z.infer<typeof addSchema>): Promise<R> {
  const p = addSchema.safeParse(input);
  if (!p.success) return { error: "Check the module and try again." };
  const ctx = await gate(p.data.clientId);
  if (isErr(ctx)) return ctx;
  const plan = await latestPlan(p.data.clientId);
  if (!plan) return { error: "This client has no assessment plan yet." };

  const q = p.data.quick ? QUICK.find((x) => x.k === p.data.quick)! : null;
  const family = q ? q.family : p.data.family;
  const tpl = family ? await prisma.moduleTemplate.findFirst({ where: { family, status: "PUBLISHED" }, orderBy: { version: "desc" } }) : null;
  if (family && !tpl) return { error: "Only published templates can be added." };
  if (tpl?.isDefault) return { error: "That module is already part of every plan." };
  const type: ModuleType = tpl?.type ?? "FORM";
  if (opsBlocked(ctx, type) || (ctx.role === "OPS" && q?.clinical)) return { error: OPS_NOTE };

  const strong = q?.k === "recommend" && !!p.data.strong;
  let name = q ? q.name.replace("{name}", ctx.name) : tpl!.name;
  if (q?.k === "recommend" && strong) name += " · strongly recommended";
  const note = q?.k === "recommend" ? p.data.reason?.trim() || q.note : q ? q.note : null;
  const paid = q ? q.paid : !!tpl?.defaultPaid || type === "IN_PERSON";
  const base = family ?? "question";
  const taken = new Set(plan.modules.map((m) => m.key));
  let key = base;
  for (let i = 2; taken.has(key); i++) key = `${base}-${i}`;
  const dueAt = new Date(now().getTime() + 7 * 86_400_000);
  const data: ModuleData = paid ? await paymentLink(plan.clientId, type) : {};

  await prisma.planModule.create({
    data: {
      planId: plan.id,
      templateId: tpl?.id,
      templateVersion: tpl?.version,
      key,
      order: Math.max(-1, ...plan.modules.map((m) => m.order)) + 1,
      name,
      purpose: tpl?.purpose ?? note ?? undefined,
      shortLine: tpl?.shortLine,
      type,
      timeEstimate: tpl?.timeEstimate ?? "XX min",
      coverage: (tpl?.coverage ?? []) as Prisma.InputJsonValue,
      status: "NOT_STARTED",
      addedBy: q?.k === "recommend" ? "RECOMMENDED" : ctx.role === "OPS" ? "ADMIN" : "PRACTITIONER",
      addedByName: ctx.name,
      required: !paid,
      paid,
      priceLabel: paid ? tpl?.priceLabel ?? "₹X,XXX" : null,
      pricePaise: paid ? tpl?.pricePaise : null,
      replacesCapture: tpl?.replacesCapture ?? false,
      strong,
      dueAt,
      dueLabel: dayLabel(dueAt),
      note,
      draft: true,
      data: data as Prisma.InputJsonValue,
    },
  });
  revalidate(plan.clientId);
  return { toast: `${name} added to draft.` };
}

async function moduleFor(moduleId: string) {
  return prisma.planModule.findUnique({ where: { id: moduleId }, include: { plan: true } });
}

export async function movePlanModule(moduleId: string, dir: -1 | 1): Promise<R> {
  const m = await moduleFor(moduleId);
  if (!m) return { error: "Module not found." };
  const ctx = await gate(m.plan.clientId);
  if (isErr(ctx)) return ctx;
  const list = (await prisma.planModule.findMany({ where: { planId: m.planId, removed: false }, orderBy: { order: "asc" } })).filter((x) => !dataOf(x).pending?.remove);
  const i = list.findIndex((x) => x.id === m.id);
  const j = i + dir;
  if (j < 0 || j >= list.length) return {};
  [list[i], list[j]] = [list[j], list[i]];
  await prisma.$transaction(list.map((x, n) => prisma.planModule.update({ where: { id: x.id }, data: { order: n } })));
  revalidate(m.plan.clientId);
  return {};
}

export async function removePlanModule(moduleId: string): Promise<R> {
  const m = await moduleFor(moduleId);
  if (!m) return { error: "Module not found." };
  const ctx = await gate(m.plan.clientId);
  if (isErr(ctx)) return ctx;
  if (m.locked) return { error: `${m.name} is part of every plan.` };
  if (opsBlocked(ctx, m.type)) return { error: OPS_NOTE };
  if (m.draft) await prisma.planModule.delete({ where: { id: m.id } });
  else {
    const data = dataOf(m);
    await prisma.planModule.update({ where: { id: m.id }, data: { changed: true, data: { ...data, pending: { ...(data.pending ?? {}), remove: true } } as Prisma.InputJsonValue } });
  }
  revalidate(m.plan.clientId);
  return { toast: `${m.name} removed from draft.` };
}

const patchSchema = z.object({
  required: z.boolean().optional(),
  paid: z.boolean().optional(),
  replacesCapture: z.boolean().optional(),
  dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  note: z.string().max(600).nullable().optional(),
});

/** Required/Optional, Included/Paid, Replaces Online Capture, due date and note. Sent modules keep the change pending until SEND TO CLIENT. */
export async function updatePlanModule(moduleId: string, patch: z.infer<typeof patchSchema>): Promise<R> {
  const p = patchSchema.safeParse(patch);
  if (!p.success) return { error: "Check the change and try again." };
  const m = await moduleFor(moduleId);
  if (!m) return { error: "Module not found." };
  const ctx = await gate(m.plan.clientId);
  if (isErr(ctx)) return ctx;
  if (opsBlocked(ctx, m.type) && Object.keys(p.data).some((k) => k !== "paid")) return { error: OPS_NOTE };
  const data = dataOf(m);
  const next: Pending = {};
  if (p.data.required !== undefined) next.required = p.data.required;
  if (p.data.replacesCapture !== undefined) next.replacesCapture = p.data.replacesCapture;
  if (p.data.note !== undefined) next.note = p.data.note?.trim() || null;
  if (p.data.dueAt !== undefined) next.dueAt = p.data.dueAt ? new Date(`${p.data.dueAt}T23:59:00+05:30`).toISOString() : null;
  let extra: ModuleData = {};
  if (p.data.paid !== undefined) {
    next.paid = p.data.paid;
    next.priceLabel = p.data.paid ? m.priceLabel ?? "₹X,XXX" : null;
    if (p.data.paid && !data.paymentUrl) extra = await paymentLink(m.plan.clientId, m.type);
    if (!p.data.paid) extra = { paymentUrl: null };
  }
  if (m.draft) {
    const due = next.dueAt === undefined ? undefined : next.dueAt ? new Date(next.dueAt) : null;
    await prisma.planModule.update({
      where: { id: m.id },
      data: {
        ...(next.required !== undefined ? { required: next.required } : {}),
        ...(next.paid !== undefined ? { paid: next.paid, priceLabel: next.priceLabel } : {}),
        ...(next.replacesCapture !== undefined ? { replacesCapture: next.replacesCapture } : {}),
        ...(next.note !== undefined ? { note: next.note } : {}),
        ...(due !== undefined ? { dueAt: due, dueLabel: due ? dayLabel(due) : null } : {}),
        data: { ...data, ...extra } as Prisma.InputJsonValue,
      },
    });
  } else {
    await prisma.planModule.update({ where: { id: m.id }, data: { changed: true, data: { ...data, ...extra, pending: { ...(data.pending ?? {}), ...next } } as Prisma.InputJsonValue } });
  }
  revalidate(m.plan.clientId);
  return { toast: p.data.paid ? "Shopify payment link ready. Sent with the plan." : p.data.dueAt !== undefined || p.data.note !== undefined ? "Saved to draft." : undefined };
}

/** SEND TO CLIENT: clears draft/changed flags, bumps the version, notifies the client per new step. */
export async function sendPlan(planId: string): Promise<R> {
  const plan = await prisma.assessmentPlan.findUnique({ where: { id: planId }, include: { modules: { orderBy: { order: "asc" } }, client: true } });
  if (!plan) return { error: "Plan not found." };
  const ctx = await gate(plan.clientId);
  if (isErr(ctx)) return ctx;
  const drafts = plan.modules.filter((m) => !m.removed && (m.draft || m.changed));
  if (!drafts.length) return { toast: "Nothing to send." };
  const v = plan.sentVersion + 1;
  const added: typeof drafts = [];
  const parts: string[] = [];
  for (const m of drafts) {
    const data = dataOf(m);
    if (m.draft) {
      added.push(m);
      parts.push(`${m.name} added`);
      await prisma.planModule.update({ where: { id: m.id }, data: { draft: false, changed: false, status: m.paid ? "WAITING_FOR_PAYMENT" : "NOT_STARTED" } });
      if (m.templateId) await prisma.moduleTemplate.update({ where: { id: m.templateId }, data: { inUse: { increment: 1 } } });
      continue;
    }
    const { pending = {}, ...rest } = data;
    if (pending.remove) {
      parts.push(`${m.name} removed`);
      await prisma.planModule.update({ where: { id: m.id }, data: { removed: true, changed: false, data: rest as Prisma.InputJsonValue } });
      continue;
    }
    parts.push(`${m.name} changed`);
    const due = pending.dueAt === undefined ? undefined : pending.dueAt ? new Date(pending.dueAt) : null;
    await prisma.planModule.update({
      where: { id: m.id },
      data: {
        changed: false,
        data: rest as Prisma.InputJsonValue,
        ...(pending.required !== undefined ? { required: pending.required } : {}),
        ...(pending.paid !== undefined ? { paid: pending.paid, priceLabel: pending.priceLabel ?? null, ...(pending.paid && m.status === "NOT_STARTED" ? { status: "WAITING_FOR_PAYMENT" as const } : {}), ...(!pending.paid && m.status === "WAITING_FOR_PAYMENT" ? { status: "NOT_STARTED" as const } : {}) } : {}),
        ...(pending.replacesCapture !== undefined ? { replacesCapture: pending.replacesCapture } : {}),
        ...(pending.note !== undefined ? { note: pending.note } : {}),
        ...(due !== undefined ? { dueAt: due, dueLabel: due ? dayLabel(due) : null } : {}),
      },
    });
  }
  const summary = parts.join(" · ");
  await prisma.planVersion.create({ data: { planId: plan.id, version: v, summary, byName: ctx.name, createdAt: now() } });
  await prisma.assessmentPlan.update({ where: { id: plan.id }, data: { sentVersion: v } });
  for (const m of added) {
    await sendTemplate("step_added", {
      clientId: plan.clientId,
      vars: { first_name: plan.client.firstName, staff_name: m.addedByName ?? ctx.name, module_name: m.name, note: m.note ?? m.purpose ?? "", link: "/assessment/plan", due: m.dueAt ? dayLabel(m.dueAt) : "when you can" },
    });
  }
  await audit(ctx, "PLAN_SENT", `Sent plan v${v} · ${(added.length ? added : drafts).map((m) => m.name).join(" · ")}`, plan.clientId);
  revalidate(plan.clientId);
  revalidatePath("/assessment", "layout");
  return { toast: `Sent. ${plan.client.firstName} gets WhatsApp and email.` };
}

/** Drag to reorder: persists `order` for the whole list. */
export async function reorderPlan(planId: string, ids: string[]): Promise<R> {
  const plan = await prisma.assessmentPlan.findUnique({ where: { id: planId }, include: { modules: true } });
  if (!plan) return { error: "Plan not found." };
  const ctx = await gate(plan.clientId);
  if (isErr(ctx)) return ctx;
  const known = new Set(plan.modules.map((m) => m.id));
  const list = ids.filter((id) => known.has(id));
  const rest = plan.modules.filter((m) => !list.includes(m.id)).sort((a, b) => a.order - b.order).map((m) => m.id);
  await prisma.$transaction([...list, ...rest].map((id, n) => prisma.planModule.update({ where: { id }, data: { order: n } })));
  revalidate(plan.clientId);
  return {};
}
