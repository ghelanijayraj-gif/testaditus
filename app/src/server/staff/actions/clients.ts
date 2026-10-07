"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { audit, clientScope, requireStaff } from "@/server/auth/guards";
import { notifier, sendTemplate } from "@/server/integrations/notify";
import { now } from "@/lib/clock";
import { timeLabel } from "@/lib/format";
import { clientInclude, stalledOf } from "../common";

type R = { toast?: string; error?: string; redirect?: string };
const ids = z.array(z.string().min(1)).min(1).max(200);

/** One click NUDGE (Today) and bulk "Send nudge" (Clients): the `nudge` template on WhatsApp and email. */
export async function nudgeClients(clientIds: string[]): Promise<R> {
  const p = ids.safeParse(clientIds);
  if (!p.success) return { error: "Pick at least one client." };
  const ctx = await requireStaff();
  if (ctx.role === "FINANCE") return { error: "Nudges are not part of your role." };
  const clients = await prisma.clientProfile.findMany({ where: { AND: [{ id: { in: p.data } }, clientScope(ctx)] }, include: clientInclude });
  for (const c of clients) {
    const st = stalledOf(c);
    const mod = st?.module ?? c.plans[0]?.modules.find((m) => !m.draft && !m.removed && ["NOT_STARTED", "IN_PROGRESS", "MORE_NEEDED"].includes(m.status))?.name ?? "assessment";
    const pct = st?.progress.match(/\d+/)?.[0];
    await sendTemplate("nudge", { clientId: c.id, vars: { first_name: c.firstName, progress: pct ? `${pct} percent` : "part of the way", module_name: mod, link: "/assessment/plan" } });
    await audit(ctx, "NUDGE", `Sent nudge · ${mod}`, c.id);
  }
  revalidatePath("/staff");
  revalidatePath("/staff/clients");
  if (!clients.length) return { error: "No clients in your scope." };
  return { toast: clients.length === 1 && p.data.length === 1 ? `Nudge sent to ${clients[0].firstName} on WhatsApp and email.` : `Nudge sent to ${clients.length} clients.` };
}

export async function assignPractitioner(clientIds: string[], staffId: string): Promise<R> {
  const p = ids.safeParse(clientIds);
  if (!p.success) return { error: "Pick at least one client." };
  const ctx = await requireStaff({ section: "clients" });
  if (!["FOUNDER", "HOD", "OPS"].includes(ctx.role)) return { error: "Ask a head of department to reassign clients." };
  const staff = await prisma.staffProfile.findUnique({ where: { id: staffId }, include: { user: true } });
  if (!staff || !["FOUNDER", "HOD", "PRACTITIONER"].includes(staff.role)) return { error: "Pick a practitioner." };
  const scoped = await prisma.clientProfile.findMany({ where: { AND: [{ id: { in: p.data } }, clientScope(ctx)] }, select: { id: true } });
  for (const c of scoped) {
    await prisma.clientProfile.update({ where: { id: c.id }, data: { primaryPractitionerId: staff.id } });
    await prisma.clientCoach.upsert({ where: { clientId_staffId_role: { clientId: c.id, staffId: staff.id, role: "ASSESSMENT" } }, create: { clientId: c.id, staffId: staff.id, role: "ASSESSMENT" }, update: {} });
    await audit(ctx, "ASSIGN", `Assigned practitioner · ${staff.user.name}`, c.id);
  }
  revalidatePath("/staff/clients");
  return { toast: `${scoped.length} client${scoped.length === 1 ? "" : "s"} assigned to ${staff.user.name}.` };
}

const viewSchema = z.object({ name: z.string().trim().min(1).max(40), view: z.string().max(40).optional(), q: z.string().max(80).optional() });

export async function saveView(input: z.infer<typeof viewSchema>): Promise<R> {
  const p = viewSchema.safeParse(input);
  if (!p.success) return { error: "Give the view a name." };
  const ctx = await requireStaff({ section: "clients" });
  const v = await prisma.savedView.create({ data: { staffId: ctx.staff.id, name: p.data.name, filters: { view: p.data.view ?? "All", q: p.data.q ?? "" } as Prisma.InputJsonValue } });
  revalidatePath("/staff/clients");
  return { toast: "View saved.", redirect: `/staff/clients?view=sv_${v.id}` };
}

export async function deleteView(id: string): Promise<R> {
  const ctx = await requireStaff({ section: "clients" });
  await prisma.savedView.deleteMany({ where: { id, staffId: ctx.staff.id } });
  revalidatePath("/staff/clients");
  return { toast: "View removed.", redirect: "/staff/clients" };
}

export async function addNote(clientId: string, body: string): Promise<R> {
  const text = body.trim();
  if (!text) return { error: "Write the note first." };
  if (text.length > 2000) return { error: "Keep notes under 2,000 characters." };
  const ctx = await requireStaff({ section: "clients" });
  const ok = await prisma.clientProfile.count({ where: { AND: [{ id: clientId }, clientScope(ctx)] } });
  if (!ok) return { error: "You cannot add notes for this client." };
  await prisma.internalNote.create({ data: { clientId, authorId: ctx.staff.id, body: text, createdAt: now() } });
  await audit(ctx, "NOTE", "Added an internal note", clientId);
  revalidatePath(`/staff/clients/${clientId}`);
  return { toast: "Note added. Staff only." };
}

/** "ASK JAYRAJ" on the no access panel: emails the founder (staff message, never in the client's log). */
export async function askAccess(clientId: string, what: string): Promise<R> {
  const ctx = await requireStaff();
  const founder = await prisma.staffProfile.findFirst({ where: { role: "FOUNDER" }, include: { user: true } });
  const c = await prisma.clientProfile.findUnique({ where: { id: clientId } });
  if (!founder || !c) return { error: "Could not send the request." };
  await notifier.send({ to: founder.user.email, channel: "EMAIL", template: "access_request", subject: `${ctx.name} asked for access`, body: `${ctx.name} asked to open ${what} for ${c.firstName} ${c.lastName} at ${timeLabel(now())}.` });
  await audit(ctx, "ACCESS_REQUEST", `Asked for access · ${c.firstName} ${c.lastName} · ${what}`);
  return { toast: `Request sent to ${founder.user.name}.` };
}
