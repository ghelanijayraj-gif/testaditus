"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireClient } from "@/server/auth/guards";
import { now } from "@/lib/clock";
import { notifier } from "@/server/integrations/notify";
import { GROUP_NAMES } from "@/components/shared/bodyGeometry";
import { AGREEMENT_VERSION, INTAKE_SECTIONS, SAFETY_ITEMS, TREATMENTS, WHEN_CHIPS, safetyItemsFor, type IntakeAnswers } from "@/server/onboarding/intakeDefs";
import { hasColdExposure, refreshSummaries, syncIntakeModule, upsertAnswers } from "@/server/onboarding/intake";
import { recordFailedUpload } from "@/server/onboarding/upload";
import { cancelIntakeReminders } from "@/server/onboarding/reminders";
import { intakeCompleteStaffEmail } from "@/server/onboarding/emails";

type R = { ok: boolean; error?: string };
const ok: R = { ok: true };
const bad = (error: string): R => ({ ok: false, error });

async function me() {
  const { client } = await requireClient();
  return client;
}

/* ── Chip answers and free text (autosave per tap / debounced text) ── */

export async function saveChips(key: string, q: string, values: string[]): Promise<R> {
  const c = await me();
  const sec = INTAKE_SECTIONS.find((s) => s.key === key);
  const g = sec?.groups.find((x) => x.q === q);
  if (!sec || !g) return bad("Unknown question");
  const vals = [...new Set(values)].filter((v) => g.options.includes(v));
  if (!g.multi && vals.length > 1) return bad("Pick one");
  const prev = await prisma.intakeSection.findUnique({ where: { clientId_key: { clientId: c.id, key } } });
  const groups = { ...(((prev?.answers ?? {}) as IntakeAnswers).groups ?? {}), [q]: vals };
  await upsertAnswers(c.id, key, { groups }, { skipped: false });
  if (key === "goals" && !c.goalHeadline && vals[0]) await prisma.clientProfile.update({ where: { id: c.id }, data: { goalHeadline: vals[0] } });
  return ok;
}

export async function saveText(key: string, text: string): Promise<R> {
  const c = await me();
  const sec = INTAKE_SECTIONS.find((s) => s.key === key);
  if (!sec?.text) return bad("Unknown question");
  await upsertAnswers(c.id, key, { text: text.slice(0, 500) }, { skipped: false });
  return ok;
}

/* ── Step navigation: Continue, Skip for now, Back (resume point = intakeStep) ── */

export async function goToStep(from: number, to: number, mode: "continue" | "skip" | "back"): Promise<R> {
  const c = await me();
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from > 12 || to > 12) return bad("Bad step");
  const sec = INTAKE_SECTIONS[from];
  if (sec && mode !== "back") {
    const at = now();
    if (mode === "skip") await upsertAnswers(c.id, sec.key, {}, { skipped: true, completedAt: null });
    else await upsertAnswers(c.id, sec.key, {}, { skipped: false, completedAt: at });
    if (sec.kind) await refreshSummaries(c.id);
  }
  if (from === 10 && mode === "continue") {
    const items = safetyItemsFor(await hasColdExposure(c.id));
    const sec10 = await prisma.intakeSection.findUnique({ where: { clientId_key: { clientId: c.id, key: "safety" } } });
    const answered = ((sec10?.answers ?? {}) as IntakeAnswers).items ?? {};
    if (!items.every((i) => answered[i.key])) return bad("Answer every safety question first.");
    await prisma.intakeSection.update({ where: { id: sec10!.id }, data: { completedAt: now() } });
  }
  // Step 12 (Done) is only reached through completeIntake.
  if (!c.intakeCompletedAt) await prisma.clientProfile.update({ where: { id: c.id }, data: { intakeStep: Math.min(to, 11) } });
  await syncIntakeModule(c.id);
  return ok;
}

/* ── Movement concerns (body map) ── */

const Region = z.string().regex(/^[RLC]:[a-z]+$/).refine((r) => !!GROUP_NAMES[r.split(":")[1]]);
const sideOf = (r: string) => (r.startsWith("R:") ? "RIGHT" : r.startsWith("L:") ? "LEFT" : "NONE") as "RIGHT" | "LEFT" | "NONE";

export async function toggleConcern(region: string): Promise<R> {
  const c = await me();
  if (!Region.safeParse(region).success) return bad("Unknown region");
  const hit = await prisma.bodyConcern.findFirst({ where: { clientId: c.id, region } });
  if (hit) await prisma.bodyConcern.deleteMany({ where: { clientId: c.id, region } });
  else await prisma.bodyConcern.create({ data: { clientId: c.id, region, side: sideOf(region), intensity: 3, when: [] } });
  await upsertAnswers(c.id, "concerns", {}, { skipped: false });
  await refreshSummaries(c.id);
  return ok;
}

export async function updateConcern(region: string, patch: { intensity?: number; when?: string[] }): Promise<R> {
  const c = await me();
  if (!Region.safeParse(region).success) return bad("Unknown region");
  const data: { intensity?: number; when?: string[] } = {};
  if (patch.intensity != null) {
    if (!Number.isInteger(patch.intensity) || patch.intensity < 0 || patch.intensity > 10) return bad("0 to 10");
    data.intensity = patch.intensity;
  }
  if (patch.when) data.when = [...new Set(patch.when)].filter((w) => WHEN_CHIPS.includes(w));
  await prisma.bodyConcern.updateMany({ where: { clientId: c.id, region }, data });
  await refreshSummaries(c.id);
  return ok;
}

/* ── Injuries ── */

const Injury = z.object({
  id: z.string().max(40).nullable(),
  description: z.string().max(200),
  occurredOn: z.string().regex(/^(\d{4}-\d{2})?$/),
  side: z.enum(["Left", "Right", "Both"]),
  treatments: z.array(z.enum(TREATMENTS.map(([k]) => k) as [string, ...string[]])).max(5),
});

/** Autosaves the injury draft (creates it once it has any content). Returns its id. */
export async function saveInjury(input: z.infer<typeof Injury>): Promise<R & { id?: string }> {
  const c = await me();
  const p = Injury.safeParse(input);
  if (!p.success) return bad("Check the injury details");
  const v = p.data;
  const data = {
    description: v.description.trim(),
    occurredOn: v.occurredOn || null,
    side: v.side === "Left" ? ("LEFT" as const) : v.side === "Right" ? ("RIGHT" as const) : ("NONE" as const),
    treatments: v.treatments,
    treatmentNote: v.treatments.map((t) => TREATMENTS.find(([k]) => k === t)?.[1] ?? t).join(", ") || null,
  };
  let id = v.id;
  if (id) {
    const r = await prisma.injury.updateMany({ where: { id, clientId: c.id }, data });
    if (!r.count) return bad("Not found");
  } else {
    id = (await prisma.injury.create({ data: { clientId: c.id, ...data, createdAt: now() } })).id;
  }
  const sec = await prisma.intakeSection.findUnique({ where: { clientId_key: { clientId: c.id, key: "injuries" } } });
  const sides = { ...(((sec?.answers ?? {}) as IntakeAnswers).sides ?? {}), [id]: v.side };
  await upsertAnswers(c.id, "injuries", { sides }, { skipped: false });
  await refreshSummaries(c.id);
  return { ok: true, id };
}

/** An upload that did not finish: kept as a FAILED document so Home and staff see it. */
export async function reportUploadFailed(name: string, percent: number): Promise<R> {
  const c = await me();
  await recordFailedUpload(c.id, `${c.firstName} ${c.lastName}`.trim(), String(name), Number(percent) || 0);
  return ok;
}

/* ── Safety check (staff only flags; the client never sees a warning) ── */

export async function answerSafety(key: string, answer: "yes" | "no", note?: string): Promise<R> {
  const c = await me();
  const item = SAFETY_ITEMS.find((i) => i.key === key);
  if (!item || (answer !== "yes" && answer !== "no")) return bad("Unknown question");
  const sec = await prisma.intakeSection.findUnique({ where: { clientId_key: { clientId: c.id, key: "safety" } } });
  const a = (sec?.answers ?? {}) as IntakeAnswers;
  const notes = { ...(a.notes ?? {}) };
  if (note != null) notes[key] = note.slice(0, 300);
  await upsertAnswers(c.id, "safety", { items: { ...(a.items ?? {}), [key]: answer }, notes });
  if (answer === "yes") {
    const flag = await prisma.safetyFlag.findFirst({ where: { clientId: c.id, item: item.q } });
    if (flag) await prisma.safetyFlag.update({ where: { id: flag.id }, data: { note: notes[key] || null } });
    else await prisma.safetyFlag.create({ data: { clientId: c.id, item: item.q, note: notes[key] || null, label: "Discuss before testing", createdAt: now() } });
  } else {
    await prisma.safetyFlag.deleteMany({ where: { clientId: c.id, item: item.q } });
  }
  return ok;
}

/* ── Agreement and consent ── */

export async function setAgreement(which: "agreed" | "photos", granted: boolean): Promise<R> {
  const c = await me();
  const kind = which === "agreed" ? "ASSESSMENT_AGREEMENT" : "ASSESSMENT_MEDIA";
  const at = now();
  await prisma.consent.upsert({
    where: { clientId_kind: { clientId: c.id, kind } },
    create: { clientId: c.id, kind, granted: !!granted, source: "intake", version: AGREEMENT_VERSION, changedAt: at },
    update: { granted: !!granted, source: "intake", version: AGREEMENT_VERSION, changedAt: at },
  });
  await upsertAnswers(c.id, "agreement", { [which]: !!granted, version: AGREEMENT_VERSION });
  return ok;
}

/** FINISH INTAKE: validates safety + agreement, marks the plan's Intake done and tells the practitioner. */
export async function completeIntake(): Promise<R> {
  const c = await me();
  const items = safetyItemsFor(await hasColdExposure(c.id));
  const [safety, agreement] = await Promise.all([
    prisma.intakeSection.findUnique({ where: { clientId_key: { clientId: c.id, key: "safety" } } }),
    prisma.consent.findUnique({ where: { clientId_kind: { clientId: c.id, kind: "ASSESSMENT_AGREEMENT" } } }),
  ]);
  const answered = ((safety?.answers ?? {}) as IntakeAnswers).items ?? {};
  if (!items.every((i) => answered[i.key])) return bad("Answer every safety question first.");
  if (!agreement?.granted) return bad("Tick the assessment agreement to finish.");
  const at = now();
  const first = !c.intakeCompletedAt;
  await prisma.clientProfile.update({
    where: { id: c.id },
    data: {
      intakeStep: 12,
      intakeCompletedAt: c.intakeCompletedAt ?? at,
      assessmentStatus: ["PURCHASED", "PROFILE_REQUIRED", "INTAKE_REQUIRED"].includes(c.assessmentStatus) ? "INTAKE_COMPLETE" : c.assessmentStatus,
      stage: c.stage === "ASSESSMENT_PURCHASED" ? "ONBOARDING" : c.stage,
    },
  });
  await upsertAnswers(c.id, "agreement", {}, { completedAt: at });
  await syncIntakeModule(c.id);
  await cancelIntakeReminders(c.id);
  if (first) {
    const name = `${c.firstName} ${c.lastName}`.trim();
    await prisma.activityLog.create({ data: { clientId: c.id, actorName: name, action: "Intake completed", createdAt: at } });
    const pract = c.primaryPractitionerId ? await prisma.staffProfile.findUnique({ where: { id: c.primaryPractitionerId }, include: { user: true } }) : null;
    if (pract) {
      const flags = await prisma.safetyFlag.count({ where: { clientId: c.id } });
      const mail = intakeCompleteStaffEmail({ clientName: name, flags });
      // Staff notification: no clientId, so it never shows in the client's "Sent to you" log.
      await notifier.send({ to: pract.user.email, channel: "EMAIL", template: "intake_complete_staff", subject: mail.subject, body: mail.body });
    }
  }
  revalidatePath("/", "layout");
  return ok;
}
