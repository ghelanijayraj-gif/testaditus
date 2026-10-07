"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ModuleTemplate, Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { audit, requireStaff } from "@/server/auth/guards";
import { can } from "@/lib/permissions";
import { now } from "@/lib/clock";
import { FIELD_TYPES } from "@/components/staff/admin/planConstants";

type R = { toast?: string; error?: string; redirect?: string };

async function editor() {
  const ctx = await requireStaff({ section: "modules" });
  if (!can(ctx.role, "templates.edit")) return null;
  return ctx;
}
const DENY = { error: "Ask a head of department to edit templates." };

/** The editable draft for a family: the existing DRAFT, or a new draft copied from the latest published version. */
async function draftOf(family: string): Promise<ModuleTemplate | null> {
  const versions = await prisma.moduleTemplate.findMany({ where: { family }, orderBy: { version: "desc" } });
  if (!versions.length) return null;
  const d = versions.find((v) => v.status === "DRAFT");
  if (d) return d;
  const src = versions.find((v) => v.status === "PUBLISHED") ?? versions[0];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, publishedAt, version, status, inUse, ...rest } = src;
  return prisma.moduleTemplate.create({ data: { ...rest, fields: rest.fields as Prisma.InputJsonValue, rules: rest.rules as Prisma.InputJsonValue, coverage: rest.coverage as Prisma.InputJsonValue, version: versions[0].version + 1, status: "DRAFT", createdAt: now() } });
}

const touch = (family: string) => {
  revalidatePath("/staff/modules");
  revalidatePath(`/staff/modules/${family}`);
};

export async function newModule(): Promise<R> {
  const ctx = await editor();
  if (!ctx) return DENY;
  const n = (await prisma.moduleTemplate.count({ where: { family: { startsWith: "custom" } } })) + 1;
  const family = `custom${n}`;
  await prisma.moduleTemplate.create({ data: { family, version: 1, status: "DRAFT", name: "New module", purpose: "One line shown to the client.", shortLine: "New module", type: "FORM", fields: [], rules: [], createdAt: now() } });
  await audit(ctx, "TEMPLATE_NEW", `Created module draft · ${family}`);
  touch(family);
  return { toast: "New draft created", redirect: `/staff/modules/${family}` };
}

export async function publishTemplate(family: string): Promise<R> {
  const ctx = await editor();
  if (!ctx) return DENY;
  const d = await prisma.moduleTemplate.findFirst({ where: { family, status: "DRAFT" }, orderBy: { version: "desc" } });
  if (!d) return { toast: "Nothing to publish." };
  const older = await prisma.moduleTemplate.findFirst({ where: { family, status: "PUBLISHED", version: { lt: d.version } }, orderBy: { version: "desc" } });
  await prisma.moduleTemplate.update({ where: { id: d.id }, data: { status: "PUBLISHED", publishedAt: now() } });
  await audit(ctx, "TEMPLATE_PUBLISH", `Published ${d.name} v${d.version}`);
  touch(family);
  return { toast: older ? `Published v${d.version}. Assessments already started keep v${older.version}.` : `Published v${d.version}. Practitioners can add it now.` };
}

export async function archiveTemplate(family: string): Promise<R> {
  const ctx = await editor();
  if (!ctx) return DENY;
  const t = await prisma.moduleTemplate.findFirst({ where: { family }, orderBy: { version: "desc" } });
  if (!t) return { error: "Template not found." };
  if (t.isDefault) return { error: "Intake and Online Capture are part of every plan." };
  await prisma.moduleTemplate.updateMany({ where: { family }, data: { status: "ARCHIVED" } });
  await audit(ctx, "TEMPLATE_ARCHIVE", `Archived ${t.name}`);
  touch(family);
  return { toast: `${t.name} archived. Plans that use it keep it.` };
}

export async function addTemplateField(family: string, type: string): Promise<R> {
  const ctx = await editor();
  if (!ctx) return DENY;
  const ft = FIELD_TYPES.find((f) => f[0] === type);
  if (!ft) return { error: "Unknown field type." };
  const d = await draftOf(family);
  if (!d) return { error: "Template not found." };
  const fields = ((d.fields ?? []) as { key?: string }[]).slice();
  fields.push({ key: `f${Date.now().toString(36)}`, label: `New ${ft[1].toLowerCase()} field`, type: ft[0], meta: ft[2] } as never);
  await prisma.moduleTemplate.update({ where: { id: d.id }, data: { fields: fields as Prisma.InputJsonValue } });
  touch(family);
  return { toast: `${ft[1]} field added to draft` };
}

export async function removeTemplateField(family: string, index: number): Promise<R> {
  const ctx = await editor();
  if (!ctx) return DENY;
  const d = await draftOf(family);
  if (!d) return { error: "Template not found." };
  const fields = ((d.fields ?? []) as unknown[]).filter((_, i) => i !== index);
  await prisma.moduleTemplate.update({ where: { id: d.id }, data: { fields: fields as Prisma.InputJsonValue } });
  touch(family);
  return { toast: "Field removed from draft." };
}

const fieldEdit = z.object({ label: z.string().trim().min(1).max(120) });
export async function renameTemplateField(family: string, index: number, input: z.infer<typeof fieldEdit>): Promise<R> {
  const ctx = await editor();
  if (!ctx) return DENY;
  const p = fieldEdit.safeParse(input);
  if (!p.success) return { error: "Give the field a label." };
  const d = await draftOf(family);
  if (!d) return { error: "Template not found." };
  const fields = ((d.fields ?? []) as Record<string, unknown>[]).map((f, i) => (i === index ? { ...f, label: p.data.label } : f));
  await prisma.moduleTemplate.update({ where: { id: d.id }, data: { fields: fields as Prisma.InputJsonValue } });
  touch(family);
  return { toast: "Saved to draft." };
}

export async function addRule(family: string, text: string): Promise<R> {
  const ctx = await editor();
  if (!ctx) return DENY;
  const t = text.trim();
  if (!t) return { error: "Write the rule first." };
  const d = await draftOf(family);
  if (!d) return { error: "Template not found." };
  const rules = [...((d.rules ?? []) as { text: string }[]), { text: t.slice(0, 200) }];
  await prisma.moduleTemplate.update({ where: { id: d.id }, data: { rules: rules as Prisma.InputJsonValue } });
  touch(family);
  return { toast: "Rule added to draft." };
}

export async function removeRule(family: string, index: number): Promise<R> {
  const ctx = await editor();
  if (!ctx) return DENY;
  const d = await draftOf(family);
  if (!d) return { error: "Template not found." };
  const rules = ((d.rules ?? []) as unknown[]).filter((_, i) => i !== index);
  await prisma.moduleTemplate.update({ where: { id: d.id }, data: { rules: rules as Prisma.InputJsonValue } });
  touch(family);
  return { toast: "Rule removed from draft." };
}

const metaSchema = z.object({
  name: z.string().trim().min(1).max(80),
  purpose: z.string().trim().min(1).max(300),
  type: z.enum(["FORM", "CAPTURE", "SELF_TESTS", "UPLOAD", "LIVE_VIDEO", "IN_PERSON", "REVIEW_CALL", "CONNECT_HEALTH"]),
  timeEstimate: z.string().trim().min(1).max(30),
  instructions: z.string().trim().max(600),
  safetyNote: z.string().trim().max(400),
  availability: z.enum(["ONLINE", "IN_PERSON", "BOTH"]),
  replacesCapture: z.boolean(),
});

export async function saveTemplateMeta(family: string, input: z.infer<typeof metaSchema>): Promise<R> {
  const ctx = await editor();
  if (!ctx) return DENY;
  const p = metaSchema.safeParse(input);
  if (!p.success) return { error: "Name, purpose and time are required." };
  const d = await draftOf(family);
  if (!d) return { error: "Template not found." };
  await prisma.moduleTemplate.update({ where: { id: d.id }, data: { ...p.data, instructions: p.data.instructions || null, safetyNote: p.data.safetyNote || null } });
  touch(family);
  return { toast: `Saved to draft v${d.version}.` };
}
