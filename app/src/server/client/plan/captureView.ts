import "server-only";
import { prisma } from "@/server/db";
import { emptyCapture, retakeSteps, type CaptureData } from "@/lib/assessment/capture";
import { ensureBaselinePlan, findModule } from "./common";

export const readCapture = (data: unknown): CaptureData => ({ ...emptyCapture(), ...(((data as { capture?: CaptureData })?.capture ?? {}) as CaptureData) });

/**
 * Steps a practitioner asked to redo. Stored on first read so progress through a retake
 * (left done, right still to do) survives reloads.
 */
export async function resolveRetake(clientId: string, status: string, cap: CaptureData) {
  if (status !== "MORE_NEEDED") return { steps: [] as string[], message: null as string | null, by: null as string | null };
  const req = await prisma.retakeRequest.findFirst({ where: { clientId, resolvedAt: null }, orderBy: { createdAt: "desc" } });
  let steps = cap.retake;
  if (!steps) {
    let fromMedia: string[] = [];
    if (req?.mediaId) {
      const m = await prisma.mediaAsset.findUnique({ where: { id: req.mediaId } });
      if (m) fromMedia = [m.view];
    }
    steps = fromMedia.length ? fromMedia : retakeSteps(req?.step || "side photos");
  }
  return { steps, message: req?.message ?? null, by: req?.requestedBy ?? null };
}

/** Wizard state for /assessment/steps/capture. */
export async function getCaptureView(clientId: string) {
  await ensureBaselinePlan(clientId);
  const mod = await findModule(clientId, "capture");
  if (!mod) return null;
  const client = await prisma.clientProfile.findUniqueOrThrow({ where: { id: clientId }, include: { primaryPractitioner: { include: { user: true } } } });
  const consents = await prisma.consent.findMany({ where: { clientId, kind: { in: ["PHOTOS_VIDEOS", "ASSESSMENT_MEDIA"] } } });
  const consentOff = !consents.length || consents.some((c) => !c.granted);
  const cap = readCapture(mod.data);
  const retake = await resolveRetake(clientId, mod.status, cap);
  const intake = await prisma.planModule.findFirst({ where: { planId: mod.planId, key: "intake" } });
  return {
    status: mod.status,
    practitioner: client.primaryPractitioner?.user.name ?? "Jayraj",
    consentOff,
    capture: { ...cap, retake: retake.steps },
    retakeMessage: retake.message ?? (mod.status === "MORE_NEEDED" ? mod.extraLine : null),
    intakeDone: intake?.status === "DONE" || !!client.intakeCompletedAt,
  };
}
