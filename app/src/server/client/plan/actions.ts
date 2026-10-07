"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireClient } from "@/server/auth/guards";
import { now } from "@/lib/clock";
import { dayLabel, dayTime, timeLabel } from "@/lib/format";
import { shopify } from "@/server/integrations/shopify";
import { notifier, sendTemplate } from "@/server/integrations/notify";
import { scheduleSessionReminders } from "@/server/onboarding/reminders";
import { ensureInPersonModule, findModule, logActivity, notifyPractitioner } from "./common";

type Result = { toast?: string; error?: string; redirect?: string };

const revalidatePlan = () => {
  for (const p of ["/", "/welcome", "/assessment", "/assessment/plan", "/assessment/in-person"]) revalidatePath(p);
};

// ── Mumbai recommendation ──

/** "Continue online only": choice saved, reopenable from the plan. */
export async function dismissRecommendation(): Promise<Result> {
  const { client } = await requireClient();
  await prisma.clientProfile.update({ where: { id: client.id }, data: { recommendation: "DISMISSED", recommendationAt: now() } });
  await logActivity(client.id, `${client.firstName} ${client.lastName}`, "Chose to continue online only");
  revalidatePlan();
  return { toast: "Saved. You can reopen this from your assessment plan." };
}

export async function reopenRecommendation(): Promise<Result> {
  const { client } = await requireClient();
  if (!client.inMumbaiArea) return { error: "In person sessions are only offered near our centres." };
  await prisma.clientProfile.update({ where: { id: client.id }, data: { recommendation: "SHOWN", recommendationAt: now() } });
  revalidatePlan();
  return { redirect: "/assessment/plan" };
}

// ── Add and book ──

async function requireMumbai() {
  const ctx = await requireClient();
  if (!ctx.client.inMumbaiArea) redirect("/assessment/in-person");
  return ctx;
}

/** Step 0 "PAY ON SHOPIFY →": module Waiting for payment, then the Shopify checkout. */
export async function payInPerson(): Promise<Result> {
  const { client } = await requireMumbai();
  const mod = await ensureInPersonModule(client.id);
  if (mod.status === "BOOKED") return { redirect: "/assessment/in-person?step=booked" };
  if ((mod.data as { paidAt?: string })?.paidAt) return { redirect: "/assessment/in-person?step=centre" };
  if (client.recommendation !== "BOOKED") await prisma.clientProfile.update({ where: { id: client.id }, data: { recommendation: "WAITING_FOR_PAYMENT", recommendationAt: now() } });
  const co = await shopify.createCheckout({ clientId: client.id, productSlug: "in-person-session", purpose: "in_person", returnTo: "/assessment/in-person?step=centre" });
  revalidatePlan();
  return { redirect: co.url };
}

/** Step 0 "LATER": the module stays in the plan as Waiting for payment. */
export async function laterInPerson(): Promise<Result> {
  const { client } = await requireMumbai();
  await ensureInPersonModule(client.id);
  if (client.recommendation !== "BOOKED") await prisma.clientProfile.update({ where: { id: client.id }, data: { recommendation: "WAITING_FOR_PAYMENT", recommendationAt: now() } });
  revalidatePlan();
  return { redirect: "/assessment/plan", toast: "Saved to your plan. Your slot is not held until payment is done." };
}

/** Step 2 "CONFIRM BOOKING →": Session, module Booked, slot taken, practitioner told, reminders. */
export async function bookInPersonSlot(slotId: string): Promise<Result> {
  const { client } = await requireMumbai();
  const id = z.string().min(1).max(64).parse(slotId);
  const mod = await ensureInPersonModule(client.id);
  if (mod.status === "BOOKED") return { redirect: "/assessment/in-person?step=booked" };
  if (!(mod.data as { paidAt?: string })?.paidAt) return { error: "Complete your payment first.", redirect: "/assessment/in-person?step=pay" };
  const slot = await prisma.availabilitySlot.findUnique({ where: { id } });
  if (!slot || slot.online || !slot.centreId || slot.startsAt <= now()) return { error: "That time is no longer available. Pick another." };
  // Take the slot atomically: only one booking wins.
  const took = await prisma.availabilitySlot.updateMany({ where: { id, taken: false }, data: { taken: true } });
  if (took.count === 0) return { error: "Someone just took that time. Pick another." };
  const [centre, coach] = await Promise.all([
    prisma.centre.findUniqueOrThrow({ where: { id: slot.centreId } }),
    prisma.staffProfile.findUniqueOrThrow({ where: { id: slot.staffId }, include: { user: true } }),
  ]);
  const coachName = coach.user.name ?? "Jayraj";
  const session = await prisma.session.create({
    data: {
      clientId: client.id,
      type: "IN_PERSON_ASSESSMENT",
      title: "In person session",
      startsAt: slot.startsAt,
      durationMin: Math.max(slot.minutes, 120),
      status: "SCHEDULED",
      coachId: coach.id,
      centreId: centre.id,
      planModuleId: mod.id,
      bookedBy: "client",
      beforeYouCome: { wear: "Clothes you can move in. Bare feet are fine.", prep: "Arrive 10 minutes early", changes: "24 hours notice to reschedule" },
      createdAt: now(),
    },
  });
  await prisma.sessionEvent.create({ data: { sessionId: session.id, status: "SCHEDULED", byName: `${client.firstName} ${client.lastName}`, note: "Booked after payment", createdAt: now() } });
  const line = `${dayLabel(slot.startsAt)} · ${timeLabel(slot.startsAt)} · ${centre.name} · with ${coachName}`;
  await prisma.planModule.update({ where: { id: mod.id }, data: { status: "BOOKED", extraLine: line, dueAt: slot.startsAt, dueLabel: `${dayLabel(slot.startsAt)} · ${centre.name}` } });
  await prisma.clientProfile.update({ where: { id: client.id }, data: { recommendation: "BOOKED", preferredCentreId: centre.id, assessmentStatus: "SESSION_BOOKED" } });
  await notifier.send({
    clientId: client.id,
    to: coach.user.email,
    channel: "EMAIL",
    template: "in_person_booked",
    subject: `${client.firstName} ${client.lastName} booked an in person session`,
    body: `${client.firstName} ${client.lastName} booked an in person session: ${dayTime(slot.startsAt)} at ${centre.name}.`,
  });
  await sendTemplate("session_confirmed", { clientId: client.id, vars: { first_name: client.firstName, session_type: "in person session", when: dayTime(slot.startsAt), coach: coachName } });
  await scheduleSessionReminders(session.id);
  await logActivity(client.id, `${client.firstName} ${client.lastName}`, `Booked in person session · ${dayTime(slot.startsAt)} · ${centre.name}`);
  revalidatePlan();
  revalidatePath("/calendar");
  return { redirect: `/assessment/in-person?step=booked&t=booked&by=${encodeURIComponent(coachName)}` };
}

// ── Module screens ──

const valuesSchema = z.record(z.string().max(64), z.unknown());

/** Autosave ("Saved · 7:42 PM"). Moves Not started → In progress. */
export async function saveModuleDraft(key: string, values: Record<string, unknown>): Promise<{ savedAt?: string; error?: string }> {
  const { client } = await requireClient();
  const mod = await findModule(client.id, z.string().max(64).parse(key));
  if (!mod) return { error: "This step is no longer in your plan." };
  if (!["NOT_STARTED", "IN_PROGRESS", "MORE_NEEDED"].includes(mod.status)) return { error: "This step is already sent." };
  const v = valuesSchema.parse(values);
  const at = now();
  const data = { ...((mod.data as Record<string, unknown>) ?? {}), values: v, savedAt: at.toISOString() };
  await prisma.planModule.update({ where: { id: mod.id }, data: { data: data as Prisma.InputJsonValue, status: mod.status === "NOT_STARTED" ? "IN_PROGRESS" : mod.status } });
  return { savedAt: timeLabel(at) };
}

type Field = { key: string; label: string; type: string; meta?: string };

/** SUBMIT →: module Submitted, practitioner notified. */
export async function submitModule(key: string, values: Record<string, unknown>): Promise<Result> {
  const { client } = await requireClient();
  const mod = await findModule(client.id, z.string().max(64).parse(key));
  if (!mod) return { error: "This step is no longer in your plan." };
  if (!["NOT_STARTED", "IN_PROGRESS", "MORE_NEEDED"].includes(mod.status)) return { error: "This step is already sent." };
  const v = valuesSchema.parse(values);
  const fields = ((mod.template?.fields as Field[]) ?? []).filter((f) => f && f.key);
  const missing = fields.find((f) => f.meta !== "Optional" && ["VIDEO", "PHOTO", "UPLOAD"].includes(f.type) && !v[f.key]);
  if (missing) return { error: `Add ${missing.label.toLowerCase()} first.` };
  const at = now();
  const data = { ...((mod.data as Record<string, unknown>) ?? {}), values: v, savedAt: at.toISOString() };
  await prisma.planModule.update({ where: { id: mod.id }, data: { status: "SUBMITTED", submittedAt: at, extraLine: null, data: data as Prisma.InputJsonValue } });
  const who = `${client.firstName} ${client.lastName}`;
  const pname = await notifyPractitioner(client.id, "module_submitted", `${who} submitted ${mod.name}`, `${who} submitted ${mod.name}. It is ready for your review.`);
  await logActivity(client.id, who, `Submitted ${mod.name}`);
  revalidatePlan();
  return { redirect: `/assessment/plan?t=submitted&by=${encodeURIComponent(pname)}` };
}

// ── Report next steps ──

/** "REMIND ME": schedules a reminder 6 weeks after the report (Mon 23 Nov in the sample). */
export async function remindNextStep(reportId: string, index: number): Promise<Result> {
  const { client, user } = await requireClient();
  const report = await prisma.report.findFirst({ where: { id: z.string().max(64).parse(reportId), clientId: client.id, status: "RELEASED" } });
  if (!report) return { error: "Report not found." };
  const steps = (report.nextSteps as { name?: string }[]) ?? [];
  const step = steps[z.number().int().min(0).max(50).parse(index)];
  if (!step) return { error: "Step not found." };
  const at = new Date((report.releasedAt ?? now()).getTime() + 42 * 86_400_000);
  await notifier.send({ clientId: client.id, to: user.email, channel: "EMAIL", template: "next_step_reminder", subject: `Reminder: ${step.name}`, body: `Hi ${client.firstName},\n\nA reminder for your next assessment step: ${step.name}.\n\nOpen your plan →`, sendAt: at });
  return { toast: `We will remind you on ${dayLabel(at)}.` };
}

/** "BOOK A TIME →" for a live video session: the team gets the request. */
export async function requestBooking(reportId: string, index: number): Promise<Result> {
  const { client } = await requireClient();
  const report = await prisma.report.findFirst({ where: { id: z.string().max(64).parse(reportId), clientId: client.id, status: "RELEASED" } });
  const step = ((report?.nextSteps as { name?: string }[]) ?? [])[z.number().int().min(0).max(50).parse(index)];
  if (!step) return { error: "Step not found." };
  await notifier.send({ clientId: client.id, to: "team@aditus.in", channel: "EMAIL", template: "booking_request", subject: `Booking request: ${step.name}`, body: `${client.firstName} ${client.lastName} asked to book: ${step.name}.` });
  await logActivity(client.id, `${client.firstName} ${client.lastName}`, `Asked to book ${step.name}`);
  return { toast: "Opening booking." };
}
