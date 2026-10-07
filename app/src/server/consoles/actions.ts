"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { audit } from "@/server/auth/guards";
import { notifier, sendTemplate } from "@/server/integrations/notify";
import { now } from "@/lib/clock";
import { scopeOf } from "@/lib/permissions";
import { DEFAULT_PHASES, PHASE_OF_SYSTEM, SECTIONS, findingBody, storedTag, type Phase } from "@/components/staff/consoles/lib";
import { actionCtx } from "./access";
import { isOnline, loadBank, readPhases } from "./data";

type Result = { ok?: boolean; toast?: string; error?: string; redirect?: string };

const fail = (e: unknown): Result => ({ error: e instanceof Error && e.message === "No access to this client" ? "No access. This client is outside your scope." : "Could not save. Try again." });

async function assessmentOf(id: string) {
  return prisma.assessment.findUniqueOrThrow({ where: { id }, include: { client: true } });
}

function revalidateConsoles(assessmentId?: string | null) {
  if (assessmentId) revalidatePath(`/staff/practitioner/${assessmentId}`);
  revalidatePath("/staff/review", "layout");
  revalidatePath("/staff/photo-review", "layout");
}

// ───────────────────────────── Brief ─────────────────────────────

export async function setTestKeys(assessmentId: string, keys: string[]): Promise<Result> {
  try {
    const a = await assessmentOf(assessmentId);
    await actionCtx(a.clientId);
    const bank = new Set((await loadBank()).map((t) => t.key));
    const clean = z.array(z.string()).parse(keys).filter((k) => bank.has(k));
    await prisma.assessment.update({ where: { id: a.id }, data: { testKeys: clean, measuresTotal: clean.length } });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Start assessment: Check in done, Conversation current; client status Assessment in progress. */
export async function startAssessment(assessmentId: string, keys: string[]): Promise<Result> {
  try {
    const a = await assessmentOf(assessmentId);
    const ctx = await actionCtx(a.clientId);
    const bank = new Set((await loadBank()).map((t) => t.key));
    const clean = keys.filter((k) => bank.has(k));
    const existing = readPhases(a.phases);
    const phases: Phase[] = (existing.length ? existing : DEFAULT_PHASES.map((p) => ({ ...p, state: "PENDING" as const }))).map((p) => ({
      ...p,
      state: p.key === "checkin" ? "DONE" : p.key === "conversation" ? "CURRENT" : p.state === "DONE" ? "DONE" : "PENDING",
    }));
    await prisma.assessment.update({ where: { id: a.id }, data: { testKeys: clean, measuresTotal: clean.length, phases, paused: false } });
    if (!["PRACTITIONER_REVIEW", "REPORT_PROCESSING", "REPORT_READY"].includes(a.client.assessmentStatus))
      await prisma.clientProfile.update({ where: { id: a.clientId }, data: { assessmentStatus: "IN_PROGRESS", stage: a.client.stage === "ONBOARDING" ? "ASSESSMENT_DAY" : a.client.stage } });
    await audit(ctx, "ASSESSMENT_STARTED", `Started assessment · ${a.client.firstName} ${a.client.lastName} · ${clean.length} tests`, a.clientId);
    revalidateConsoles(a.id);
    return { ok: true, redirect: `/staff/practitioner/${a.id}?tab=console` };
  } catch (e) {
    return fail(e);
  }
}

// ───────────────────────────── Console ─────────────────────────────

const OpSchema = z.object({
  id: z.string().min(6).max(80),
  testKey: z.string(),
  kind: z.enum(["value", "meta", "skip"]),
  side: z.enum(["LEFT", "RIGHT", "NONE"]).default("NONE"),
  value: z.number().finite().nullable().optional(),
  text: z.string().max(400).nullable().optional(),
  skipReason: z.string().max(40).nullable().optional(),
  priority: z.boolean().optional(),
  observation: z.array(z.string().max(60)).max(20).optional(),
  note: z.string().max(2000).optional(),
});
export type MeasureOp = z.input<typeof OpSchema>;

/**
 * Autosave from the console (and replay of the tablet's offline queue). Every value op
 * carries a client generated id stored as `clientOpId`; a replayed op is a no op.
 */
export async function saveMeasures(assessmentId: string, ops: MeasureOp[], source: "console" | "photo_review" = "console"): Promise<Result & { done?: string[] }> {
  try {
    const a = await assessmentOf(assessmentId);
    const ctx = await actionCtx(a.clientId);
    const list = z.array(OpSchema).max(200).parse(ops);
    const bank = Object.fromEntries((await loadBank()).map((t) => [t.key, t]));
    const online = isOnline(a);
    const done: string[] = [];
    for (const op of list) {
      const def = bank[op.testKey];
      if (!def) {
        done.push(op.id);
        continue;
      }
      if (op.kind !== "meta" && (await prisma.measureValue.findUnique({ where: { clientOpId: op.id } }))) {
        done.push(op.id);
        continue;
      }
      const rows = await prisma.measureValue.findMany({ where: { assessmentId: a.id, testKey: op.testKey } });
      const meta = { priority: rows.some((r) => r.priority), observation: rows.find((r) => r.observation.length)?.observation ?? [], note: rows.find((r) => r.note)?.note ?? null };
      const base = { clientId: a.clientId, assessmentId: a.id, testKey: op.testKey, unit: def.unit, tag: source === "photo_review" ? ("OBSERVED" as const) : storedTag(def, online), source, capturedBy: ctx.name, capturedAt: now() };
      if (op.kind === "value") {
        // A value replaces a skip.
        await prisma.measureValue.deleteMany({ where: { assessmentId: a.id, testKey: op.testKey, notTested: true } });
        const data = { value: op.value ?? null, text: op.text ?? null, notTested: false, skipReason: null, clientOpId: op.id, tag: base.tag, unit: base.unit, source, capturedBy: ctx.name, capturedAt: now() };
        await prisma.measureValue.upsert({
          where: { assessmentId_testKey_side: { assessmentId: a.id, testKey: op.testKey, side: op.side } },
          create: { ...base, ...data, side: op.side, ...meta },
          update: data,
        });
        // Sided tests keep their meta on the side rows; drop an empty meta only row.
        if (op.side !== "NONE") await prisma.measureValue.deleteMany({ where: { assessmentId: a.id, testKey: op.testKey, side: "NONE", value: null, text: null, notTested: false } });
      } else if (op.kind === "skip") {
        await prisma.measureValue.deleteMany({ where: { assessmentId: a.id, testKey: op.testKey } });
        await prisma.measureValue.create({ data: { ...base, side: "NONE", notTested: true, skipReason: op.skipReason ?? "declined", clientOpId: op.id, ...meta } });
      } else {
        const patch: Prisma.MeasureValueUpdateManyMutationInput = {};
        if (op.priority !== undefined) patch.priority = op.priority;
        if (op.observation !== undefined) patch.observation = op.observation;
        if (op.note !== undefined) patch.note = op.note || null;
        if (rows.length) await prisma.measureValue.updateMany({ where: { assessmentId: a.id, testKey: op.testKey }, data: patch });
        else
          await prisma.measureValue.create({
            data: { ...base, side: "NONE", priority: op.priority ?? false, observation: op.observation ?? [], note: op.note || null },
          });
      }
      done.push(op.id);
    }
    return { ok: true, done };
  } catch (e) {
    return fail(e);
  }
}

/** Phase change from the console: earlier system phases done, this one current. The client Day screen polls this. */
export async function setPhase(assessmentId: string, key: string, mode: "current" | "done" = "current"): Promise<Result> {
  try {
    const a = await assessmentOf(assessmentId);
    await actionCtx(a.clientId);
    const phases = readPhases(a.phases);
    const idx = phases.findIndex((p) => p.key === key);
    if (idx < 0) return { ok: true };
    const next = phases.map((p, i) => {
      if (p.state === "NOT_NEEDED") return p;
      if (mode === "done") return i <= idx ? { ...p, state: "DONE" as const } : i === idx + 1 ? { ...p, state: "CURRENT" as const } : p.state === "CURRENT" ? { ...p, state: "PENDING" as const } : p;
      return i < idx ? { ...p, state: "DONE" as const } : i === idx ? { ...p, state: "CURRENT" as const } : p.state === "CURRENT" ? { ...p, state: "PENDING" as const } : p;
    });
    await prisma.assessment.update({ where: { id: a.id }, data: { phases: next } });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function phaseForSystem(assessmentId: string, system: keyof typeof PHASE_OF_SYSTEM) {
  return setPhase(assessmentId, PHASE_OF_SYSTEM[system], "current");
}

/** Finish testing: all system phases done, Close current. */
export async function completeTesting(assessmentId: string): Promise<Result> {
  const r = await setPhase(assessmentId, "performance", "done");
  if (r.error) return r;
  revalidateConsoles(assessmentId);
  return { ok: true, redirect: `/staff/practitioner/${assessmentId}?tab=wrap` };
}

/**
 * Live online: push an instruction (and timer state) to the client's screen. A timed test
 * sets `timerStartedAt` on start and `timerStoppedAt` + `timerSeconds` on stop, so the
 * client's live timer is real. Day polls the latest cue.
 */
export async function pushCue(assessmentId: string, text: string, opts: { label?: string; timer?: "start" | "stop"; seconds?: number } = {}): Promise<Result> {
  try {
    const a = await assessmentOf(assessmentId);
    await actionCtx(a.clientId);
    const t = z.string().trim().min(1).max(160).parse(text);
    const at = new Date();
    if (opts.timer === "stop") {
      const open = await prisma.liveCue.findFirst({ where: { assessmentId: a.id, timerStartedAt: { not: null }, timerStoppedAt: null }, orderBy: { createdAt: "desc" } });
      if (open) {
        await prisma.liveCue.update({ where: { id: open.id }, data: { timerStoppedAt: at, timerSeconds: opts.seconds != null ? Math.round(opts.seconds) : null } });
        return { ok: true };
      }
    }
    await prisma.liveCue.create({
      data: {
        assessmentId: a.id, text: t, label: opts.label ?? null, createdAt: at, // real time: cues are ordered live
        timerSeconds: opts.timer === "stop" && opts.seconds != null ? Math.round(opts.seconds) : null,
        timerStartedAt: opts.timer ? at : null, timerStoppedAt: opts.timer === "stop" ? at : null,
      },
    });
    return { ok: true, toast: opts.timer ? undefined : `Sent to ${a.client.firstName}’s screen.` };
  } catch (e) {
    return fail(e);
  }
}

// ───────────────────────────── Wrap up ─────────────────────────────

const WrapSchema = z.object({
  candidates: z
    .array(z.object({ key: z.string().max(60), name: z.string().max(120), picked: z.boolean(), observed: z.string().max(2000), why: z.string().max(2000), workOn: z.string().max(2000), related: z.array(z.string().max(80)).max(10) }))
    .max(30),
  sections: z.record(z.string(), z.string().max(4000)),
  startingPoint: z.string().max(2000).optional(),
  note: z.string().max(3000),
  path: z.enum(["PERSONAL_TRAINING", "GROUP_TRAINING", "EITHER"]).nullable(),
  reason: z.string().max(300),
});
export type WrapPayload = z.input<typeof WrapSchema>;

async function reportFor(assessmentId: string, authorId: string) {
  const a = await assessmentOf(assessmentId);
  const r =
    (await prisma.report.findFirst({ where: { assessmentId: a.id }, orderBy: { createdAt: "desc" } })) ??
    (await prisma.report.findFirst({ where: { clientId: a.clientId, assessmentId: null, status: { not: "RELEASED" } }, orderBy: { createdAt: "desc" } }));
  if (r) return r.assessmentId ? r : prisma.report.update({ where: { id: r.id }, data: { assessmentId: a.id } });
  return prisma.report.create({ data: { clientId: a.clientId, assessmentId: a.id, kind: a.kind, status: "DRAFT", authorId, createdAt: now() } });
}

async function writeWrap(reportId: string, p: z.output<typeof WrapSchema>) {
  const bank = Object.fromEntries((await loadBank()).map((t) => [t.key, t]));
  let order = 0;
  for (const c of p.candidates) {
    if (c.picked) order += 1;
    await prisma.consoleFindingDraft.upsert({
      where: { reportId_testKey: { reportId, testKey: c.key } },
      create: { reportId, testKey: c.key, picked: c.picked, order: c.picked ? order : 99, observed: c.observed, whyItMatters: c.why, workOn: c.workOn, related: c.related },
      update: { picked: c.picked, order: c.picked ? order : 99, observed: c.observed, whyItMatters: c.why, workOn: c.workOn, related: c.related },
    });
  }
  await prisma.consoleFindingDraft.deleteMany({ where: { reportId, testKey: { notIn: p.candidates.map((c) => c.key) } } });
  // Mirror picked priorities into Findings (the canonical rows the report renders).
  await prisma.finding.deleteMany({ where: { reportId } });
  let n = 0;
  for (const c of p.candidates.filter((x) => x.picked)) {
    n += 1;
    const def = bank[c.key];
    const body = findingBody(c.key);
    await prisma.finding.create({
      data: {
        reportId, order: n, system: def?.system ?? "MOVEMENT", title: def?.name ?? c.name, observed: c.observed, whyItMatters: c.why, workOn: c.workOn, related: c.related,
        bodyGroups: def?.system === "MOVEMENT" ? body.bodyGroups : [], marker: def?.system === "MOVEMENT" && body.marker ? body.marker : undefined, measureKeys: def ? [c.key] : [],
      },
    });
  }
  const sections = Object.fromEntries(SECTIONS.map((s) => [s.key, (p.sections[s.key] ?? "").trim()]));
  await prisma.report.update({
    where: { id: reportId },
    data: { sections, practitionerNote: p.note, recommendedPath: p.path, pathReason: p.reason, ...(p.startingPoint !== undefined ? { startingPoint: p.startingPoint || null } : {}) },
  });
  return n;
}

/** Autosave of the whole Wrap up draft (debounced on the client). */
export async function saveWrap(assessmentId: string, payload: WrapPayload): Promise<Result & { reportId?: string }> {
  try {
    const a = await assessmentOf(assessmentId);
    const ctx = await actionCtx(a.clientId);
    const p = WrapSchema.parse(payload);
    const r = await reportFor(a.id, ctx.staff.id);
    if (r.status === "RELEASED") return { error: "This report is released and locked." };
    if (r.status === "PENDING_APPROVAL" && scopeOf(ctx.role, "reports.approve") === false) return { error: "Submitted for review. The head coach has it now." };
    await writeWrap(r.id, p);
    return { ok: true, reportId: r.id };
  } catch (e) {
    return fail(e);
  }
}

/** Submit for review: 3 to 5 priorities; report pending approval; client status Practitioner review; head coach notified. */
export async function submitForReview(assessmentId: string, payload: WrapPayload): Promise<Result> {
  try {
    const a = await assessmentOf(assessmentId);
    const ctx = await actionCtx(a.clientId);
    const p = WrapSchema.parse(payload);
    const picked = p.candidates.filter((c) => c.picked);
    if (picked.length < 3 || picked.length > 5) return { error: "Pick 3 to 5 priorities." };
    if (picked.some((c) => !c.observed.trim())) return { error: "Write what you observed for every priority." };
    const r = await reportFor(a.id, ctx.staff.id);
    if (r.status === "RELEASED") return { error: "This report is released and locked." };
    await writeWrap(r.id, p);
    const wasReturned = r.status === "RETURNED";
    await prisma.report.update({ where: { id: r.id }, data: { status: "PENDING_APPROVAL", submittedAt: now(), authorId: r.authorId ?? ctx.staff.id, dueAt: r.dueAt ?? new Date(now().getTime() + 24 * 3_600_000) } });
    await prisma.clientProfile.update({ where: { id: a.clientId }, data: { assessmentStatus: "PRACTITIONER_REVIEW" } });
    // Close phase done once the report is written.
    const phases = readPhases(a.phases);
    if (phases.some((x) => x.state !== "PENDING")) await prisma.assessment.update({ where: { id: a.id }, data: { phases: phases.map((x) => (x.state === "NOT_NEEDED" ? x : { ...x, state: "DONE" })), submittedAt: now() } });
    // Notify the head coaches (staff side, so no clientId: it must not show in the client's "Sent to you").
    const heads = await prisma.staffProfile.findMany({ where: { role: { in: ["HOD", "FOUNDER"] }, id: { not: ctx.staff.id } }, include: { user: true } });
    const who = `${a.client.firstName} ${a.client.lastName}`;
    for (const h of heads)
      await notifier.send({ to: h.user.email, channel: "EMAIL", template: "report_submitted", subject: `${who} · report ${wasReturned ? "resubmitted" : "submitted"} for review`, body: `${ctx.name} ${wasReturned ? "fixed and resubmitted" : "submitted"} ${a.client.firstName}’s report with ${picked.length} priorities.\n\nReview it: /staff/review/${r.id}` });
    await audit(ctx, "REPORT_SUBMITTED", `${wasReturned ? "Resubmitted" : "Submitted"} report for review · ${who}`, a.clientId);
    revalidateConsoles(a.id);
    return { ok: true, toast: "Submitted. The head coach has been notified." };
  } catch (e) {
    return fail(e);
  }
}

// ───────────────────────────── Head coach ─────────────────────────────

async function reportCtx(reportId: string) {
  const r = await prisma.report.findUniqueOrThrow({ where: { id: reportId }, include: { client: true, author: { include: { user: true } } } });
  const ctx = await actionCtx(r.clientId, "reports.approve");
  return { r, ctx };
}

export async function approveAndRelease(reportId: string): Promise<Result> {
  try {
    const { r, ctx } = await reportCtx(reportId);
    if (r.status !== "PENDING_APPROVAL") return { error: "Only a report waiting for review can be released." };
    const at = now();
    await prisma.report.update({ where: { id: r.id }, data: { status: "RELEASED", releasedAt: at, approverId: ctx.staff.id } });
    await prisma.reviewComment.create({ data: { reportId: r.id, authorId: ctx.staff.id, action: "APPROVED", body: "Approved and released", createdAt: at } });
    await prisma.clientProfile.update({ where: { id: r.clientId }, data: { assessmentStatus: "REPORT_READY", stage: "REPORT" } });
    if (r.assessmentId) await prisma.assessment.update({ where: { id: r.assessmentId }, data: { releasedAt: at } });
    // Plan system steps (Practitioner review, Report) are done.
    await prisma.planModule.updateMany({ where: { plan: { clientId: r.clientId }, OR: [{ system: true }, { type: "SYSTEM" }], removed: false }, data: { status: "DONE" } });
    await sendTemplate("report_ready", { clientId: r.clientId, vars: { first_name: r.client.firstName, link: "/reports" } });
    await audit(ctx, "REPORT_RELEASED", `Approved and released report · ${r.client.firstName} ${r.client.lastName}`, r.clientId);
    revalidateConsoles(r.assessmentId);
    revalidatePath("/", "layout");
    return { ok: true, toast: `Released. ${r.client.firstName} gets an email and a WhatsApp now.` };
  } catch (e) {
    return fail(e);
  }
}

export async function returnWithComment(reportId: string, comment: string): Promise<Result> {
  try {
    const { r, ctx } = await reportCtx(reportId);
    const body = z.string().trim().min(3).max(2000).parse(comment);
    if (r.status !== "PENDING_APPROVAL") return { error: "Only a report waiting for review can be returned." };
    await prisma.report.update({ where: { id: r.id }, data: { status: "RETURNED" } });
    await prisma.reviewComment.create({ data: { reportId: r.id, authorId: ctx.staff.id, action: "RETURNED", body, createdAt: now() } });
    const author = r.author?.user.name ?? "the practitioner";
    if (r.author)
      await notifier.send({ to: r.author.user.email, channel: "EMAIL", template: "report_returned", subject: `${r.client.firstName} ${r.client.lastName} · report returned`, body: `${ctx.name} returned ${r.client.firstName}’s report with a comment:\n\n“${body}”\n\nFix it in Wrap up: /staff/practitioner/${r.assessmentId ?? ""}?tab=wrap` });
    await audit(ctx, "REPORT_RETURNED", `Returned report to ${author} · ${r.client.firstName} ${r.client.lastName}`, r.clientId);
    revalidateConsoles(r.assessmentId);
    return { ok: true, toast: `Returned to ${author} with your comment.` };
  } catch (e) {
    return fail(e);
  }
}

/** Head coach inline edit of findings and sections (same draft as Wrap up), logged as an edit. */
export async function headEdit(reportId: string, payload: WrapPayload): Promise<Result> {
  try {
    const { r, ctx } = await reportCtx(reportId);
    if (r.status === "RELEASED") return { error: "This report is released and locked." };
    const p = WrapSchema.parse(payload);
    const n = p.candidates.filter((c) => c.picked).length;
    if (n < 1 || n > 5) return { error: "Keep 3 to 5 priorities." };
    await writeWrap(r.id, p);
    await prisma.reviewComment.create({ data: { reportId: r.id, authorId: ctx.staff.id, action: "EDITED", body: "Edited the draft", createdAt: now() } });
    await audit(ctx, "REPORT_EDITED", `Edited report draft · ${r.client.firstName} ${r.client.lastName}`, r.clientId);
    revalidateConsoles(r.assessmentId);
    return { ok: true, toast: "Saved your edits.", redirect: `/staff/review/${r.id}` };
  } catch (e) {
    return fail(e);
  }
}

// ───────────────────────────── Photo review (11) ─────────────────────────────

const AnnSchema = z.array(
  z.object({ type: z.enum(["PIN", "PLUMB", "LEVEL", "ANGLE"]), n: z.number().int().optional(), x: z.number().min(0).max(100).optional(), y: z.number().min(0).max(100).optional(), note: z.string().max(400).optional(), ys: z.array(z.number()).max(4).optional(), deg: z.number().optional() }),
).max(60);

export async function saveAnnotations(mediaId: string, annotations: unknown): Promise<Result> {
  try {
    const m = await prisma.mediaAsset.findUniqueOrThrow({ where: { id: mediaId } });
    await actionCtx(m.clientId);
    await prisma.mediaAsset.update({ where: { id: m.id }, data: { annotations: AnnSchema.parse(annotations) } });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Squat score, observations and flag from photo review: Observed MeasureValues. */
export async function saveReviewMeasure(clientId: string, op: MeasureOp): Promise<Result> {
  try {
    await actionCtx(clientId);
    const a = await ensureAssessment(clientId);
    return saveMeasures(a.id, [op], "photo_review");
  } catch (e) {
    return fail(e);
  }
}

async function ensureAssessment(clientId: string) {
  const a = (await prisma.assessment.findFirst({ where: { clientId, kind: "BASELINE" }, orderBy: { date: "desc" } })) ?? (await prisma.assessment.findFirst({ where: { clientId }, orderBy: { date: "desc" } }));
  if (a) return a;
  const c = await prisma.clientProfile.findUniqueOrThrow({ where: { id: clientId } });
  return prisma.assessment.create({ data: { clientId, kind: "BASELINE", format: "ONLINE", date: now(), practitionerId: c.primaryPractitionerId } });
}

export async function requestRetake(clientId: string, input: { mediaId: string; reason: string; message: string; moduleKey: string }): Promise<Result> {
  try {
    const ctx = await actionCtx(clientId);
    const p = z.object({ mediaId: z.string(), reason: z.string().max(60), message: z.string().trim().min(3).max(300), moduleKey: z.string().max(40) }).parse(input);
    const m = await prisma.mediaAsset.findFirstOrThrow({ where: { id: p.mediaId, clientId } });
    const c = await prisma.clientProfile.findUniqueOrThrow({ where: { id: clientId } });
    await prisma.retakeRequest.create({ data: { clientId, mediaId: m.id, step: m.label, reason: p.reason, message: p.message, requestedBy: ctx.name, createdAt: now() } });
    await prisma.mediaAsset.update({ where: { id: m.id }, data: { status: "RETAKE_REQUESTED", retakeReason: p.reason } });
    const what = m.kind === "VIDEO" ? `your ${m.label.toLowerCase()} video` : `your ${m.label.toLowerCase()} photo`;
    // The client's capture wizard reopens just this step (it resolves the step from the media view).
    const mod = await prisma.planModule.findFirst({ where: { plan: { clientId }, key: p.moduleKey } });
    if (mod && mod.data && typeof mod.data === "object" && !Array.isArray(mod.data) && "retake" in mod.data) {
      const { retake: _drop, ...rest } = mod.data as Record<string, unknown>;
      void _drop;
      await prisma.planModule.update({ where: { id: mod.id }, data: { data: rest as Prisma.InputJsonValue } });
    }
    await prisma.planModule.updateMany({
      where: { plan: { clientId }, key: p.moduleKey },
      data: { status: "MORE_NEEDED", extraLine: `${ctx.name} needs ${what} again. ${p.message.replace(/^[^:]*:\s*/, "").replace(/^./, (x) => x.toUpperCase())} About 3 minutes.` },
    });
    await prisma.captureReview.upsert({ where: { clientId_moduleKey: { clientId, moduleKey: p.moduleKey } }, create: { clientId, moduleKey: p.moduleKey, pausedAt: now(), reviewerName: ctx.name }, update: { pausedAt: now() } });
    await sendTemplate("retake_requested", { clientId, vars: { first_name: c.firstName, staff_name: ctx.name, what, reason: p.message, link: `/assessment/steps/${p.moduleKey}` }, channels: ["WHATSAPP"] });
    await audit(ctx, "RETAKE_REQUESTED", `Requested retake · ${c.firstName} ${c.lastName} · ${m.label} · ${p.reason}`, clientId);
    revalidateConsoles();
    return { ok: true, toast: `Sent to ${c.firstName} on WhatsApp. Due time paused.` };
  } catch (e) {
    return fail(e);
  }
}

/** Finish the capture review: Observed measures written as you go; the module is done. Then Wrap up. */
export async function finishReview(clientId: string, moduleKey: string): Promise<Result> {
  try {
    const ctx = await actionCtx(clientId);
    const a = await ensureAssessment(clientId);
    const c = await prisma.clientProfile.findUniqueOrThrow({ where: { id: clientId } });
    // Posture: pin notes become an Observed posture measure.
    const media = await prisma.mediaAsset.findMany({ where: { clientId, moduleKey, supersededById: null } });
    const notes = media.flatMap((m) => ((Array.isArray(m.annotations) ? m.annotations : []) as { type: string; note?: string }[]).filter((x) => x.type === "PIN" && x.note).map((x) => `${m.label}: ${x.note}`));
    if (media.some((m) => m.kind === "PHOTO"))
      await prisma.measureValue.upsert({
        where: { assessmentId_testKey_side: { assessmentId: a.id, testKey: "posture", side: "NONE" } },
        create: { clientId, assessmentId: a.id, testKey: "posture", side: "NONE", text: `Reviewed · ${media.filter((m) => m.kind === "PHOTO").length} photos`, unit: "", tag: "OBSERVED", source: "photo_review", note: notes.join(" · ") || null, capturedBy: ctx.name, capturedAt: now() },
        update: { text: `Reviewed · ${media.filter((m) => m.kind === "PHOTO").length} photos`, note: notes.join(" · ") || null, capturedBy: ctx.name, capturedAt: now() },
      });
    await prisma.mediaAsset.updateMany({ where: { clientId, moduleKey, status: { in: ["UPLOADED", "NEEDS_REVIEW"] } }, data: { status: "ACCEPTED" } });
    const extra = `Reviewed by ${ctx.name}.`;
    await prisma.planModule.updateMany({ where: { plan: { clientId }, key: moduleKey }, data: { status: "DONE", extraLine: extra } });
    await prisma.captureReview.upsert({ where: { clientId_moduleKey: { clientId, moduleKey } }, create: { clientId, moduleKey, finishedAt: now(), reviewerName: ctx.name }, update: { finishedAt: now(), reviewerName: ctx.name } });
    await audit(ctx, "CAPTURE_REVIEWED", `Finished capture review · ${c.firstName} ${c.lastName}`, clientId);
    revalidateConsoles(a.id);
    return { ok: true, toast: "Review finished. Now wrap up.", redirect: `/staff/practitioner/${a.id}?tab=wrap` };
  } catch (e) {
    return fail(e);
  }
}
