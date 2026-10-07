import Link from "next/link";
import { Button } from "@/components/ds";
import { Block, PageHead, type Row } from "@/components/staff/Page";
import { InviteDrawer, StaffDrawer } from "@/components/staff/admin/FormDrawers";
import { linkBtn } from "@/components/staff/admin/styles";
import { requireStaff } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { can } from "@/lib/permissions";
import { inviteStaff, updateStaff } from "@/server/staff/actions/admin";

export const metadata = { title: "Team" };

const lowerFirst = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);

/** 12 Team: staff list, roles, centres, availability and the coach profile clients see. */
export default async function Team({ searchParams }: { searchParams: Promise<{ invite?: string; edit?: string }> }) {
  const ctx = await requireStaff({ section: "team" });
  const sp = await searchParams;
  const manage = can(ctx.role, "staff.manage");
  const [staff, centres] = await Promise.all([
    prisma.staffProfile.findMany({ where: { user: { disabled: false } }, include: { user: true, centres: { include: { centre: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.centre.findMany({ orderBy: { name: "desc" } }),
  ]);
  const centreL = (s: (typeof staff)[number]) => {
    if (s.role === "OPS" || s.role === "FINANCE") return "All";
    if (!s.centres.length) return "·";
    return s.centres.length === 1 ? s.centres[0].centre.name : s.centres.map((c) => c.centre.name.split(" ")[0]).join(" · ");
  };
  const rows: Row[] = staff.map((s) => ({
    key: s.id,
    cells: [
      { v: s.user.name ?? s.user.email, sans: true, b: true },
      s.title,
      centreL(s),
      s.availability ?? "·",
      { v: s.shownToClients ? [s.yearsCoaching, s.credentials ? lowerFirst(s.credentials) : null].filter(Boolean).join(" · ") || "Shown" : "Not shown", sans: true },
      manage ? (
        <Link key="e" href={`/staff/team?edit=${s.id}`} scroll={false} style={linkBtn}>
          EDIT →
        </Link>
      ) : (
        ""
      ),
    ],
  }));
  const edit = sp.edit ? staff.find((s) => s.id === sp.edit) : undefined;
  return (
    <>
      <PageHead kicker={`${staff.length} staff · ${centres.length} centres`} title="Team" actions={manage ? <Button variant="outline" size="sm" href="/staff/team?invite=1">INVITE STAFF</Button> : undefined} />
      <Block title="Staff" head={["Name", "Role", "Centres", "Availability", "Shown to clients", ""]} cols="1fr 1.3fr 1.2fr 1.2fr 1.5fr .4fr" rows={rows} minW="820px" />
      {manage && sp.invite && <InviteDrawer centres={centres.map((c) => ({ id: c.id, name: c.name }))} closeHref="/staff/team" invite={inviteStaff} />}
      {manage && edit && (
        <StaffDrawer
          key={edit.id}
          name={edit.user.name ?? edit.user.email}
          initial={{ role: edit.role, title: edit.title, segment: edit.segment ?? "", availability: edit.availability ?? "", yearsCoaching: edit.yearsCoaching ?? "", credentials: edit.credentials ?? "", shownToClients: edit.shownToClients }}
          closeHref="/staff/team"
          save={updateStaff.bind(null, edit.id)}
        />
      )}
    </>
  );
}
