import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";
import { notifier } from "@/server/integrations/notify";

/** Get or create the client's baseline plan (Intake + Online Capture by default). */
export async function ensureBaselinePlan(clientId: string) {
  const existing = await prisma.assessmentPlan.findFirst({ where: { clientId, kind: "BASELINE" }, orderBy: { createdAt: "desc" } });
  if (existing) return existing;
  const plan = await prisma.assessmentPlan.create({ data: { clientId, kind: "BASELINE", sentVersion: 1 } });
  for (const [i, family] of ["intake", "capture"].entries()) {
    const t = await prisma.moduleTemplate.findFirst({ where: { family, status: "PUBLISHED" }, orderBy: { version: "desc" } });
    if (!t) continue;
    await prisma.planModule.create({
      data: { planId: plan.id, templateId: t.id, templateVersion: t.version, key: family, order: i, name: t.name, purpose: t.purpose, shortLine: t.shortLine, type: t.type, timeEstimate: t.timeEstimate, coverage: t.coverage ?? [], addedBy: "SYSTEM", locked: true },
    });
  }
  await prisma.planVersion.create({ data: { planId: plan.id, version: 1, summary: "Default plan: Intake, Online Capture", byName: "System", createdAt: now() } });
  return plan;
}

/** Find a client visible module by key in the baseline plan. */
export async function findModule(clientId: string, key: string) {
  const plan = await prisma.assessmentPlan.findFirst({ where: { clientId, kind: "BASELINE" }, orderBy: { createdAt: "desc" } });
  if (!plan) return null;
  return prisma.planModule.findFirst({ where: { planId: plan.id, key, draft: false, removed: false }, include: { template: true } });
}

/**
 * The in person PlanModule for this client: created on "Add and book" with status
 * Waiting for payment (added by recommendation, paid, not required).
 */
export async function ensureInPersonModule(clientId: string) {
  const plan = await ensureBaselinePlan(clientId);
  const existing = await prisma.planModule.findFirst({ where: { planId: plan.id, type: "IN_PERSON", removed: false }, orderBy: { order: "asc" } });
  if (existing) return existing;
  const t = await prisma.moduleTemplate.findFirst({ where: { family: "inperson", status: "PUBLISHED" }, orderBy: { version: "desc" } });
  const last = await prisma.planModule.findFirst({ where: { planId: plan.id }, orderBy: { order: "desc" } });
  const client = await prisma.clientProfile.findUnique({ where: { id: clientId }, include: { primaryPractitioner: { include: { user: true } } } });
  const key = (await prisma.planModule.count({ where: { planId: plan.id, key: "inperson" } })) ? `inperson${Date.now()}` : "inperson";
  const mod = await prisma.planModule.create({
    data: {
      planId: plan.id,
      templateId: t?.id,
      templateVersion: t?.version,
      key,
      order: (last?.order ?? 0) + 1,
      name: t?.name ?? "In person session",
      purpose: t?.purpose ?? "Movement Assessment, Breath Session and Trial Training with a practitioner at the centre.",
      shortLine: t?.shortLine ?? "Hands on measures and a trial training",
      type: "IN_PERSON",
      timeEstimate: t?.timeEstimate ?? "XX min",
      coverage: (t?.coverage ?? []) as Prisma.InputJsonValue,
      status: "WAITING_FOR_PAYMENT",
      addedBy: "RECOMMENDED",
      addedByName: client?.primaryPractitioner?.user.name ?? "Jayraj",
      required: false,
      paid: true,
      pricePaise: t?.pricePaise ?? null,
      priceLabel: t?.priceLabel ?? "₹X,XXX",
      replacesCapture: t?.replacesCapture ?? false,
    },
  });
  const latest = await prisma.planVersion.findFirst({ where: { planId: plan.id }, orderBy: { version: "desc" } });
  const v = (latest?.version ?? plan.sentVersion) + 1;
  await prisma.planVersion.create({ data: { planId: plan.id, version: v, summary: "In person session added · waiting for payment", byName: client ? `${client.firstName} ${client.lastName}` : "Client", createdAt: now() } });
  await prisma.assessmentPlan.update({ where: { id: plan.id }, data: { sentVersion: v } });
  return mod;
}

/** Tell the client's practitioner (staff email + portal outbox). */
export async function notifyPractitioner(clientId: string, template: string, subject: string, body: string) {
  const c = await prisma.clientProfile.findUnique({ where: { id: clientId }, include: { primaryPractitioner: { include: { user: true } } } });
  const to = c?.primaryPractitioner?.user.email ?? "jayraj@aditus.in";
  await notifier.send({ clientId, to, channel: "EMAIL", template, subject, body });
  return c?.primaryPractitioner?.user.name ?? "Jayraj";
}

export async function logActivity(clientId: string, actorName: string, action: string) {
  await prisma.activityLog.create({ data: { clientId, actorName, action, createdAt: now() } });
}

/** Baseline Assessment for self tests and media (created when the client starts capturing). */
export async function ensureBaselineAssessment(clientId: string) {
  const a = await prisma.assessment.findFirst({ where: { clientId, kind: "BASELINE" }, orderBy: { date: "desc" } });
  if (a) return a;
  const c = await prisma.clientProfile.findUnique({ where: { id: clientId } });
  return prisma.assessment.create({ data: { clientId, kind: "BASELINE", format: "ONLINE", date: now(), practitionerId: c?.primaryPractitionerId ?? null } });
}
