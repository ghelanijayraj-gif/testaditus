import { Block, Filters, PageHead, type Row } from "@/components/staff/Page";
import { requireStaff } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { dayLabel } from "@/lib/format";
import { hoursLeft, hoursSince, liveModules, loadClients, REVIEW_SLA_H, reviewed, staffName, STALLED_H } from "@/server/staff/common";
import { STATUS_LABEL } from "@/lib/assessment/plan";
import { canAssign, loadAssignBoard, loadMyEvaluations } from "@/server/evaluation/assign";
import { AssignBoard } from "@/components/evaluation/AssignBoard";
import { MyEvaluations } from "@/components/evaluation/MyEvaluations";
import fl from "@/components/evaluation/flow.module.css";

export const metadata = { title: "Assessments" };

type Q = { key: string; client: string; module: string; status: string; flag: boolean; who: string; due: string; href?: string; group: string; sort: number };

const GROUPS = ["All", "Needs review", "Waiting on client", "Booked", "Reports"] as const;

/** 12 Assessments: queue of active assessments by module and status. OPEN goes to the consoles. */
export default async function Assessments({ searchParams }: { searchParams: Promise<{ status?: string; all?: string }> }) {
  const ctx = await requireStaff({ section: "assessments" });
  const sp = await searchParams;
  const st = sp.status;
  const f = GROUPS.find((g) => g === st) ?? "All";
  const clients = await loadClients(ctx, { stage: { in: ["ASSESSMENT_PURCHASED", "ONBOARDING", "ASSESSMENT_DAY", "REPORT"] } });
  const latestAssessment = await prisma.assessment.findMany({ where: { clientId: { in: clients.map((c) => c.id) } }, orderBy: { date: "desc" }, select: { id: true, clientId: true } });
  const Qs: Q[] = [];
  for (const c of clients) {
    const name = `${c.firstName} ${c.lastName}`;
    const who = staffName(c.primaryPractitioner);
    const draft = c.reports.find((r) => r.status === "DRAFT" || r.status === "RETURNED");
    for (const m of liveModules(c)) {
      const base = { key: m.id, client: name, module: m.name, who };
      if (m.status === "SUBMITTED" && !reviewed(m) && m.type !== "FORM") {
        const dueAt = (m.key === "capture" && draft?.dueAt) || (m.submittedAt ? new Date(m.submittedAt.getTime() + REVIEW_SLA_H * 3_600_000) : null);
        Qs.push({ ...base, status: "Ready to review", flag: true, due: dueAt ? hoursLeft(dueAt) : "·", href: m.type === "CAPTURE" ? `/staff/evaluate/${c.id}` : `/staff/clients/${c.id}?tab=${m.type === "UPLOAD" ? "documents" : "plan"}`, group: "Needs review", sort: dueAt?.getTime() ?? 0 });
      } else if (m.status === "MORE_NEEDED") {
        Qs.push({ ...base, status: "More needed", flag: true, due: "Waiting on client", group: "Waiting on client", sort: 2e13 });
      } else if (m.status === "IN_PROGRESS") {
        const h = hoursSince(m.updatedAt);
        Qs.push({ ...base, status: "In progress", flag: false, due: h >= STALLED_H ? `${h} h stalled` : m.dueAt ? dayLabel(m.dueAt) : "·", group: "Waiting on client", sort: 2e13 });
      } else if (m.status === "BOOKED") {
        const s = c.sessions.find((x) => x.planModuleId === m.id && x.status !== "CANCELLED" && x.status !== "RESCHEDULED");
        const aId = s?.assessmentId ?? latestAssessment.find((x) => x.clientId === c.id)?.id;
        const when = s?.startsAt ?? m.dueAt;
        Qs.push({ ...base, who: s ? staffName(s.coach) : who, status: "Booked", flag: false, due: when ? dayLabel(when) : "·", href: aId && (m.type === "IN_PERSON" || m.type === "LIVE_VIDEO") ? `/staff/practitioner/${aId}` : undefined, group: "Booked", sort: when?.getTime() ?? 3e13 });
      } else if ((m.status === "NOT_STARTED" || m.status === "WAITING_FOR_PAYMENT") && !m.locked) {
        Qs.push({ ...base, status: STATUS_LABEL[m.status], flag: m.status === "WAITING_FOR_PAYMENT", due: m.dueAt ? dayLabel(m.dueAt) : "·", group: "Waiting on client", sort: m.dueAt?.getTime() ?? 3e13 });
      }
    }
  }
  const reports = await prisma.report.findMany({ where: { status: { in: ["PENDING_APPROVAL", "DRAFT", "RETURNED"] }, clientId: { in: clients.map((c) => c.id) } }, include: { client: true, author: { include: { user: true } } } });
  for (const r of reports) {
    const pending = r.status === "PENDING_APPROVAL";
    Qs.push({ key: r.id, client: `${r.client.firstName} ${r.client.lastName}`, module: "Report", status: pending ? "Pending approval" : r.status === "RETURNED" ? "Returned" : "Draft", flag: pending, who: staffName(r.author), due: r.dueAt ? hoursLeft(r.dueAt) : "·", href: pending ? `/staff/review/${r.id}` : `/staff/evaluate/${r.clientId}`, group: "Reports", sort: r.dueAt?.getTime() ?? 0 });
  }
  const order = (g: string) => ["Needs review", "Reports", "Waiting on client", "Booked"].indexOf(g);
  const list = Qs.filter((q) => f === "All" || q.group === f).sort((a, b) => order(a.group) - order(b.group) || a.sort - b.sort);
  const rows: Row[] = list.map((q) => ({
    key: q.key,
    href: q.href,
    cells: [{ v: q.client, sans: true, b: true }, q.module, { v: q.status, chip: true, flag: q.flag }, q.who, q.due, q.href ? { v: "OPEN →", link: true } : ""],
  }));
  const table = (
    <>
      <Filters items={GROUPS.map((g) => ({ label: g, href: g === "All" ? "/staff/assessments?all=1" : `/staff/assessments?all=1&status=${encodeURIComponent(g)}`, on: g === f }))} />
      <Block title="Queue by module" head={["Client", "Module", "Status", "Practitioner", "Due", ""]} cols="1.2fr 1.3fr 1.1fr .9fr 1fr .8fr" rows={rows} minW="760px" empty="Clear. Nothing waiting." />
    </>
  );
  const head = canAssign(ctx);
  return (
    <>
      <PageHead kicker={head ? "Assign, then approve" : `${ctx.name} · your evaluations`} title={head ? "Assessments" : "My evaluations"} />
      {head ? <AssignBoard b={await loadAssignBoard(ctx)} /> : <MyEvaluations d={await loadMyEvaluations(ctx)} />}
      <details className={fl.more} open={sp.all === "1"} style={{ maxWidth: 980 }}>
        <summary>
          <span>Every step, by client · {Qs.length}</span>
        </summary>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>{table}</div>
      </details>
    </>
  );
}
