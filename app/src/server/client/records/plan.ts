import "server-only";
import type { CoachRole } from "@prisma/client";
import { prisma } from "@/server/db";
import { dateLong, dateShort } from "@/components/client/records/fmt";
import { calendarDaysUntil, currentPlan, planStatus, planTitle, stageNum } from "./common";

const ROLE: Record<CoachRole, string> = { ASSESSMENT: "Assessment", BREATH: "Breath", PERSONAL_TRAINING: "Personal Training", GROUP_TRAINING: "Group Training" };

export async function getPlanView(clientId: string) {
  const client = await prisma.clientProfile.findUniqueOrThrow({ where: { id: clientId }, include: { preferredCentre: true, primaryPractitioner: { include: { user: true } } } });
  const stage = stageNum(client.stage);
  const { current, plans } = await currentPlan(clientId);

  // Baseline report (focus areas, recommended path).
  const report = await prisma.report.findFirst({
    where: { clientId, kind: "BASELINE", status: "RELEASED" },
    include: { findings: { orderBy: { order: "asc" } }, author: { include: { user: true } }, assessment: true },
    orderBy: { releasedAt: "desc" },
  });
  const practitioner = report?.author?.user.name ?? client.primaryPractitioner?.user.name ?? "Jayraj";

  // Choose your path (stage 4).
  const products = await prisma.product.findMany({ where: { slug: { in: ["pt-12", "pt-24", "group-24"] }, active: true } });
  const recGroup = report?.recommendedPath === "GROUP_TRAINING";
  const pathName = recGroup ? "Group Training" : "Personal Training";
  const choices = [
    { slug: "pt-12", kind: "Personal Training", name: "12 sessions", meta: "1:1 with Shimyu · 45 days", rec: !recGroup },
    { slug: "pt-24", kind: "Personal Training", name: "24 sessions", meta: "1:1 with Shimyu · 90 days", rec: false },
    { slug: "group-24", kind: "Group Training", name: "24 classes", meta: "Mobility Lab and Fundamentals · 60 days", rec: recGroup },
  ].flatMap((c) => {
    const p = products.find((x) => x.slug === c.slug);
    if (!p) return [];
    const meta = p.kind === "PERSONAL_TRAINING" ? `1:1 with Shimyu · ${p.validityDays ?? 45} days` : `Mobility Lab and Fundamentals · ${p.validityDays ?? 60} days`;
    return [{ ...c, name: `${p.sessions ?? ""} ${p.kind === "GROUP_TRAINING" ? "classes" : "sessions"}`.trim(), meta, price: p.priceLabel }];
  });
  const chooseLine = `${practitioner} recommends ${pathName} first.${report?.pathReason ? " " + report.pathReason.trim().replace(/([^.])$/, "$1.") : ""} Pay on Shopify and your full dashboard unlocks.`;

  // Coaches shown to clients.
  const links = await prisma.clientCoach.findMany({ where: { clientId }, include: { staff: { include: { user: true, centres: { include: { centre: true } } } } } });
  const coachMap = new Map<string, { staff: (typeof links)[number]["staff"]; roles: CoachRole[] }>();
  for (const l of links) {
    if (!l.staff.shownToClients) continue;
    const e = coachMap.get(l.staffId) ?? { staff: l.staff, roles: [] };
    e.roles.push(l.role);
    coachMap.set(l.staffId, e);
  }
  const planCoachId = current?.coachId ?? null;
  const coachEntries = [...coachMap.values()].sort((a, b) => (a.staff.id === planCoachId ? -1 : b.staff.id === planCoachId ? 1 : 0));
  const coaches = await Promise.all(
    coachEntries.map(async ({ staff, roles }) => {
      const order: CoachRole[] = ["PERSONAL_TRAINING", "GROUP_TRAINING", "ASSESSMENT", "BREATH"];
      const role = [...new Set(roles)].sort((a, b) => order.indexOf(a) - order.indexOf(b)).map((r) => ROLE[r]).join(" and ");
      const n = current ? await prisma.session.count({ where: { clientId, coachId: staff.id, clientPlanId: current.id, status: "DONE" } }) : 0;
      const centre = staff.centres.find((c) => c.centreId === client.preferredCentreId)?.centre.name ?? staff.centres[0]?.centre.name ?? client.preferredCentre?.name ?? "";
      const work = roles.includes("ASSESSMENT") ? ["Baseline", "reassessment", ...(roles.includes("BREATH") ? ["breath sessions"] : [])].join(", ") : null;
      const meta = [centre, n > 0 || !work ? `${n} ${n === 1 ? "session" : "sessions"} with you on this plan` : work].filter(Boolean).join(" · ");
      const creds = [staff.credentials ?? "Certification placeholder", staff.specialities ? `Speciality: ${staff.specialities}` : null, staff.yearsCoaching ? `${staff.yearsCoaching} coaching` : null].filter(Boolean).join(" · ");
      const name = staff.user.name ?? "Coach";
      return { id: staff.id, name, role, creds, meta, photo: staff.photoUrl, firstName: name.split(" ")[0] };
    }),
  );
  const planCoach = coaches.find((c) => c.id === planCoachId) ?? coaches[0] ?? null;

  // Active plan card.
  let planCard = null;
  if (current) {
    const status = planStatus(current);
    const coachName = planCoach?.name ?? "Shimyu";
    const daysLeft = Math.max(0, calendarDaysUntil(current.endsAt));
    planCard = {
      id: current.id,
      title: planTitle(current),
      productName: current.product.name,
      productSlug: current.product.slug,
      coachLine: [`Coach ${coachName}`, client.preferredCentre?.name].filter(Boolean).join(" · "),
      status,
      used: current.sessionsUsed,
      total: current.sessionsTotal,
      facts: [
        ["Used", String(current.sessionsUsed)],
        ["Left", String(Math.max(0, current.sessionsTotal - current.sessionsUsed))],
        ["Started", dateShort(current.startsAt)],
        ["Ends", dateShort(current.endsAt)],
        ["Days left", String(status === "Expired" || status === "Completed" ? 0 : daysLeft)],
      ] as [string, string][],
      rule: `Your plan ends on ${dateShort(current.endsAt)} or after ${current.sessionsTotal} ${current.product.kind === "GROUP_TRAINING" ? "classes" : "sessions"}, whichever comes first.`,
      summary: [
        ["Goal", current.goal],
        ["Current phase", current.currentPhase],
        ["Sessions per week", current.perWeek],
      ].filter((r): r is [string, string] => !!r[1]),
      // Focus areas link to the report priorities (first four findings) and open that measure on Assessment.
      focus: (current.focusAreas.length ? current.focusAreas : (report?.findings ?? []).slice(0, 4).map((f) => f.title)).map((t, i) => {
        const key = report?.findings[i]?.measureKeys[0];
        return { n: String(i + 1).padStart(2, "0"), title: t, href: key ? `/assessment?m=${key}` : "/assessment" };
      }),
    };
  }

  // Past plans: other ClientPlans plus the released baseline assessment.
  const past: { t: string; d: string; s: string }[] = [];
  for (const p of plans) {
    if (p.id === current?.id) continue;
    past.push({ t: planTitle(p), d: `${dateShort(p.startsAt)} to ${dateLong(p.endsAt)}`, s: planStatus(p) });
  }
  if (report?.assessment) past.push({ t: "Movement Assessment", d: `Baseline · ${dateLong(report.assessment.date)}`, s: "Completed" });

  // Products: in use and suggestions.
  const holdings = await prisma.productHolding.findMany({ where: { clientId }, orderBy: { order: "asc" } });
  const inUse = [
    ...(current && planCard && (planCard.status === "Active" || planCard.status === "Expiring soon")
      ? [{ t: planCard.title, d: `${current.sessionsUsed} of ${current.sessionsTotal} used · ends ${dateShort(current.endsAt)}`, s: "Active" }]
      : []),
    ...holdings.map((h) => ({ t: h.title, d: h.detail, s: h.status })),
  ];
  const sugg = await prisma.productSuggestion.findMany({ where: { clientId, dismissed: false } });
  const details = await prisma.suggestionDetail.findMany({ where: { suggestionId: { in: sugg.map((s) => s.id) } } });
  const suggestions = sugg
    .map((s) => ({ s, d: details.find((x) => x.suggestionId === s.id) }))
    .filter((x) => !x.d?.dismissedAt)
    .sort((a, b) => (a.d?.order ?? 0) - (b.d?.order ?? 0))
    .slice(0, 2)
    .map(({ s, d }) => ({ id: s.id, title: s.name, why: s.reason, meta: d?.meta ?? "" }));

  const kicker = stage < 4 ? "Locked until your report" : stage === 4 ? "Your report is ready" : current ? `${current.product.name} · ${planCoach?.name ?? "Shimyu"}` : "My plan";
  return {
    stage,
    kicker,
    title: stage === 4 ? "Choose your path." : "My plan.",
    clientName: `${client.firstName} ${client.lastName}`,
    clientCode: client.code,
    choices,
    chooseLine,
    planCard,
    past,
    inUse,
    suggestions,
    coaches,
    planCoachName: planCoach?.firstName ?? "Shimyu",
  };
}

export type PlanViewData = Awaited<ReturnType<typeof getPlanView>>;
