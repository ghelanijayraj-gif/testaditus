"use server";

import { z } from "zod";
import { prisma } from "@/server/db";
import { requireClient } from "@/server/auth/guards";
import { now } from "@/lib/clock";
import { dayTime, dayLabel } from "@/lib/format";
import { sendTemplate } from "@/server/integrations/notify";
import { dayKey } from "@/components/client/calendar/dates";
import { getClientPhase, KIND_OF } from "@/server/client/phase";
import { bookingModel, coachOf, drawerModel, listModel, logActivity, notifyCoach, ownSession, queueClientWhatsApp, revalidatePortal, type BookingModel, type DrawerModel, type ListModel } from "@/server/client/shell/core";

type Result = { toast?: string; error?: string; redirect?: string };

const Id = z.string().min(1).max(64);
const who = (c: { firstName: string; lastName: string }) => `${c.firstName} ${c.lastName}`;

// ─────────────── Loaders for the portal layers (drawers and modals) ───────────────

export async function loadSessionDrawer(id: string): Promise<DrawerModel | null> {
  const { client } = await requireClient();
  return drawerModel(client.id, Id.parse(id));
}

export async function loadConfirmList(ids: string[]): Promise<ListModel> {
  const { client } = await requireClient();
  return listModel(client.id, z.array(Id).max(20).parse(ids));
}

export async function loadBooking(kind: "book" | "bookRe"): Promise<BookingModel> {
  const { client } = await requireClient();
  return bookingModel(client.id, z.enum(["book", "bookRe"]).parse(kind));
}

// ─────────────── Confirm ───────────────

async function confirmOne(client: { id: string; firstName: string; lastName: string }, id: string) {
  const s = await ownSession(client.id, id);
  if (!s || s.status !== "SCHEDULED" || KIND_OF[s.type] === "community") return null;
  const t = now();
  const coach = coachOf(s);
  await prisma.$transaction([
    prisma.session.update({ where: { id }, data: { status: "CONFIRMED", confirmedAt: t } }),
    prisma.sessionEvent.create({ data: { sessionId: id, status: "CONFIRMED", byName: who(client), note: "Confirmed by you", createdAt: t } }),
    prisma.sessionEvent.create({ data: { sessionId: id, status: "CONFIRMED", byName: "ADITUS", note: "WhatsApp confirmation queued", createdAt: new Date(t.getTime() + 1) } }),
  ]);
  await sendTemplate("session_confirmed", { clientId: client.id, channels: ["WHATSAPP"], vars: { first_name: client.firstName, session_type: s.title, when: dayTime(s.startsAt), coach } });
  await notifyCoach(client.id, s.coach, "session_confirmed", `${who(client)} confirmed ${dayLabel(s.startsAt)}`, `${who(client)} confirmed ${s.title} · ${dayTime(s.startsAt)}.`);
  await logActivity(client.id, who(client), `Confirmed ${s.title} · ${dayTime(s.startsAt)}`);
  return coach;
}

export async function confirmSession(id: string): Promise<Result> {
  const { client } = await requireClient();
  const coach = await confirmOne(client, Id.parse(id));
  if (!coach) return { error: "This session cannot be confirmed." };
  revalidatePortal();
  return { toast: `Session confirmed. Coach ${coach} has been notified.` };
}

export async function confirmSessions(ids: string[]): Promise<Result> {
  const { client } = await requireClient();
  const list = z.array(Id).min(1).max(20).parse(ids);
  const coaches: string[] = [];
  for (const id of list) {
    const c = await confirmOne(client, id);
    if (c) coaches.push(c);
  }
  if (!coaches.length) return { error: "Nothing left to confirm." };
  revalidatePortal();
  return { toast: `${coaches.length > 1 ? `${coaches.length} sessions confirmed.` : "Session confirmed."} Coach ${coaches[0]} has been notified.` };
}

// ─────────────── Reschedule and cancel ───────────────

export async function requestReschedule(id: string, slotId: string): Promise<Result> {
  const { client } = await requireClient();
  const s = await ownSession(client.id, Id.parse(id));
  if (!s || !["SCHEDULED", "CONFIRMED"].includes(s.status) || KIND_OF[s.type] === "community") return { error: "This session cannot be changed." };
  const ph = await getClientPhase(client.id);
  if (ph.bookingClosed) return { error: "Booking is closed." };
  const slot = await prisma.availabilitySlot.findUnique({ where: { id: Id.parse(slotId) } });
  const t = now();
  if (!slot || slot.taken || slot.staffId !== s.coachId || slot.startsAt <= t) return { error: "That time is no longer free. Pick another." };
  if (KIND_OF[s.type] === "pt" && s.clientPlan && slot.startsAt > s.clientPlan.endsAt) return { error: "This date is after your plan ends. Renew to book it." };
  const late = s.startsAt.getTime() - t.getTime() < 24 * 3_600_000;
  const coach = coachOf(s);
  const label = dayTime(slot.startsAt);
  await prisma.$transaction([
    prisma.rescheduleRequest.create({ data: { sessionId: s.id, slotStartsAt: slot.startsAt, centreId: slot.centreId, late, createdAt: t } }),
    prisma.availabilitySlot.update({ where: { id: slot.id }, data: { taken: true } }),
    prisma.session.update({ where: { id: s.id }, data: { status: "RESCHEDULED", lateChange: late } }),
    prisma.sessionEvent.create({ data: { sessionId: s.id, status: "RESCHEDULED", byName: who(client), note: `Reschedule requested · ${label}`, createdAt: t } }),
  ]);
  await notifyCoach(client.id, s.coach, "reschedule_requested", `${who(client)} asked to move ${dayLabel(s.startsAt)}`, `${who(client)} asked to move ${s.title} · ${dayTime(s.startsAt)} to ${label}.${late ? " Less than 24 hours notice: decide whether it counts as used." : ""}`);
  await logActivity(client.id, who(client), `Requested to move ${s.title} · ${dayTime(s.startsAt)} to ${label}${late ? " · late" : ""}`);
  revalidatePortal();
  return { toast: `Reschedule request sent. ${coach} will confirm on WhatsApp.` };
}

const REASONS = ["I am unwell", "Work came up", "Travelling", "Something else"] as const;

export async function cancelSession(id: string, reason: string): Promise<Result> {
  const { client } = await requireClient();
  const s = await ownSession(client.id, Id.parse(id));
  const r = z.enum(REASONS).safeParse(reason);
  if (!r.success) return { error: "Pick what happened." };
  if (!s || !["SCHEDULED", "CONFIRMED"].includes(s.status) || KIND_OF[s.type] === "community") return { error: "This session cannot be changed." };
  const t = now();
  const late = s.startsAt.getTime() - t.getTime() < 24 * 3_600_000;
  const coach = coachOf(s);
  await prisma.$transaction([
    // Late: stays counted until the coach decides. On time: never uses a session.
    prisma.session.update({ where: { id: s.id }, data: { status: "CANCELLED", cancelReason: r.data, lateChange: late, ...(late ? {} : { countsAgainstPlan: false }) } }),
    prisma.sessionEvent.create({ data: { sessionId: s.id, status: "CANCELLED", byName: who(client), note: `Cancelled by you · ${r.data}`, createdAt: t } }),
  ]);
  await notifyCoach(client.id, s.coach, "session_cancelled", `${who(client)} cannot make ${dayLabel(s.startsAt)}`, `${who(client)} cancelled ${s.title} · ${dayTime(s.startsAt)}. Reason: ${r.data}.${late ? " Less than 24 hours notice: decide whether it counts as a used session." : ""}`);
  await logActivity(client.id, who(client), `Cancelled ${s.title} · ${dayTime(s.startsAt)} · ${r.data}${late ? " · late" : ""}`);
  revalidatePortal();
  return { toast: `Got it. ${coach} has been told.` };
}

// ─────────────── Check in ───────────────

export async function checkIn(id: string): Promise<Result> {
  const { client } = await requireClient();
  const s = await ownSession(client.id, Id.parse(id));
  const t = now();
  if (!s || !["SCHEDULED", "CONFIRMED"].includes(s.status)) return { error: "This session cannot be checked in." };
  if (dayKey(s.startsAt) !== dayKey(t)) return { error: "Check in opens on the day of your session." };
  const coach = coachOf(s);
  if (!s.checkedInAt) {
    await prisma.$transaction([
      prisma.session.update({ where: { id: s.id }, data: { checkedInAt: t } }),
      prisma.sessionEvent.create({ data: { sessionId: s.id, status: s.status, byName: who(client), note: "Checked in", createdAt: t } }),
    ]);
    await notifyCoach(client.id, s.coach, "checked_in", `${who(client)} is here`, `${who(client)} checked in for ${s.title} · ${dayTime(s.startsAt)}${s.centre ? " at " + s.centre.name : ""}.`);
    await logActivity(client.id, who(client), `Checked in · ${s.title}`);
    revalidatePortal();
  }
  return { toast: `Checked in. ${coach} knows you are here.` };
}

// ─────────────── Book ───────────────

export async function bookSession(input: { slotId: string; kind: "book" | "bookRe" }): Promise<Result & { line?: string; coach?: string }> {
  const { client } = await requireClient();
  const { slotId, kind } = z.object({ slotId: Id, kind: z.enum(["book", "bookRe"]) }).parse(input);
  const ph = await getClientPhase(client.id);
  const t = now();
  if (ph.bookingClosed) return { error: "Booking is closed." };
  const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } });
  if (!slot || slot.taken || slot.startsAt.getTime() < t.getTime() + 24 * 3_600_000) return { error: "That time is no longer free. Pick another." };
  const staff = await prisma.staffProfile.findUnique({ where: { id: slot.staffId }, include: { user: true } });
  const coach = staff?.user.name ?? "your coach";
  let data: Parameters<typeof prisma.session.create>[0]["data"];
  if (kind === "bookRe") {
    const w = ph.window;
    if (!w || !(w.open || w.before) || w.booked) return { error: "Your reassessment can only be booked inside your window." };
    if (slot.startsAt < w.opensAt || slot.startsAt > w.closesAt) return { error: "Pick a time inside your reassessment window." };
    data = { clientId: client.id, type: "REASSESSMENT", title: "Reassessment", startsAt: slot.startsAt, durationMin: slot.minutes, coachId: slot.staffId, centreId: slot.centreId, online: slot.online, bookedBy: "client", countsAgainstPlan: false, clientPlanId: ph.plan?.id };
  } else {
    const plan = ph.plan;
    if (!plan || plan.ended) return { error: "You need an active plan to book. Renew to book it." };
    if (slot.startsAt > plan.endsAt) return { error: "This date is after your plan ends. Renew to book it." };
    const booked = ph.upcoming.filter((s) => s.kind === "pt").length;
    if (plan.left - booked <= 0) return { error: "Every session on your plan is booked or used." };
    if (plan.coachId && slot.staffId !== plan.coachId) return { error: "Pick a time with your coach." };
    const number = plan.used + booked + 1;
    data = { clientId: client.id, type: "PERSONAL_TRAINING", title: "Personal Training", startsAt: slot.startsAt, durationMin: slot.minutes, coachId: slot.staffId, centreId: slot.centreId, online: slot.online, bookedBy: "client", clientPlanId: plan.id, sessionNumber: number };
  }
  const label = dayTime(slot.startsAt);
  const created = await prisma.$transaction(async (tx) => {
    const fresh = await tx.availabilitySlot.updateMany({ where: { id: slot.id, taken: false }, data: { taken: true } });
    if (!fresh.count) return null;
    const s = await tx.session.create({ data });
    await tx.sessionEvent.create({ data: { sessionId: s.id, status: "SCHEDULED", byName: who(client), note: "Booked by you", createdAt: t } });
    return s;
  });
  if (!created) return { error: "That time is no longer free. Pick another." };
  await queueClientWhatsApp(client, "session_booked", `Hi ${client.firstName}, your ${data.title} is booked for ${label}. ${coach} confirms on WhatsApp, usually within a few hours.`);
  await notifyCoach(client.id, staff, "session_booked", `${who(client)} booked ${dayLabel(slot.startsAt)}`, `${who(client)} booked ${data.title} · ${label}. Please confirm on WhatsApp.`);
  await logActivity(client.id, who(client), `Booked ${data.title} · ${label}`);
  revalidatePortal();
  return { line: `Booked for ${label}.`, coach, toast: `Booked for ${label}.` };
}

// ─────────────── Rate and report ───────────────

export async function rateSession(sessionId: string, score: number, note?: string): Promise<Result> {
  const { client } = await requireClient();
  const v = z.object({ id: Id, score: z.number().int().min(1).max(5), note: z.string().max(500).optional() }).parse({ id: sessionId, score, note });
  const s = await ownSession(client.id, v.id);
  if (!s || s.status !== "DONE") return { error: "You can rate a session once it is done." };
  const existing = await prisma.sessionRating.findFirst({ where: { clientId: client.id, sessionId: s.id } });
  const cleanNote = v.note?.trim() || null;
  if (existing) await prisma.sessionRating.update({ where: { id: existing.id }, data: { score: v.score, note: cleanNote } });
  else await prisma.sessionRating.create({ data: { clientId: client.id, sessionId: s.id, score: v.score, note: cleanNote, createdAt: now() } });
  await notifyCoach(client.id, s.coach, "session_rated", `${who(client)} rated ${dayLabel(s.startsAt)} ${v.score} of 5`, `${who(client)} rated ${s.title} · ${dayTime(s.startsAt)}: ${v.score} of 5.${cleanNote ? ` “${cleanNote}”` : ""}`);
  await logActivity(client.id, who(client), `Rated ${s.title} · ${dayLabel(s.startsAt)} · ${v.score} of 5`);
  revalidatePortal();
  return { toast: "Thanks. Your rating is saved." };
}

export async function reportIssue(input: { text: string; sessionId?: string | null }): Promise<Result> {
  const { client } = await requireClient();
  const v = z.object({ text: z.string().trim().min(3).max(2000), sessionId: Id.nullish() }).safeParse(input);
  if (!v.success) return { error: "Tell us a little about it first." };
  const s = v.data.sessionId ? await ownSession(client.id, v.data.sessionId) : null;
  const ph = await getClientPhase(client.id);
  const target = s ?? null;
  const before = target ? `Before ${target.title} · ${dayTime(target.startsAt)}. ` : "";
  await prisma.issueReport.create({ data: { clientId: client.id, kind: "pain_or_issue", body: `${before}${v.data.text}`, createdAt: now() } });
  const coachStaff = target?.coach ?? (await prisma.staffProfile.findFirst({ where: ph.plan?.coachId ? { id: ph.plan.coachId } : { user: { name: ph.assessCoachName } }, include: { user: true } }));
  const coach = target ? coachOf(target) : coachStaff?.user.name ?? "Your coach";
  await notifyCoach(client.id, coachStaff, "issue_reported", `${who(client)} reported pain or an issue`, `${before}${v.data.text}`);
  await logActivity(client.id, who(client), `Reported pain or an issue${target ? " · before " + dayLabel(target.startsAt) : ""}`);
  revalidatePortal();
  return { toast: `Sent. ${coach} will see it before your next session.` };
}
