import { Block, Grid, PageHead, type Row } from "@/components/staff/Page";
import { ActionButton } from "@/components/ui/ActionButton";
import { linkBtn } from "@/components/staff/admin/styles";
import { clientScope, requireStaff } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { can } from "@/lib/permissions";
import { dayLabel } from "@/lib/format";
import { hoursLeft, staffName } from "@/server/staff/common";
import { generateExport } from "@/server/staff/actions/admin";

export const metadata = { title: "Reports" };

/** 12 Reports: drafts, pending approval (APPROVE → head coach review), released, export packs for clients not renewing. */
export default async function Reports() {
  const ctx = await requireStaff({ section: "reports" });
  const scope = clientScope(ctx);
  const reports = await prisma.report.findMany({ where: { client: scope }, include: { client: true, author: { include: { user: true } } }, orderBy: [{ releasedAt: "desc" }, { createdAt: "desc" }] });
  const name = (r: (typeof reports)[number]) => `${r.client.firstName} ${r.client.lastName}`;
  const approve = can(ctx.role, "reports.approve");

  const drafts: Row[] = reports
    .filter((r) => r.status === "DRAFT" || r.status === "RETURNED")
    .map((r) => ({ key: r.id, cells: [{ v: name(r), sans: true, b: true }, `${staffName(r.author)} · ${r.status === "RETURNED" ? "returned" : "started"}${r.dueAt ? ` · ${hoursLeft(r.dueAt)}` : ""}`] }));
  const pending: Row[] = reports
    .filter((r) => r.status === "PENDING_APPROVAL")
    .map((r) => ({ key: r.id, href: approve ? `/staff/review/${r.id}` : undefined, cells: [{ v: name(r), sans: true, b: true }, approve ? { v: "APPROVE →", link: true } : { v: `Waiting · ${staffName(r.author)}`, muted: true }] }));
  const released: Row[] = reports.filter((r) => r.status === "RELEASED").map((r) => ({ key: r.id, cells: [{ v: name(r), sans: true, b: true }, r.releasedAt ? dayLabel(r.releasedAt) : "·"] }));

  // Not renewing: declined renewal, or plan ended / grace period.
  const leaving = await prisma.clientProfile.findMany({
    where: { AND: [scope, { OR: [{ trainingPlans: { some: { renewalDecision: "declined" } } }, { stage: { in: ["PLAN_ENDED", "GRACE"] } }] }] },
    orderBy: { firstName: "asc" },
  });
  const packs = await prisma.exportPackage.findMany({ where: { clientId: { in: leaving.map((c) => c.id) } }, orderBy: { createdAt: "desc" } });
  const exports: Row[] = leaving.map((c) => {
    const p = packs.find((x) => x.clientId === c.id);
    return {
      key: c.id,
      cells: [
        { v: `${c.firstName} ${c.lastName}`, sans: true, b: true },
        p ? (
          <span key="p" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span>{p.status === "ready" ? `Ready · ${p.fileCount ?? 0} files · ${dayLabel(p.preparedAt ?? p.createdAt)}` : p.status === "expired" ? "Expired" : "Generating"}</span>
            <ActionButton action={generateExport.bind(null, c.id)} style={linkBtn}>
              AGAIN →
            </ActionButton>
          </span>
        ) : (
          <ActionButton key="g" action={generateExport.bind(null, c.id)} style={linkBtn}>
            GENERATE →
          </ActionButton>
        ),
      ],
    };
  });

  return (
    <>
      <PageHead kicker="Drafts, approval and release" title="Reports" />
      <Grid variant="three">
        <Block title="Drafts" cols="1fr 1fr" rows={drafts} empty="No drafts." />
        <Block title="Pending approval" cols="1fr 1fr" rows={pending} empty="Clear. Nothing waiting." />
        <Block title="Released" cols="1fr 1fr" rows={released} empty="Nothing released yet." />
        <Block title="Export packs · not renewing" cols="1fr 1fr" rows={exports} empty="Everyone is renewing." />
      </Grid>
    </>
  );
}
