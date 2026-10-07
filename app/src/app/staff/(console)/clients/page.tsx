import Link from "next/link";
import { Filters, PageHead } from "@/components/staff/Page";
import { ClientsTable, SaveView, type ClientTableRow } from "@/components/staff/admin/ClientsTable";
import { ActionButton } from "@/components/ui/ActionButton";
import { outlineSmall } from "@/components/staff/admin/styles";
import { requireStaff } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { deriveClient, loadClients, practitioners, scopeLabel, type ClientRow } from "@/server/staff/common";
import { assignPractitioner, deleteView, nudgeClients, saveView } from "@/server/staff/actions/clients";

export const metadata = { title: "Clients" };

const VIEWS = ["All", "Mumbai area", "Needs action", "Training active"] as const;
const match = (v: string, r: ClientRow) => v === "All" || (v === "Mumbai area" && r.mumbai) || (v === "Needs action" && r.needsAction) || (v === "Training active" && r.plan !== "Assessment");

export default async function Clients({ searchParams }: { searchParams: Promise<{ view?: string; q?: string }> }) {
  const ctx = await requireStaff({ section: "clients" });
  const sp = await searchParams;
  const saved = await prisma.savedView.findMany({ where: { staffId: ctx.staff.id }, orderBy: { id: "asc" } });
  const sv = sp.view?.startsWith("sv_") ? saved.find((x) => `sv_${x.id}` === sp.view) : undefined;
  const svf = (sv?.filters ?? {}) as { view?: string; q?: string };
  const view = sv ? svf.view ?? "All" : VIEWS.find((v) => v === sp.view) ?? "All";
  const q = (sp.q ?? (sv ? svf.q : "") ?? "").trim();

  const all = (await loadClients(ctx)).map((c) => ({ c, r: deriveClient(c) }));
  const ql = q.toLowerCase();
  const list = all
    .filter(({ r }) => match(view, r))
    .filter(({ c, r }) => !ql || [r.name, c.user.email, c.code, c.city ?? "", c.pin ?? "", c.mobile ?? ""].some((x) => x.toLowerCase().includes(ql)))
    .sort((a, b) => Number(b.r.needsAction) - Number(a.r.needsAction) || a.r.name.localeCompare(b.r.name));

  const rows: ClientTableRow[] = list.map(({ c, r }) => ({
    id: c.id,
    href: `/staff/clients/${c.id}?tab=${c.plans.length && !r.training ? "plan" : "overview"}`,
    cells: { name: r.name, city: r.city, mumbai: r.mumbai ? "Yes" : "No", status: r.status, flag: r.statusFlag, modules: r.modules, practitioner: r.practitioner, next: r.nextAction, due: r.due, plan: r.plan, expiry: r.expiry },
  }));
  const qs = (v: string) => `/staff/clients?view=${encodeURIComponent(v)}${q && !sv ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <>
      <PageHead kicker={`${all.length} clients · ${scopeLabel(ctx)}`} title="Clients" actions={<SaveView view={view} q={q} save={saveView} />} />
      <Filters items={[...VIEWS.map((v) => ({ label: v, href: qs(v), on: !sv && v === view })), ...saved.map((x) => ({ label: x.name, href: `/staff/clients?view=sv_${x.id}`, on: sv?.id === x.id }))]} />
      {(q || sv) && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 11 }}>
          {q && <span>Search “{q}” · {rows.length} found</span>}
          {q && !sv && (
            <Link href={`/staff/clients?view=${encodeURIComponent(view)}`} style={outlineSmall}>
              Clear search
            </Link>
          )}
          {sv && (
            <ActionButton action={deleteView.bind(null, sv.id)} style={outlineSmall}>
              Remove view
            </ActionButton>
          )}
        </div>
      )}
      <ClientsTable rows={rows} practitioners={await practitioners()} canAssign={["FOUNDER", "HOD", "OPS"].includes(ctx.role)} assign={assignPractitioner} nudge={nudgeClients} />
    </>
  );
}
