import "server-only";
import type { Channel } from "@prisma/client";
import { prisma } from "@/server/db";
import { notifier, fill } from "@/server/integrations/notify";
import { now } from "@/lib/clock";
import { dayLabel, timeLabel } from "@/lib/format";
import { appUrl } from "./emails";

/**
 * Scheduled reminders (03 "Reminders"): outbox rows with `sendAt`, tracked in
 * ScheduledReminder so they can be cancelled or recreated.
 *  - Intake unfinished: 24 h (WhatsApp) and 72 h (email) after account setup; cancelled when the intake is done.
 *  - Sessions: 24 h before (WhatsApp + email) and 2 h before (WhatsApp; online variant with the join link).
 * WhatsApp rows are only queued when the client has WhatsApp updates on.
 */

const H = 3600 * 1000;

async function queue(p: { clientId: string; kind: string; refId?: string | null; channel: Channel; to: string; template: string; subject?: string; body: string; sendAt: Date }) {
  const { id } = await notifier.send({ clientId: p.clientId, to: p.to, channel: p.channel, template: p.template, subject: p.subject, body: p.body, sendAt: p.sendAt });
  await prisma.scheduledReminder.create({ data: { outboxMessageId: id, clientId: p.clientId, kind: p.kind, refId: p.refId ?? null } });
}

async function cancel(where: { clientId?: string; kind?: { in: string[] } | { startsWith: string }; refId?: string }) {
  const rows = await prisma.scheduledReminder.findMany({ where });
  if (!rows.length) return 0;
  // Only rows still waiting to go out are removed; sent ones stay in the client's "Sent to you" log.
  await prisma.outboxMessage.deleteMany({ where: { id: { in: rows.map((r) => r.outboxMessageId) }, status: "QUEUED" } });
  await prisma.scheduledReminder.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
  return rows.length;
}

async function tpl(key: string, channel: Channel) {
  return prisma.notificationTemplate.findUnique({ where: { key_channel: { key, channel } } });
}

export async function scheduleIntakeReminders(clientId: string, from = now()) {
  const c = await prisma.clientProfile.findUnique({ where: { id: clientId }, include: { user: true } });
  if (!c || c.intakeCompletedAt) return;
  await cancelIntakeReminders(clientId);
  const link = appUrl("/intake");
  const vars = { first_name: c.firstName, link };
  if (c.whatsappUpdates && c.mobile) {
    const t = await tpl("intake_unfinished_24h", "WHATSAPP");
    await queue({
      clientId, kind: "intake_24h", channel: "WHATSAPP", to: c.mobile, template: "intake_unfinished_24h", sendAt: new Date(from.getTime() + 24 * H),
      body: t ? fill(t.body, vars) : `Hi ${c.firstName}, your intake saves as you go, so pick up where you left off any time: ${link}`,
    });
  }
  const e = await tpl("intake_unfinished_72h", "EMAIL");
  await queue({
    clientId, kind: "intake_72h", channel: "EMAIL", to: c.user.email, template: "intake_unfinished_72h", sendAt: new Date(from.getTime() + 72 * H),
    subject: e?.subject ? fill(e.subject, vars) : "Your intake is waiting",
    body: e ? fill(e.body, vars) + `\n${link}` : `Your intake takes about XX minutes and helps your practitioner prepare for your assessment. Your answers so far are saved.\n\n${link}`,
  });
}

export async function cancelIntakeReminders(clientId: string) {
  return cancel({ clientId, kind: { in: ["intake_24h", "intake_72h"] } });
}

/**
 * Session reminders 24 h and 2 h before (for Plan and Shell booking flows). Call after booking
 * and after every reschedule: earlier reminders for the session are replaced. Cancel with
 * `cancelSessionReminders` when a session is cancelled.
 */
export async function scheduleSessionReminders(sessionId: string) {
  const s = await prisma.session.findUnique({ where: { id: sessionId }, include: { client: { include: { user: true } }, centre: true, coach: { include: { user: true } } } });
  await cancelSessionReminders(sessionId);
  if (!s?.client || ["CANCELLED", "DONE", "MISSED"].includes(s.status)) return;
  const c = s.client;
  const t = now().getTime();
  const at = s.startsAt;
  const time = timeLabel(at);
  const where = s.online ? "online" : s.centre?.name ?? "the centre";
  const coach = s.coach?.user.name?.split(" ")[0] ?? "your coach";
  const sendIf = async (offsetH: number, p: Omit<Parameters<typeof queue>[0], "sendAt" | "clientId" | "refId">) => {
    const sendAt = new Date(at.getTime() - offsetH * H);
    if (sendAt.getTime() <= t) return;
    await queue({ ...p, clientId: c.id, refId: s.id, sendAt });
  };
  if (c.whatsappUpdates && c.mobile) {
    await sendIf(24, {
      kind: "session_24h_whatsapp", channel: "WHATSAPP", to: c.mobile, template: "session_reminder_24h",
      body: `Hi ${c.firstName}, your ${s.title} is tomorrow at ${time} ${s.online ? "online" : `at ${where}`}. Please arrive 10 minutes early and wear clothes you can move in. Reply here if you need to change anything.`,
    });
    await sendIf(2, s.online
      ? { kind: "session_2h", channel: "WHATSAPP", to: c.mobile, template: "session_reminder_2h_online", body: `Your ${s.title} starts at ${time}. Join here: ${s.joinUrl ?? appUrl("/live")}. Have a mat and a chair ready.` }
      : { kind: "session_2h", channel: "WHATSAPP", to: c.mobile, template: "session_reminder_2h", body: `See you at ${time}, ${c.firstName}. ${where}. Ask for ${coach} at the front desk.` });
  }
  await sendIf(24, {
    kind: "session_24h_email", channel: "EMAIL", to: c.user.email, template: "session_reminder_24h",
    subject: `Tomorrow: your ${s.title}`,
    body: `${dayLabel(at)}, ${time}, ${s.online ? "live online" : where} with ${coach}. Shorts, a fitted T shirt, water.${s.centre ? `\n\nDirections: ${s.centre.directionsUrl}` : ""}`,
  });
}

export async function cancelSessionReminders(sessionId: string) {
  return cancel({ refId: sessionId, kind: { startsWith: "session_" } });
}
