"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireClient } from "@/server/auth/guards";
import { now } from "@/lib/clock";
import { dayLabel } from "@/lib/format";
import { CAPTURE_ITEMS, CAPTURE_REQUIRED, NASAL_CHOICES, requiredDone } from "@/lib/assessment/capture";
import { readCapture, resolveRetake } from "./captureView";
import { ensureBaselineAssessment, ensureBaselinePlan, findModule, logActivity, notifyPractitioner } from "./common";

type Result = { toast?: string; error?: string; redirect?: string };

async function captureModule(clientId: string) {
  await ensureBaselinePlan(clientId);
  const mod = await findModule(clientId, "capture");
  if (!mod) throw new Error("No Online Capture in this plan");
  return mod;
}


const stepInput = z.object({
  step: z.string().max(16),
  mediaId: z.string().max(64).optional(),
  value: z.union([z.number().min(0).max(100000), z.string().max(32)]).optional(),
  side: z.enum(["L", "R"]).optional(),
});

/** "Saved after every step": KEEP AND NEXT / SAVE AND NEXT / CONTINUE. */
export async function saveCaptureStep(input: z.input<typeof stepInput>): Promise<Result & { done?: number }> {
  const { client } = await requireClient();
  const p = stepInput.parse(input);
  const item = CAPTURE_ITEMS.find((i) => i.id === p.step);
  if (!item) return { error: "Unknown step." };
  const mod = await captureModule(client.id);
  if (!["NOT_STARTED", "IN_PROGRESS", "MORE_NEEDED"].includes(mod.status)) return { error: "Your capture is already sent." };
  const cap = readCapture(mod.data);

  if (item.kind === "photo" || item.kind === "video") {
    if (!p.mediaId) return { error: "Take the shot first." };
    const media = await prisma.mediaAsset.findFirst({ where: { id: p.mediaId, clientId: client.id, moduleKey: "capture" } });
    if (!media) return { error: "Upload not found. Try again." };
    cap.media[item.id] = media.id;
  } else {
    const assessment = await ensureBaselineAssessment(client.id);
    const at = now();
    const base = { clientId: client.id, assessmentId: assessment.id, testKey: item.testKey!, unit: item.unit ?? "", tag: "SELF_REPORTED" as const, source: "self_test", method: "Self timed at home", capturedAt: at };
    if (item.kind === "choice") {
      const v = String(p.value ?? "");
      if (!NASAL_CHOICES.includes(v)) return { error: "Pick an answer first." };
      cap.values.nasal = v;
      await prisma.measureValue.upsert({ where: { assessmentId_testKey_side: { assessmentId: assessment.id, testKey: base.testKey, side: "NONE" } }, create: { ...base, text: v, method: "Self reported at home" }, update: { text: v, capturedAt: at } });
    } else {
      const n = typeof p.value === "number" ? Math.round(p.value * 10) / 10 : NaN;
      if (!Number.isFinite(n)) return { error: "Nothing recorded yet." };
      const side = item.sided ? (p.side === "L" ? "LEFT" : "RIGHT") : "NONE";
      if (item.id === "bal") cap.values.bal = { ...(cap.values.bal ?? {}), [p.side ?? "R"]: n };
      else if (item.id === "hold" || item.id === "bpm" || item.id === "plank") cap.values[item.id] = n;
      await prisma.measureValue.upsert({
        where: { assessmentId_testKey_side: { assessmentId: assessment.id, testKey: base.testKey, side } },
        create: { ...base, side, value: n, method: item.kind === "count" ? "Counted at home" : base.method },
        update: { value: n, capturedAt: at },
      });
    }
  }
  if (!cap.done.includes(item.id)) cap.done.push(item.id);
  const retake = cap.retake ?? (await resolveRetake(client.id, mod.status, cap)).steps;
  cap.retake = retake.filter((r) => r !== item.id);
  cap.attempts = { ...(cap.attempts ?? {}), [item.id]: (cap.attempts?.[item.id] ?? 0) + 1 };
  const done = requiredDone(cap);
  const status = mod.status === "NOT_STARTED" ? "IN_PROGRESS" : mod.status;
  await prisma.planModule.update({
    where: { id: mod.id },
    data: {
      status,
      progressDone: done,
      progressTotal: CAPTURE_REQUIRED.length,
      extraLine: status === "IN_PROGRESS" ? `${done} of ${CAPTURE_REQUIRED.length} items done. Everything so far is saved.` : mod.extraLine,
      data: { ...((mod.data as object) ?? {}), capture: cap } as Prisma.InputJsonValue,
    },
  });
  revalidatePath("/assessment/plan");
  return { done };
}

/** SUBMIT 12 OF 12 → after uploads: module Submitted, review clock starts, practitioner told. */
export async function submitCapture(): Promise<Result> {
  const { client } = await requireClient();
  const mod = await captureModule(client.id);
  if (mod.status === "SUBMITTED" || mod.status === "DONE") return { redirect: "/assessment/plan" };
  const cap = readCapture(mod.data);
  cap.retake = cap.retake ?? (await resolveRetake(client.id, mod.status, cap)).steps;
  const missing = CAPTURE_REQUIRED.filter((id) => !cap.done.includes(id) || (cap.retake ?? []).includes(id));
  if (missing.length) return { error: `${missing.length} still to do. Tap a grey square above.` };
  const at = now();
  const pname = (await prisma.clientProfile.findUnique({ where: { id: client.id }, include: { primaryPractitioner: { include: { user: true } } } }))?.primaryPractitioner?.user.name ?? "Jayraj";
  const wasRetake = mod.status === "MORE_NEEDED";
  await prisma.planModule.update({
    where: { id: mod.id },
    data: { status: "SUBMITTED", submittedAt: at, progressDone: CAPTURE_REQUIRED.length, progressTotal: CAPTURE_REQUIRED.length, extraLine: `Submitted ${dayLabel(at)}. ${pname} is reviewing it.`, data: { ...((mod.data as object) ?? {}), capture: { ...cap, retake: undefined } } as Prisma.InputJsonValue },
  });
  const assessment = await ensureBaselineAssessment(client.id);
  await prisma.assessment.update({ where: { id: assessment.id }, data: { submittedAt: at } });
  await prisma.retakeRequest.updateMany({ where: { clientId: client.id, resolvedAt: null }, data: { resolvedAt: at } });
  await prisma.mediaAsset.updateMany({ where: { clientId: client.id, moduleKey: "capture", supersededById: null, status: "UPLOADED" }, data: { status: "NEEDS_REVIEW" } });
  if (["PURCHASED", "PROFILE_REQUIRED", "INTAKE_REQUIRED", "INTAKE_COMPLETE", "BOOKING_REQUIRED"].includes(client.assessmentStatus)) {
    await prisma.clientProfile.update({ where: { id: client.id }, data: { assessmentStatus: "PRACTITIONER_REVIEW" } });
  }
  const who = `${client.firstName} ${client.lastName}`;
  await notifyPractitioner(
    client.id,
    wasRetake ? "retake_sent" : "capture_submitted",
    wasRetake ? `${who} sent the retake` : `${who} submitted their Online Capture`,
    wasRetake ? `${who} sent the photos you asked for. Review time restarts now.` : `${who} submitted their Online Capture: photos, movement videos and self tests. Review within XX hours.`,
  );
  await logActivity(client.id, who, wasRetake ? "Sent retake photos" : "Online Capture submitted");
  revalidatePath("/assessment/plan");
  revalidatePath("/");
  return { toast: wasRetake ? `Sent. ${pname}’s review time restarts now.` : undefined };
}

/** TURN ON PHOTO CONSENT (consent off state). */
export async function turnOnPhotoConsent(): Promise<Result> {
  const { client } = await requireClient();
  const at = now();
  for (const kind of ["PHOTOS_VIDEOS", "ASSESSMENT_MEDIA"] as const) {
    await prisma.consent.upsert({ where: { clientId_kind: { clientId: client.id, kind } }, create: { clientId: client.id, kind, granted: true, source: "account", changedAt: at }, update: { granted: true, source: "account", changedAt: at } });
  }
  await logActivity(client.id, `${client.firstName} ${client.lastName}`, "Turned on photo consent");
  revalidatePath("/assessment/steps/capture");
  return { toast: "Photo consent is on." };
}
