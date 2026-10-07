import "server-only";
import { prisma } from "@/server/db";
import { clientScope, type StaffCtx } from "@/server/auth/guards";
import { scopeOf } from "@/lib/permissions";
import { dayLabel } from "@/lib/format";
import { hoursLeft } from "@/server/staff/common";
import { progress, readEvaluation } from "@/config/evaluation";

export const canAssign = (ctx: Pick<StaffCtx, "role">) => scopeOf(ctx.role, "reports.approve") !== false;

const OPEN = ["DRAFT", "RETURNED", "PENDING_APPROVAL"] as const;

function stateOf(r: { status: string; evaluation: unknown }) {
  if (r.status === "PENDING_APPROVAL") return { label: "With head coach", tone: "ink" as const };
  if (r.status === "RETURNED") return { label: "Returned to coach", tone: "blue" as const };
  const p = progress(readEvaluation(r.evaluation));
  return p.done === 0 ? { label: "Not started", tone: "plain" as const } : { label: `In progress · ${p.done} of ${p.total}`, tone: "plain" as const };
}

/** Coaches an evaluation can be assigned to, with how many open evaluations each has. */
async function coaches() {
  const staff = await prisma.staffProfile.findMany({ where: { role: { in: ["PRACTITIONER", "HOD", "FOUNDER"] } }, include: { user: true, reportsAssigned: { where: { status: { in: [...OPEN] } }, select: { id: true } } } });
  const order = { PRACTITIONER: 0, HOD: 1, FOUNDER: 2 } as Record<string, number>;
  return staff
    .sort((a, b) => order[a.role] - order[b.role] || (a.user.name ?? "").localeCompare(b.user.name ?? ""))
    .map((s) => ({ id: s.id, name: s.user.name ?? s.user.email, title: s.title ?? "", open: s.reportsAssigned.length }));
}

/** Head of department board: ready to assign, waiting for approval, with coaches. */
export async function loadAssignBoard(ctx: StaffCtx) {
  const clients = await prisma.clientProfile.findMany({
    where: { ...clientScope(ctx), stage: { in: ["ONBOARDING", "ASSESSMENT_DAY", "REPORT"] } },
    include: {
      plans: { include: { modules: { where: { removed: false, type: "CAPTURE" } } } },
      reports: { orderBy: { createdAt: "desc" }, include: { assignedTo: { include: { user: true } }, author: { include: { user: true } } } },
      media: { where: { supersededById: null }, select: { id: true } },
    },
  });
  const ready: { clientId: string; name: string; city: string; submitted: string; uploads: number; at: number }[] = [];
  const approval: { reportId: string; clientId: string; name: string; coach: string; submitted: string; due: string; at: number }[] = [];
  const withCoaches: { reportId: string; clientId: string; name: string; coach: string; coachId: string | null; state: ReturnType<typeof stateOf>; due: string; at: number }[] = [];
  for (const c of clients) {
    const name = `${c.firstName} ${c.lastName}`;
    const open = c.reports.find((r) => (OPEN as readonly string[]).includes(r.status));
    const released = c.reports.some((r) => r.status === "RELEASED");
    if (open) {
      const coach = open.assignedTo?.user.name ?? open.author?.user.name ?? null;
      if (open.status === "PENDING_APPROVAL") approval.push({ reportId: open.id, clientId: c.id, name, coach: coach ?? "Coach", submitted: open.submittedAt ? dayLabel(open.submittedAt) : "", due: open.dueAt ? hoursLeft(open.dueAt) : "", at: open.submittedAt?.getTime() ?? 0 });
      else if (coach) withCoaches.push({ reportId: open.id, clientId: c.id, name, coach, coachId: open.assignedToId ?? open.authorId, state: stateOf(open), due: open.dueAt ? hoursLeft(open.dueAt) : "", at: open.dueAt?.getTime() ?? Infinity });
      else ready.push({ clientId: c.id, name, city: c.city ?? "", submitted: "", uploads: c.media.length, at: 0 });
      continue;
    }
    if (released) continue;
    const cap = c.plans.flatMap((p) => p.modules).find((m) => m.status === "SUBMITTED" || m.status === "DONE");
    if (cap) ready.push({ clientId: c.id, name, city: c.city ?? "", submitted: cap.submittedAt ? dayLabel(cap.submittedAt) : "", uploads: c.media.length, at: cap.submittedAt?.getTime() ?? 0 });
  }
  return {
    ready: ready.sort((a, b) => a.at - b.at),
    approval: approval.sort((a, b) => a.at - b.at),
    withCoaches: withCoaches.sort((a, b) => a.at - b.at),
    coaches: await coaches(),
  };
}
export type AssignBoard = Awaited<ReturnType<typeof loadAssignBoard>>;

/** A coach's own evaluations: to do (returned first), with the head coach, and recently released. */
export async function loadMyEvaluations(ctx: StaffCtx) {
  const reports = await prisma.report.findMany({
    where: { OR: [{ assignedToId: ctx.staff.id }, { assignedToId: null, authorId: ctx.staff.id }], status: { in: [...OPEN, "RELEASED"] } },
    include: { client: true, assignedTo: true, comments: { where: { action: "RETURNED" }, orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  const assignedBy = new Map((await prisma.staffProfile.findMany({ where: { id: { in: reports.map((r) => r.assignedById).filter((x): x is string => !!x) } }, include: { user: true } })).map((s) => [s.id, s.user.name ?? ""]));
  const row = (r: (typeof reports)[number]) => ({
    reportId: r.id,
    clientId: r.client.id,
    name: `${r.client.firstName} ${r.client.lastName}`,
    city: r.client.city ?? "",
    state: stateOf(r),
    progress: progress(readEvaluation(r.evaluation)),
    due: r.dueAt ? hoursLeft(r.dueAt) : "",
    assigned: r.assignedAt ? `Assigned ${dayLabel(r.assignedAt)}${r.assignedById && assignedBy.get(r.assignedById) ? " by " + assignedBy.get(r.assignedById) : ""}` : "",
    returned: r.comments[0]?.body ?? null,
    releasedAt: r.releasedAt ? dayLabel(r.releasedAt) : null,
    at: r.dueAt?.getTime() ?? Infinity,
  });
  const todo = reports.filter((r) => r.status === "DRAFT" || r.status === "RETURNED").map(row).sort((a, b) => (a.returned ? 0 : 1) - (b.returned ? 0 : 1) || a.at - b.at);
  const waiting = reports.filter((r) => r.status === "PENDING_APPROVAL").map(row);
  const done = reports.filter((r) => r.status === "RELEASED").slice(0, 5).map(row);
  return { todo, waiting, done };
}
export type MyEvaluations = Awaited<ReturnType<typeof loadMyEvaluations>>;
