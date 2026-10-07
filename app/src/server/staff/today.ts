import "server-only";
import type { StaffRole } from "@prisma/client";
import { prisma } from "@/server/db";
import { clientScope } from "@/server/auth/guards";
import { now } from "@/lib/clock";
import { dayLabel, timeLabel } from "@/lib/format";
import { deriveClient, hoursLeft, istDay, liveModules, loadClients, planShort, REVIEW_SLA_H, reviewed, SESSION_SHORT, staffName, type Ctx } from "./common";

export type WCell = { v: string; sans?: boolean; b?: boolean; chip?: boolean; flag?: boolean; link?: boolean };
export type WRow = { key: string; cells: WCell[]; href?: string; nudge?: { clientId: string; first: string } };
export type Widget = { key: string; title: string; rows: WRow[] };

/** Which roles see which widget (founder sees all). Mirrors the prototype's `has()` filter. */
const WHO: Record<string, StaffRole[]> = {
  review: ["HOD", "PRACTITIONER"],
  more: ["HOD", "PRACTITIONER"],
  stalled: ["HOD", "PRACTITIONER", "OPS"],
  sessions: ["HOD", "PRACTITIONER", "OPS"],
  approval: ["HOD"],
  purchases: ["HOD", "OPS", "FINANCE"],
  expiring: ["HOD", "OPS", "FINANCE"],
  renewals: ["HOD", "OPS", "FINANCE"],
};
const has = (ctx: Ctx, k: string) => ctx.role === "FOUNDER" || WHO[k].includes(ctx.role);

export async function loadToday(ctx: Ctx): Promise<Widget[]> {
  const clients = await loadClients(ctx);
  const rows = clients.map((c) => ({ c, d: deriveClient(c) }));
  const file = (id: string) => `/staff/clients/${id}?tab=plan`;
  const W: Widget[] = [];

  if (has(ctx, "review")) {
    const r: (WRow & { at: number })[] = [];
    for (const { c } of rows) {
      const draft = c.reports.find((x) => x.status === "DRAFT" || x.status === "RETURNED");
      for (const m of liveModules(c)) {
        if (m.status !== "SUBMITTED" || reviewed(m) || m.type === "FORM") continue;
        const dueAt = (m.key === "capture" && draft?.dueAt) || (m.submittedAt ? new Date(m.submittedAt.getTime() + REVIEW_SLA_H * 3_600_000) : null);
        r.push({ key: m.id, at: dueAt?.getTime() ?? Infinity, href: "/staff/assessments", cells: [{ v: `${c.firstName} ${c.lastName}`, sans: true, b: true }, { v: m.name }, { v: dueAt ? hoursLeft(dueAt) : "·", chip: true, flag: true }] });
      }
    }
    W.push({ key: "review", title: "Needs review", rows: r.sort((a, b) => a.at - b.at) });
  }

  if (has(ctx, "more")) {
    const r: WRow[] = [];
    for (const { c } of rows) {
      for (const m of liveModules(c)) {
        if (m.status !== "MORE_NEEDED") continue;
        const asked = c.retakes.find((x) => !x.resolvedAt)?.createdAt ?? m.updatedAt;
        r.push({ key: m.id, href: file(c.id), cells: [{ v: `${c.firstName} ${c.lastName}`, sans: true, b: true }, { v: c.retakes.find((x) => !x.resolvedAt)?.step ?? m.name }, { v: `Asked ${dayLabel(asked)}` }] });
      }
    }
    W.push({ key: "more", title: "More needed · waiting on client", rows: r });
  }

  if (has(ctx, "stalled")) {
    const r: WRow[] = rows
      .filter(({ d }) => d.stalled)
      .sort((a, b) => b.d.stalled!.hours - a.d.stalled!.hours)
      .map(({ c, d }) => ({ key: c.id, nudge: { clientId: c.id, first: c.firstName }, cells: [{ v: d.name, sans: true, b: true }, { v: `${d.stalled!.progress} · ${d.stalled!.hours} h` }, { v: "NUDGE →", b: true, link: true }] }));
    W.push({ key: "stalled", title: "Stalled clients", rows: r });
  }

  if (has(ctx, "sessions")) {
    const { start, end } = istDay();
    const scopeIds = new Set(clients.map((c) => c.id));
    const sessions = await prisma.session.findMany({
      where: { startsAt: { gte: start, lt: end }, status: { notIn: ["CANCELLED", "RESCHEDULED"] }, ...(ctx.role === "PRACTITIONER" ? { coachId: ctx.staff.id } : {}) },
      include: { client: true, coach: { include: { user: true } }, centre: true },
      orderBy: { startsAt: "asc" },
    });
    const r = sessions
      .filter((s) => !s.clientId || scopeIds.has(s.clientId) || ctx.role === "OPS" || ctx.role === "FOUNDER")
      .map((s) => ({
        key: s.id,
        href: `/staff/schedule?session=${s.id}`,
        cells: [
          { v: timeLabel(s.startsAt), b: true },
          { v: s.client ? `${s.client.firstName} ${s.client.lastName} · ${SESSION_SHORT[s.type]}` : `${s.title}${s.booked != null && s.capacity ? ` · ${s.booked} of ${s.capacity}` : ""}`, sans: true },
          { v: `${s.coach ? staffName(s.coach) : "Group room"} · ${s.online ? "Online" : s.centre?.name ?? "·"}` },
        ],
      }));
    W.push({ key: "sessions", title: "Sessions today", rows: r });
  }

  if (has(ctx, "approval")) {
    const reports = await prisma.report.findMany({ where: { status: "PENDING_APPROVAL", client: clientScope(ctx) }, include: { client: true, author: { include: { user: true } } }, orderBy: { dueAt: "asc" } });
    W.push({
      key: "approval",
      title: "Reports waiting approval",
      rows: reports.map((r) => ({ key: r.id, href: `/staff/review/${r.id}`, cells: [{ v: `${r.client.firstName} ${r.client.lastName}`, sans: true, b: true }, { v: `Written by ${staffName(r.author)}` }, { v: r.dueAt ? hoursLeft(r.dueAt) : "·", chip: true, flag: true }] })),
    });
  }

  if (has(ctx, "purchases")) {
    const since = new Date(now().getTime() - 14 * 86_400_000);
    const orders = await prisma.order.findMany({ where: { placedAt: { gte: since, lte: now() }, client: clientScope(ctx) }, include: { client: true }, orderBy: { placedAt: "desc" }, take: 6 });
    W.push({ key: "purchases", title: "New purchases", rows: orders.map((o) => ({ key: o.id, cells: [{ v: `${o.client.firstName} ${o.client.lastName}`, sans: true, b: true }, { v: `${o.item} · ${o.amountLabel}` }, { v: o.number }] })) });
  }

  const plans = has(ctx, "expiring") || has(ctx, "renewals")
    ? await prisma.clientPlan.findMany({ where: { status: { in: ["ACTIVE", "EXPIRING_SOON"] }, endsAt: { gte: now() }, client: clientScope(ctx) }, include: { client: true, product: true }, orderBy: { endsAt: "asc" } })
    : [];
  const soon = (p: (typeof plans)[number]) => p.endsAt.getTime() - now().getTime() <= 7 * 86_400_000 || p.sessionsTotal - p.sessionsUsed <= 2;
  if (has(ctx, "expiring")) {
    W.push({
      key: "expiring",
      title: "Plans expiring",
      rows: plans.filter(soon).map((p) => ({ key: p.id, href: "/staff/billing", cells: [{ v: `${p.client.firstName} ${p.client.lastName}`, sans: true, b: true }, { v: `${planShort(p)} · ${p.sessionsTotal - p.sessionsUsed} left` }, { v: dayLabel(p.endsAt), chip: true, flag: true }] })),
    });
  }
  if (has(ctx, "renewals")) {
    const horizon = now().getTime() + 30 * 86_400_000;
    W.push({
      key: "renewals",
      title: "Renewals due",
      rows: plans.filter((p) => !soon(p) && p.endsAt.getTime() <= horizon && !p.renewalDecision).map((p) => ({ key: p.id, href: "/staff/billing", cells: [{ v: `${p.client.firstName} ${p.client.lastName}`, sans: true, b: true }, { v: `${planShort(p)} · ${p.sessionsTotal - p.sessionsUsed} left` }, { v: dayLabel(p.endsAt) }] })),
    });
  }
  return W;
}
