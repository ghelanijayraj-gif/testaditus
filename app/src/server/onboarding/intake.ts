import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { GROUP_NAMES } from "@/components/shared/bodyGeometry";
import { INTAKE_SECTIONS, SECTION_COUNT, safetyItemsFor, treatmentLabel, type IntakeAnswers } from "./intakeDefs";

export type InjuryView = {
  id: string;
  description: string;
  occurredOn: string;
  side: "Left" | "Right" | "Both";
  treatments: string[];
  doc: { name: string } | null;
};

export type IntakeData = Awaited<ReturnType<typeof loadIntake>>;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2023-03" → "Mar 2023" */
export const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return y && m ? `${MONTHS[m - 1]} ${y}` : ym;
};

/** "R:knee" → "Right knee", "C:lowback" → "Lower back" (same rule as BodyMap's groupLabel). */
export function regionLabel(k: string) {
  const [side, g] = k.split(":");
  const name = GROUP_NAMES[g] ?? g;
  return (side === "R" ? "Right " : side === "L" ? "Left " : "") + (side === "C" ? name : name.toLowerCase());
}

export const firstName = (name?: string | null) => (name ?? "").trim().split(/\s+/)[0] || "";

/** Does this client's plan include cold exposure (plunge)? Adds the two cold safety items. */
export async function hasColdExposure(clientId: string) {
  const [a, m] = await Promise.all([
    prisma.assessment.count({ where: { clientId, includesCold: true } }),
    prisma.planModule.count({ where: { plan: { clientId }, removed: false, draft: false, OR: [{ name: { contains: "plunge", mode: "insensitive" } }, { name: { contains: "cold", mode: "insensitive" } }] } }),
  ]);
  return a + m > 0;
}

/** The plan module for this intake: the latest plan that has one. */
export async function intakeModule(clientId: string) {
  return prisma.planModule.findFirst({ where: { key: "intake", plan: { clientId } }, orderBy: { plan: { createdAt: "desc" } }, include: { plan: true } });
}

export async function loadIntake(clientId: string) {
  const client = await prisma.clientProfile.findUniqueOrThrow({ where: { id: clientId }, include: { primaryPractitioner: { include: { user: true } } } });
  const [sections, concerns, injuries, failed, consents, cold, mod] = await Promise.all([
    prisma.intakeSection.findMany({ where: { clientId } }),
    prisma.bodyConcern.findMany({ where: { clientId }, orderBy: { id: "asc" } }),
    prisma.injury.findMany({ where: { clientId }, orderBy: { createdAt: "asc" } }),
    prisma.document.findFirst({ where: { clientId, status: "FAILED" }, orderBy: { createdAt: "desc" } }),
    prisma.consent.findMany({ where: { clientId, kind: { in: ["ASSESSMENT_AGREEMENT", "ASSESSMENT_MEDIA"] } } }),
    hasColdExposure(clientId),
    intakeModule(clientId),
  ]);
  const byKey = Object.fromEntries(sections.map((s) => [s.key, s]));
  const ans = (k: string) => (byKey[k]?.answers ?? {}) as IntakeAnswers;
  const docIds = injuries.map((i) => i.documentId).filter((x): x is string => !!x);
  const docs = docIds.length ? await prisma.document.findMany({ where: { id: { in: docIds } } }) : [];
  const sides = ans("injuries").sides ?? {};
  const plan = mod ? await prisma.planModule.findMany({ where: { planId: mod.planId, removed: false, draft: false }, orderBy: { order: "asc" } }) : [];
  const pract = firstName(client.primaryPractitioner?.user.name);
  const done = !!client.intakeCompletedAt;
  const nextModule = plan.find((m) => m.key !== "intake" && !["DONE", "SUBMITTED", "SKIPPED_BY_PRACTITIONER"].includes(m.status));

  return {
    first: client.firstName,
    pract,
    step: done ? 12 : Math.min(Math.max(client.intakeStep, 0), 11),
    done,
    answers: Object.fromEntries(INTAKE_SECTIONS.filter((s) => !s.kind).map((s) => [s.key, { groups: ans(s.key).groups ?? {}, text: ans(s.key).text ?? "" }])),
    skipped: sections.filter((s) => s.skipped).map((s) => s.key),
    concerns: concerns.map((c) => ({ region: c.region, intensity: c.intensity, when: c.when })),
    injuries: injuries.map(
      (i): InjuryView => ({
        id: i.id,
        description: i.description,
        occurredOn: i.occurredOn ?? "",
        side: (sides[i.id] as InjuryView["side"]) ?? (i.side === "LEFT" ? "Left" : i.side === "RIGHT" ? "Right" : "Both"),
        treatments: i.treatments,
        doc: docs.find((d) => d.id === i.documentId) ? { name: docs.find((d) => d.id === i.documentId)!.filename } : null,
      }),
    ),
    failedUpload: failed ? { name: failed.filename, pct: failed.failedAtPercent ?? 0 } : null,
    safety: { items: ans("safety").items ?? {}, notes: ans("safety").notes ?? {} },
    safetyItems: safetyItemsFor(cold).map((i) => ({ key: i.key, q: i.q })),
    agreed: !!consents.find((c) => c.kind === "ASSESSMENT_AGREEMENT")?.granted,
    photos: !!consents.find((c) => c.kind === "ASSESSMENT_MEDIA")?.granted,
    nextName: nextModule?.name ?? null,
    stages: [
      ...plan.map((m) => ({ t: m.name, d: m.timeEstimate ?? "XX min", done: m.key === "intake" ? done : ["DONE", "SUBMITTED"].includes(m.status) })),
      { t: "Practitioner review", d: pract ? `${pract} reviews everything` : "Your practitioner reviews everything", done: false },
      { t: "Your report", d: "Within XX hours of review", done: false },
    ],
  };
}

/** Summaries the staff Intake tab reads (concerns and injuries). */
export async function refreshSummaries(clientId: string) {
  const [concerns, injuries, sec] = await Promise.all([
    prisma.bodyConcern.findMany({ where: { clientId }, orderBy: { id: "asc" } }),
    prisma.injury.findMany({ where: { clientId }, orderBy: { createdAt: "asc" } }),
    prisma.intakeSection.findUnique({ where: { clientId_key: { clientId, key: "injuries" } } }),
  ]);
  const sides = ((sec?.answers ?? {}) as IntakeAnswers).sides ?? {};
  const cSummary = concerns.map((c) => [regionLabel(c.region), `${c.intensity} of 10`, c.when.join(", ")].filter(Boolean).join(" · ")).join("; ");
  const iSummary = injuries
    .filter((i) => i.description)
    .map((i) => [i.description, i.occurredOn ? monthLabel(i.occurredOn) : "", sides[i.id] ?? (i.side === "LEFT" ? "Left" : i.side === "RIGHT" ? "Right" : ""), i.treatments.map(treatmentLabel).join(", ")].filter(Boolean).join(" · "))
    .join("; ");
  await upsertAnswers(clientId, "concerns", { summary: cSummary });
  await upsertAnswers(clientId, "injuries", { summary: iSummary });
}

/** Merge into IntakeSection.answers (autosave). */
export async function upsertAnswers(clientId: string, key: string, patch: IntakeAnswers, extra: Partial<Prisma.IntakeSectionUncheckedCreateInput> = {}) {
  const prev = await prisma.intakeSection.findUnique({ where: { clientId_key: { clientId, key } } });
  const answers = { ...((prev?.answers as object) ?? {}), ...patch } as Prisma.InputJsonValue;
  return prisma.intakeSection.upsert({
    where: { clientId_key: { clientId, key } },
    create: { clientId, key, answers, ...extra },
    update: { answers, ...extra },
  });
}

/** Keeps the plan's Intake module in step: In progress with "n of 10 sections done", or Done. */
export async function syncIntakeModule(clientId: string) {
  const mod = await intakeModule(clientId);
  if (!mod) return;
  const client = await prisma.clientProfile.findUniqueOrThrow({ where: { id: clientId } });
  const keys = INTAKE_SECTIONS.map((s) => s.key);
  const n = await prisma.intakeSection.count({ where: { clientId, key: { in: keys }, OR: [{ completedAt: { not: null } }, { skipped: true }] } });
  if (client.intakeCompletedAt) {
    if (mod.status !== "DONE") await prisma.planModule.update({ where: { id: mod.id }, data: { status: "DONE", progressDone: SECTION_COUNT, progressTotal: SECTION_COUNT, submittedAt: client.intakeCompletedAt, extraLine: null } });
    return;
  }
  const started = n > 0 || client.intakeStep > 0;
  await prisma.planModule.update({
    where: { id: mod.id },
    data: {
      status: started ? "IN_PROGRESS" : mod.status,
      progressDone: n,
      progressTotal: SECTION_COUNT,
      progress: Math.round((n / SECTION_COUNT) * 100),
      extraLine: started ? `${n} of ${SECTION_COUNT} sections done. Everything so far is saved.` : mod.extraLine,
    },
  });
}

