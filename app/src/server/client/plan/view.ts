import "server-only";
import type { PlanModule, Session, Centre } from "@prisma/client";
import { prisma } from "@/server/db";
import { coverageRows } from "@/lib/assessment/plan";
import { dayLabel, timeLabel } from "@/lib/format";
import { isDoneish, nextStep, planProgress, recommendationEligible, type PlanMod } from "@/lib/assessment/next";

type SessionWithCentre = Session & { centre: Centre | null; coach: { user: { name: string | null } } | null };

/** The client's baseline plan (latest), created on demand elsewhere. */
export async function findBaselinePlan(clientId: string) {
  return prisma.assessmentPlan.findFirst({ where: { clientId, kind: "BASELINE" }, orderBy: { createdAt: "desc" } });
}

/** Client visible modules: never unsent drafts, removed modules or system steps. */
export async function clientModules(planId: string) {
  return prisma.planModule.findMany({ where: { planId, draft: false, removed: false, system: false }, orderBy: { order: "asc" } });
}

export function sessionLine(s: SessionWithCentre) {
  const coach = s.coach?.user.name ?? "your coach";
  const where = s.online ? "Live video" : s.centre?.name ?? "the centre";
  return `${dayLabel(s.startsAt)} · ${timeLabel(s.startsAt)} · ${where} · with ${coach}`;
}

async function moduleSessions(clientId: string, mods: PlanModule[]) {
  const ids = mods.map((m) => m.id);
  const rows = await prisma.session.findMany({
    where: { clientId, status: { in: ["SCHEDULED", "CONFIRMED", "DONE"] }, OR: [{ planModuleId: { in: ids } }, { type: { in: ["IN_PERSON_ASSESSMENT", "LIVE_VIDEO"] }, planModuleId: null }] },
    include: { centre: true, coach: { include: { user: { select: { name: true } } } } },
    orderBy: { startsAt: "asc" },
  });
  const byModule = new Map<string, SessionWithCentre>();
  for (const m of mods) {
    const own = rows.find((s) => s.planModuleId === m.id);
    const loose = rows.find((s) => !s.planModuleId && ((m.type === "IN_PERSON" && s.type === "IN_PERSON_ASSESSMENT") || (m.type === "LIVE_VIDEO" && s.type === "LIVE_VIDEO")));
    const s = own ?? loose;
    if (s) byModule.set(m.id, s);
  }
  return byModule;
}

/** Client visible status line per module (06.4 "extra" lines). */
function extraLine(m: PlanModule, practitioner: string, session?: SessionWithCentre) {
  if (m.status === "WAITING_FOR_PAYMENT") return "Your slot is not held until payment is done.";
  if (m.status === "BOOKED" && session) return sessionLine(session);
  if (m.key === "capture" && m.status === "IN_PROGRESS" && m.progressTotal) return `${m.progressDone ?? 0} of ${m.progressTotal} items done. Everything so far is saved.`;
  if (m.key === "capture" && m.status === "SUBMITTED" && m.submittedAt) return `Submitted ${dayLabel(m.submittedAt)}. ${practitioner} is reviewing it.`;
  if (m.type === "IN_PERSON" && m.status === "NOT_STARTED" && m.paid && (m.data as { paidAt?: string })?.paidAt) return "Paid. Pick a centre and a time.";
  if (isDoneish(m.status) && m.key !== "capture") return null;
  return m.extraLine ?? null;
}

export function toPlanMod(m: PlanModule, practitioner: string, session?: SessionWithCentre): PlanMod {
  return {
    id: m.id,
    key: m.key,
    name: m.name,
    purpose: m.purpose,
    shortLine: m.shortLine,
    type: m.type,
    status: m.status,
    timeEstimate: m.timeEstimate ?? "XX min",
    dueLabel: m.dueLabel,
    note: m.note,
    addedBy: m.addedBy,
    addedByName: m.addedByName,
    priceLabel: m.priceLabel,
    paid: m.paid,
    required: m.required,
    extra: extraLine(m, practitioner, session),
    coverage: m.coverage,
    paymentUrl: ((m.data as Record<string, unknown> | null)?.paymentUrl as string | undefined) ?? null,
    sessionId: session?.id ?? null,
  };
}

/** Everything the 06 client screens need, computed server side. */
export async function getClientPlanView(clientId: string) {
  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    include: { user: true, primaryPractitioner: { include: { user: true } } },
  });
  if (!client) return null;
  const practitioner = client.primaryPractitioner?.user.name ?? "Jayraj";
  const headCoach = (await prisma.staffProfile.findFirst({ where: { role: "HOD" }, include: { user: true }, orderBy: { createdAt: "asc" } }))?.user.name ?? "your head coach";
  const plan = await findBaselinePlan(clientId);
  const raw = plan ? await clientModules(plan.id) : [];
  const sessions = await moduleSessions(clientId, raw);
  const mods = raw.map((m) => toPlanMod(m, practitioner, sessions.get(m.id)));
  const progress = planProgress(mods);
  const coverage = coverageRows(raw.map((m) => ({ status: m.status, coverage: m.coverage })));
  const dismissed = client.recommendation === "DISMISSED" && client.inMumbaiArea && !mods.some((m) => m.type === "IN_PERSON");

  const ipMod = raw.find((m) => m.type === "IN_PERSON" && m.status === "BOOKED");
  const ipSession = ipMod ? sessions.get(ipMod.id) : undefined;
  const booking = ipSession
    ? {
        title: `Your in person session, ${dayLabel(ipSession.startsAt)}.`,
        line: `${timeLabel(ipSession.startsAt)} at ${ipSession.centre?.name ?? "the centre"} with ${ipSession.coach?.user.name ?? practitioner}. Arrive 10 minutes early.`,
        href: "/assessment/in-person?step=booked",
      }
    : null;
  const next = nextStep(mods, { practitioner, dismissed, booking });

  return {
    client: {
      id: client.id,
      first: client.firstName,
      full: `${client.firstName} ${client.lastName}`,
      city: client.city ?? "",
      pin: client.pin ?? "",
      inMumbaiArea: client.inMumbaiArea,
      recommendation: client.recommendation,
      recommendationNote: client.recommendationNote,
      recommendationAt: client.recommendationAt,
      intakeDone: !!client.intakeCompletedAt,
    },
    practitioner,
    headCoach,
    planKind: plan?.kind ?? "BASELINE",
    mods,
    progress,
    coverage,
    next,
    dismissed,
    eligible: recommendationEligible({ inMumbaiArea: client.inMumbaiArea, recommendation: client.recommendation, mods }),
  };
}

export type ClientPlanView = NonNullable<Awaited<ReturnType<typeof getClientPlanView>>>;
