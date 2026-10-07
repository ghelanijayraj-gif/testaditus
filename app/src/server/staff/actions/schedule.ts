"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";
import { audit, canOnClient, requireStaff, type StaffCtx } from "@/server/auth/guards";
import { notifier, sendTemplate } from "@/server/integrations/notify";
import { now } from "@/lib/clock";
import { dayTime } from "@/lib/format";
import { SESSION_SHORT } from "../common";

type R = { toast?: string; error?: string; redirect?: string };

const TYPE_NAME: Record<string, string> = { PERSONAL_TRAINING: "personal training session", GROUP_TRAINING: "group session", IN_PERSON_ASSESSMENT: "in person session", LIVE_VIDEO: "live video session", BREATH_SESSION: "breath session", TRIAL_TRAINING: "trial training", REASSESSMENT: "reassessment", MOVEMENT_ASSESSMENT: "movement assessment", REVIEW_CALL: "review call", ASSESSMENT: "assessment", COMMUNITY_EVENT: "event" };

async function sessionCtx(id: string) {
  const ctx = await requireStaff({ section: "schedule" });
  const s = await prisma.session.findUnique({ where: { id }, include: { client: { include: { user: true } }, coach: { include: { user: true } }, centre: true } });
  if (!s) return { error: "Session not found." };
  if (ctx.role === "PRACTITIONER" && s.coachId !== ctx.staff.id) return { error: "You can only change your own sessions." };
  if (s.clientId && !(await canOnClient(ctx, "sessions.schedule", s.clientId))) return { error: "You cannot change this session." };
  return { ctx, s, error: undefined };
}

export async function confirmSession(id: string): Promise<R> {
  const r = await sessionCtx(id);
  if (r.error !== undefined) return { error: r.error };
  const { ctx, s } = r;
  if (s.status === "CONFIRMED") return { toast: "Already confirmed." };
  if (s.status !== "SCHEDULED") return { error: "Only scheduled sessions can be confirmed." };
  await prisma.session.update({ where: { id }, data: { status: "CONFIRMED", confirmedAt: now() } });
  await prisma.sessionEvent.create({ data: { sessionId: id, status: "CONFIRMED", byName: ctx.name, note: `Confirmed by ${ctx.name} for the client`, createdAt: now() } });
  if (s.clientId && s.client) {
    await sendTemplate("session_confirmed", { clientId: s.clientId, channels: ["WHATSAPP"], vars: { first_name: s.client.firstName, session_type: TYPE_NAME[s.type], when: dayTime(s.startsAt), coach: s.coach?.user.name ?? "Your coach" } });
    await audit(ctx, "SESSION_CONFIRMED", `Confirmed ${s.title} ${dayTime(s.startsAt)} for the client`, s.clientId);
  }
  revalidatePath("/staff/schedule");
  return { toast: "Confirmed for the client. They get a WhatsApp." };
}

export async function saveExtraInfo(id: string, text: string): Promise<R> {
  const r = await sessionCtx(id);
  if (r.error !== undefined) return { error: r.error };
  const t = text.trim().slice(0, 600);
  await prisma.session.update({ where: { id }, data: { extraInfo: t || null } });
  if (r.s.clientId) await audit(r.ctx, "SESSION_INFO", `Edited extra info · ${r.s.title}`, r.s.clientId);
  revalidatePath("/staff/schedule");
  return { toast: "Extra info saved. Client sees it in Before you come." };
}

/** RESCHEDULE on the client's behalf. Inside 24 hours the change is late and counts against the plan. */
export async function rescheduleSession(id: string, slotId: string): Promise<R> {
  const r = await sessionCtx(id);
  if (r.error !== undefined) return { error: r.error };
  const { ctx, s } = r;
  const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } });
  if (!slot || slot.taken || slot.startsAt <= now()) return { error: "That slot is no longer free." };
  const late = s.startsAt.getTime() - now().getTime() < 24 * 3_600_000;
  const from = dayTime(s.startsAt);
  await prisma.$transaction([
    prisma.session.update({ where: { id }, data: { startsAt: slot.startsAt, coachId: slot.staffId, centreId: slot.online ? null : slot.centreId ?? s.centreId, online: slot.online, status: "SCHEDULED", confirmedAt: null, lateChange: late || s.lateChange, countsAgainstPlan: late ? true : s.countsAgainstPlan } }),
    prisma.availabilitySlot.update({ where: { id: slot.id }, data: { taken: true } }),
    prisma.sessionEvent.create({ data: { sessionId: id, status: "RESCHEDULED", byName: ctx.name, note: `Moved from ${from} by ${ctx.name}${late ? " · inside 24 hours" : ""}`, createdAt: now() } }),
  ]);
  if (s.clientId && s.client) {
    await notifier.send({ clientId: s.clientId, to: s.client.mobile ?? "no mobile", channel: "WHATSAPP", template: "session_rescheduled", body: `Hi ${s.client.firstName}, your ${TYPE_NAME[s.type]} has moved to ${dayTime(slot.startsAt)}. Reply here if that does not work.` });
    await audit(ctx, "SESSION_RESCHEDULED", `Rescheduled ${s.title} from ${from} to ${dayTime(slot.startsAt)}`, s.clientId);
  }
  revalidatePath("/staff/schedule");
  return { toast: `Moved to ${dayTime(slot.startsAt)}.${late ? " Late change: counts against the plan." : ""} Client gets a WhatsApp.` };
}

const bookSchema = z.object({ clientId: z.string().min(1), slotId: z.string().min(1), type: z.enum(["PERSONAL_TRAINING", "IN_PERSON_ASSESSMENT", "LIVE_VIDEO", "BREATH_SESSION", "TRIAL_TRAINING", "REVIEW_CALL", "REASSESSMENT"]) });

export async function bookForClient(input: z.infer<typeof bookSchema>): Promise<R> {
  const p = bookSchema.safeParse(input);
  if (!p.success) return { error: "Pick a client, a coach and a slot." };
  const ctx = await requireStaff({ section: "schedule" });
  if (!(await canOnClient(ctx, "sessions.schedule", p.data.clientId))) return { error: "You cannot book for this client." };
  const slot = await prisma.availabilitySlot.findUnique({ where: { id: p.data.slotId } });
  if (!slot || slot.taken || slot.startsAt <= now()) return { error: "That slot is no longer free." };
  if (ctx.role === "PRACTITIONER" && slot.staffId !== ctx.staff.id) return { error: "You can only book into your own slots." };
  const client = await prisma.clientProfile.findUnique({ where: { id: p.data.clientId }, include: { trainingPlans: { where: { status: { in: ["ACTIVE", "EXPIRING_SOON"] } }, orderBy: { endsAt: "desc" } } } });
  if (!client) return { error: "Client not found." };
  const plan = p.data.type === "PERSONAL_TRAINING" ? client.trainingPlans[0] : undefined;
  const booked = plan ? await prisma.session.count({ where: { clientPlanId: plan.id, status: { notIn: ["CANCELLED", "RESCHEDULED"] } } }) : 0;
  const title = { PERSONAL_TRAINING: "Personal Training", IN_PERSON_ASSESSMENT: "In person session", LIVE_VIDEO: "Live video session", BREATH_SESSION: "Breath Session", TRIAL_TRAINING: "Trial Training", REVIEW_CALL: "Review call", REASSESSMENT: "Reassessment" }[p.data.type];
  const s = await prisma.session.create({
    data: { clientId: client.id, type: p.data.type, title, startsAt: slot.startsAt, durationMin: slot.minutes, status: "SCHEDULED", coachId: slot.staffId, centreId: slot.online ? null : slot.centreId, online: slot.online, clientPlanId: plan?.id, sessionNumber: plan ? Math.max(plan.sessionsUsed, booked) + 1 : null, bookedBy: "front_desk", createdAt: now() },
  });
  await prisma.availabilitySlot.update({ where: { id: slot.id }, data: { taken: true } });
  await prisma.sessionEvent.create({ data: { sessionId: s.id, status: "SCHEDULED", byName: ctx.name, note: `Booked by ${ctx.name} for the client`, createdAt: now() } });
  await notifier.send({ clientId: client.id, to: client.mobile ?? "no mobile", channel: "WHATSAPP", template: "session_booked", body: `Hi ${client.firstName}, ${ctx.name} booked your ${TYPE_NAME[p.data.type]} for ${dayTime(slot.startsAt)}. Please confirm in your portal.` });
  await audit(ctx, "SESSION_BOOKED", `Booked ${title} ${dayTime(slot.startsAt)} for the client`, client.id);
  revalidatePath("/staff/schedule");
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(slot.startsAt);
  return { toast: `Booked for ${client.firstName} · ${SESSION_SHORT[p.data.type]} ${dayTime(slot.startsAt)}. They get a WhatsApp.`, redirect: `/staff/schedule?date=${iso}&session=${s.id}` };
}

function canManageSlots(ctx: StaffCtx, staffId: string) {
  if (ctx.role === "FOUNDER" || ctx.role === "OPS" || ctx.role === "HOD") return true;
  return ctx.role === "PRACTITIONER" && staffId === ctx.staff.id;
}

const slotSchema = z.object({ staffId: z.string().min(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/), minutes: z.coerce.number().int().min(15).max(240), centreId: z.string().optional() });

export async function addSlot(input: z.infer<typeof slotSchema>): Promise<R> {
  const p = slotSchema.safeParse(input);
  if (!p.success) return { error: "Pick a date, time and length." };
  const ctx = await requireStaff({ section: "schedule" });
  if (!canManageSlots(ctx, p.data.staffId)) return { error: "You can only change your own availability." };
  const startsAt = new Date(`${p.data.date}T${p.data.time}:00+05:30`);
  if (startsAt <= now()) return { error: "Pick a time in the future." };
  const clash = await prisma.availabilitySlot.count({ where: { staffId: p.data.staffId, startsAt } });
  if (clash) return { error: "There is already a slot at that time." };
  const online = !p.data.centreId || p.data.centreId === "online";
  await prisma.availabilitySlot.create({ data: { staffId: p.data.staffId, startsAt, minutes: p.data.minutes, online, centreId: online ? null : p.data.centreId } });
  await audit(ctx, "AVAILABILITY", `Added availability ${dayTime(startsAt)}`);
  revalidatePath("/staff/schedule");
  return { toast: `Slot added · ${dayTime(startsAt)}.` };
}

export async function removeSlot(id: string): Promise<R> {
  const ctx = await requireStaff({ section: "schedule" });
  const slot = await prisma.availabilitySlot.findUnique({ where: { id } });
  if (!slot) return { error: "Slot not found." };
  if (!canManageSlots(ctx, slot.staffId)) return { error: "You can only change your own availability." };
  if (slot.taken) return { error: "That slot is booked. Reschedule the session first." };
  await prisma.availabilitySlot.delete({ where: { id } });
  await audit(ctx, "AVAILABILITY", `Removed availability ${dayTime(slot.startsAt)}`);
  revalidatePath("/staff/schedule");
  return { toast: "Slot removed." };
}
