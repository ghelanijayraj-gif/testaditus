"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";
import { audit } from "@/server/auth/guards";
import { notifier } from "@/server/integrations/notify";
import { now } from "@/lib/clock";
import { scopeOf } from "@/lib/permissions";
import { actionCtx } from "@/server/consoles/access";
import { EVALUATION, REPORT, paramId, progress, type EvaluationData } from "@/config/evaluation";

type Result = { ok?: boolean; toast?: string; error?: string; redirect?: string; reportId?: string };

const Value = z.object({
  v: z.union([z.number(), z.string().max(4000), z.array(z.string().max(120)).max(80), z.boolean(), z.null()]).optional(),
  l: z.number().nullable().optional(),
  r: z.number().nullable().optional(),
  note: z.string().max(3000).optional(),
  media: z.array(z.string().max(40)).max(12).optional(),
  priority: z.boolean().optional(),
});
const Schema = z.object({
  values: z.record(z.string().max(80), Value),
  summary: z.record(z.string().max(80), z.string().max(6000)),
  path: z.string().max(120).nullable().optional(),
});

const KNOWN = new Set(EVALUATION.flatMap((s) => s.params.map((p) => paramId(s, p))));
const PATH_ENUM = ["PERSONAL_TRAINING", "GROUP_TRAINING", "EITHER"] as const;

function clean(p: z.output<typeof Schema>): EvaluationData {
  // Keep unknown keys: a parameter removed from the config keeps its stored value until someone clears it.
  const values = Object.fromEntries(Object.entries(p.values).filter(([k, v]) => KNOWN.has(k) || Object.keys(v).length > 0));
  return { values, summary: p.summary, path: p.path ?? null };
}

const fail = (e: unknown): Result => (console.error("evaluation action failed", e), { error: e instanceof Error && e.message === "No access to this client" ? "No access. This client is outside your scope." : "Could not save. Try again." });

async function openReport(clientId: string, authorId: string) {
  const r = await prisma.report.findFirst({ where: { clientId, status: { not: "RELEASED" } }, orderBy: { createdAt: "desc" } });
  if (r) return r;
  const a = await prisma.assessment.findFirst({ where: { clientId, releasedAt: null }, orderBy: { date: "desc" } });
  return prisma.report.create({ data: { clientId, assessmentId: a?.id ?? null, kind: a?.kind ?? "BASELINE", status: "DRAFT", authorId, createdAt: now() } });
}

function revalidate(clientId: string, reportId?: string) {
  revalidatePath(`/staff/evaluate/${clientId}`);
  if (reportId) revalidatePath(`/staff/review/${reportId}`);
  revalidatePath("/staff/assessments");
  revalidatePath("/staff");
}

/** Head of department: assign (or reassign) a client's evaluation to a coach. */
export async function assignEvaluation(clientId: string, coachId: string): Promise<Result> {
  try {
    const ctx = await actionCtx(clientId, "reports.approve");
    const coach = await prisma.staffProfile.findUniqueOrThrow({ where: { id: coachId }, include: { user: true } });
    const client = await prisma.clientProfile.findUniqueOrThrow({ where: { id: clientId } });
    let r = await prisma.report.findFirst({ where: { clientId, status: { not: "RELEASED" } }, orderBy: { createdAt: "desc" } });
    if (r?.status === "PENDING_APPROVAL") return { error: "This report is with the head coach. Return it first." };
    const previous = r?.assignedToId ?? r?.authorId ?? null;
    const at = now();
    if (r) r = await prisma.report.update({ where: { id: r.id }, data: { assignedToId: coach.id, assignedById: ctx.staff.id, assignedAt: at, authorId: coach.id, dueAt: r.dueAt ?? new Date(at.getTime() + 48 * 3_600_000) } });
    else {
      const a = await prisma.assessment.findFirst({ where: { clientId, releasedAt: null }, orderBy: { date: "desc" } });
      r = await prisma.report.create({ data: { clientId, assessmentId: a?.id ?? null, kind: a?.kind ?? "BASELINE", status: "DRAFT", authorId: coach.id, assignedToId: coach.id, assignedById: ctx.staff.id, assignedAt: at, dueAt: new Date(at.getTime() + 48 * 3_600_000), createdAt: at } });
    }
    await prisma.clientCoach.createMany({ data: [{ clientId, staffId: coach.id, role: "ASSESSMENT" }], skipDuplicates: true });
    const who = `${client.firstName} ${client.lastName}`;
    if (coach.id !== ctx.staff.id)
      await notifier.send({ to: coach.user.email, channel: "EMAIL", template: "evaluation_assigned", subject: `${who} · evaluation assigned to you`, body: `${ctx.name} assigned ${client.firstName}’s evaluation to you.\n\nStart it: /staff/evaluate/${clientId}` });
    await audit(ctx, "EVALUATION_ASSIGNED", `${previous && previous !== coach.id ? "Reassigned" : "Assigned"} evaluation to ${coach.user.name ?? coach.user.email} · ${who}`, clientId);
    revalidate(clientId, r.id);
    return { ok: true, toast: `Assigned to ${coach.user.name ?? "the coach"}.`, reportId: r.id };
  } catch (e) {
    return fail(e);
  }
}

/** Autosave (debounced on the screen). Creates the draft report on first save. */
export async function saveEvaluation(clientId: string, payload: unknown): Promise<Result> {
  try {
    const ctx = await actionCtx(clientId);
    const data = clean(Schema.parse(payload));
    const r = await openReport(clientId, ctx.staff.id);
    const assignee = r.assignedToId ?? r.authorId;
    if (assignee && assignee !== ctx.staff.id && scopeOf(ctx.role, "reports.approve") === false) return { error: "This evaluation is assigned to another coach." };
    if (r.status === "PENDING_APPROVAL" && scopeOf(ctx.role, "reports.approve") === false) return { error: "Submitted for review. The head coach has it now." };
    const picked = Object.values(data.values).filter((v) => v.priority).length;
    if (picked > REPORT.maxPriorities) return { error: `Mark up to ${REPORT.maxPriorities} priorities.` };
    const pathIdx = data.path ? REPORT.paths.indexOf(data.path) : -1;
    await prisma.report.update({
      where: { id: r.id },
      data: { evaluation: data, authorId: r.authorId ?? ctx.staff.id, assignedToId: r.assignedToId ?? r.authorId ?? ctx.staff.id, practitionerNote: data.summary.overview ?? null, startingPoint: data.summary.startHere || null, recommendedPath: pathIdx >= 0 && pathIdx < 3 ? PATH_ENUM[pathIdx] : null },
    });
    return { ok: true, reportId: r.id };
  } catch (e) {
    return fail(e);
  }
}

/** Submit for head coach review: required parameters answered, summary written. */
export async function submitEvaluation(clientId: string, payload: unknown): Promise<Result> {
  try {
    const saved = await saveEvaluation(clientId, payload);
    if (saved.error) return saved;
    const ctx = await actionCtx(clientId);
    const data = clean(Schema.parse(payload));
    const { missing } = progress(data);
    if (missing.length) return { error: `Answer the required items first: ${missing.slice(0, 3).join("; ")}${missing.length > 3 ? "…" : ""}` };
    if (REPORT.summary.length && !data.summary[REPORT.summary[0].key]?.trim()) return { error: `Write the ${REPORT.summary[0].label.toLowerCase()} first.` };
    const r = await prisma.report.findUniqueOrThrow({ where: { id: saved.reportId! }, include: { client: true } });
    if (r.status === "PENDING_APPROVAL") return { ok: true, toast: "Saved. The head coach has it." };
    const wasReturned = r.status === "RETURNED";
    await prisma.report.update({ where: { id: r.id }, data: { status: "PENDING_APPROVAL", submittedAt: now(), dueAt: r.dueAt ?? new Date(now().getTime() + 24 * 3_600_000) } });
    await prisma.clientProfile.update({ where: { id: clientId }, data: { assessmentStatus: "PRACTITIONER_REVIEW" } });
    const heads = await prisma.staffProfile.findMany({ where: { role: { in: ["HOD", "FOUNDER"] }, id: { not: ctx.staff.id } }, include: { user: true } });
    const who = `${r.client.firstName} ${r.client.lastName}`;
    for (const h of heads)
      await notifier.send({ to: h.user.email, channel: "EMAIL", template: "report_submitted", subject: `${who} · report ${wasReturned ? "resubmitted" : "submitted"} for review`, body: `${ctx.name} ${wasReturned ? "resubmitted" : "submitted"} ${r.client.firstName}’s evaluation.\n\nReview it: /staff/review/${r.id}` });
    await audit(ctx, "REPORT_SUBMITTED", `${wasReturned ? "Resubmitted" : "Submitted"} evaluation for review · ${who}`, clientId);
    revalidate(clientId, r.id);
    return { ok: true, toast: "Submitted. The head coach has been notified.", redirect: scopeOf(ctx.role, "reports.approve") === false ? "/staff/assessments" : undefined };
  } catch (e) {
    return fail(e);
  }
}
