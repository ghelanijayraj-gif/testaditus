"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateSecret, generateURI } from "otplib";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { audit, canOnClient, requireStaff } from "@/server/auth/guards";
import { notifier } from "@/server/integrations/notify";
import { can } from "@/lib/permissions";
import { now } from "@/lib/clock";
import { dayLabel } from "@/lib/format";

type R = { toast?: string; error?: string; redirect?: string };

// ─────────────── Reports: export packs for clients who do not renew ───────────────

export async function generateExport(clientId: string): Promise<R> {
  const ctx = await requireStaff({ section: "reports" });
  if (!(await canOnClient(ctx, "media.view", clientId))) return { error: "You cannot export this client's records." };
  const c = await prisma.clientProfile.findUnique({ where: { id: clientId }, include: { reports: { where: { status: "RELEASED" } }, documents: true, media: { where: { supersededById: null } }, invoices: true } });
  if (!c) return { error: "Client not found." };
  const items = [
    ...c.reports.map((r) => ({ kind: "report", id: r.id, name: `${r.kind === "BASELINE" ? "Assessment" : "Reassessment"} report` })),
    ...c.documents.map((d) => ({ kind: "document", id: d.id, name: d.filename })),
    ...c.media.map((m) => ({ kind: "media", id: m.id, name: m.label })),
    ...c.invoices.map((i) => ({ kind: "invoice", id: i.id, name: i.number })),
    { kind: "summary", id: c.id, name: "Measures and program summary" },
  ];
  await prisma.exportPackage.create({ data: { clientId, status: "ready", fileCount: items.length, items: items as Prisma.InputJsonValue, preparedAt: now(), createdAt: now() } });
  await prisma.clientProfile.update({ where: { id: clientId }, data: { exportedAt: now() } });
  await audit(ctx, "EXPORT", `Generated export pack · ${items.length} files`, clientId);
  revalidatePath("/staff/reports");
  return { toast: `Export pack generating · ${items.length} files` };
}

// ─────────────── Billing: access end scheduling ───────────────

const accessSchema = z.object({ grace: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")), access: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")) });

export async function saveAccessDates(clientId: string, input: z.infer<typeof accessSchema>): Promise<R> {
  const p = accessSchema.safeParse(input);
  if (!p.success) return { error: "Pick valid dates." };
  const ctx = await requireStaff({ section: "billing" });
  if (!(await canOnClient(ctx, "billing.view", clientId)) || ctx.role === "FINANCE") return { error: "Ask ops or a founder to change access dates." };
  const grace = p.data.grace ? new Date(`${p.data.grace}T23:59:00+05:30`) : null;
  const access = p.data.access ? new Date(`${p.data.access}T23:59:00+05:30`) : null;
  if (grace && access && access < grace) return { error: "Access cannot end before the grace period." };
  await prisma.clientProfile.update({ where: { id: clientId }, data: { graceEndsAt: grace, accessEndsAt: access } });
  await audit(ctx, "ACCESS_DATES", `Access end scheduled · grace ${grace ? dayLabel(grace) : "none"} · access ${access ? dayLabel(access) : "none"}`, clientId);
  revalidatePath("/staff/billing");
  return { toast: "Access dates saved." };
}

// ─────────────── Team ───────────────

const inviteSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["FOUNDER", "HOD", "PRACTITIONER", "OPS", "FINANCE"]),
  title: z.string().trim().max(60).optional(),
  centres: z.array(z.string()).max(10),
});

export async function inviteStaff(input: z.infer<typeof inviteSchema>): Promise<R & { secret?: string; uri?: string }> {
  const ctx = await requireStaff({ section: "team" });
  if (!can(ctx.role, "staff.manage")) return { error: "Only a founder can invite staff." };
  const p = inviteSchema.safeParse(input);
  if (!p.success) return { error: "Name, a valid email and a role are required." };
  if (await prisma.user.findUnique({ where: { email: p.data.email } })) return { error: "That email already has an account. Staff and clients use different emails." };
  const secret = generateSecret();
  const uri = generateURI({ issuer: "ADITUS Staff", label: p.data.email, secret });
  const roleTitle = { FOUNDER: "Founder", HOD: "Head of department", PRACTITIONER: "Practitioner", OPS: "Ops admin", FINANCE: "Finance" }[p.data.role];
  await prisma.user.create({
    data: {
      email: p.data.email,
      name: p.data.name,
      kind: "STAFF",
      totpSecret: secret,
      staff: { create: { role: p.data.role, title: p.data.title || roleTitle, shownToClients: false, centres: { create: p.data.centres.map((centreId) => ({ centreId })) } } },
    },
  });
  await notifier.send({
    to: p.data.email,
    channel: "EMAIL",
    template: "staff_invite",
    subject: "You are invited to ADITUS Staff",
    body: `Hi ${p.data.name},\n\n${ctx.name} invited you to ADITUS Staff as ${roleTitle}. Sign in at staff.aditus.in with this email, then add the authenticator code your admin shares with you.\n\nClient accounts cannot sign in there.`,
  });
  await audit(ctx, "STAFF_INVITE", `Invited ${p.data.name} · ${roleTitle}`);
  revalidatePath("/staff/team");
  return { toast: "Invite sent", secret, uri };
}

const staffSchema = z.object({
  role: z.enum(["FOUNDER", "HOD", "PRACTITIONER", "OPS", "FINANCE"]),
  title: z.string().trim().min(1).max(60),
  segment: z.string().trim().max(60),
  availability: z.string().trim().max(120),
  yearsCoaching: z.string().trim().max(40),
  credentials: z.string().trim().max(200),
  shownToClients: z.boolean(),
});

export async function updateStaff(staffId: string, input: z.infer<typeof staffSchema>): Promise<R> {
  const ctx = await requireStaff({ section: "team" });
  if (!can(ctx.role, "staff.manage")) return { error: "Only a founder can change roles." };
  const p = staffSchema.safeParse(input);
  if (!p.success) return { error: "Check the fields and try again." };
  const s = await prisma.staffProfile.findUnique({ where: { id: staffId }, include: { user: true } });
  if (!s) return { error: "Staff member not found." };
  if (s.id === ctx.staff.id && p.data.role !== "FOUNDER") return { error: "You cannot remove your own founder role." };
  await prisma.staffProfile.update({ where: { id: staffId }, data: { ...p.data, segment: p.data.segment || null, availability: p.data.availability || null, yearsCoaching: p.data.yearsCoaching || null, credentials: p.data.credentials || null } });
  await audit(ctx, "STAFF_EDIT", `Edited ${s.user.name} · ${p.data.role}${p.data.shownToClients ? " · shown to clients" : ""}`);
  revalidatePath("/staff/team");
  return { toast: `${s.user.name} updated.` };
}

// ─────────────── Settings (founder only) ───────────────

async function founder() {
  const ctx = await requireStaff({ section: "settings" });
  return ctx.role === "FOUNDER" ? ctx : null;
}

const areaSchema = z.object({ cities: z.string().max(600), pinPrefixes: z.string().max(300), radiusLabel: z.string().trim().max(160) });

export async function saveMumbaiArea(input: z.infer<typeof areaSchema>): Promise<R> {
  const ctx = await founder();
  if (!ctx) return { error: "Founder only." };
  const p = areaSchema.safeParse(input);
  if (!p.success) return { error: "Check the fields and try again." };
  const split = (s: string) => s.split(/[\n,·]/).map((x) => x.trim()).filter(Boolean);
  const pins = split(p.data.pinPrefixes);
  if (pins.some((x) => !/^\d{2,6}$/.test(x))) return { error: "PIN prefixes are 2 to 6 digits." };
  const cur = ((await prisma.setting.findUnique({ where: { key: "mumbai_area" } }))?.value ?? {}) as Record<string, unknown>;
  const value = { ...cur, cities: split(p.data.cities), pinPrefixes: pins, radiusLabel: p.data.radiusLabel };
  await prisma.setting.upsert({ where: { key: "mumbai_area" }, create: { key: "mumbai_area", value }, update: { value } });
  await audit(ctx, "SETTINGS", "Edited Mumbai area rules");
  revalidatePath("/staff/settings");
  return { toast: "Mumbai area saved. New sign ups use it." };
}

export async function saveNotificationTemplate(id: string, input: { subject?: string; body: string }): Promise<R> {
  const ctx = await founder();
  if (!ctx) return { error: "Founder only." };
  const body = input.body.trim();
  if (!body) return { error: "The message cannot be empty." };
  if (body.length > 2000) return { error: "Keep messages under 2,000 characters." };
  const t = await prisma.notificationTemplate.findUnique({ where: { id } });
  if (!t) return { error: "Template not found." };
  await prisma.notificationTemplate.update({ where: { id }, data: { body, subject: t.channel === "EMAIL" ? input.subject?.trim() || t.subject : null } });
  await audit(ctx, "SETTINGS", `Edited notification template · ${t.name} · ${t.channel === "EMAIL" ? "Email" : "WhatsApp"}`);
  revalidatePath("/staff/settings");
  return { toast: "Template saved.", redirect: "/staff/settings?tab=templates" };
}

export async function saveRetention(rows: [string, string][]): Promise<R> {
  const ctx = await founder();
  if (!ctx) return { error: "Founder only." };
  const clean = rows.map(([k, v]) => [k.trim().slice(0, 80), v.trim().slice(0, 200)] as [string, string]).filter(([k, v]) => k && v);
  if (!clean.length) return { error: "Keep at least one row." };
  await prisma.setting.upsert({ where: { key: "retention" }, create: { key: "retention", value: clean }, update: { value: clean } });
  await audit(ctx, "SETTINGS", "Edited consents and retention");
  revalidatePath("/staff/settings");
  return { toast: "Retention saved." };
}
