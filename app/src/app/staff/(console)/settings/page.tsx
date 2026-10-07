import Link from "next/link";
import { redirect } from "next/navigation";
import { Block, Filters, Grid, PageHead, type Row } from "@/components/staff/Page";
import { AreaForm, RetentionForm, TemplateDrawer } from "@/components/staff/admin/SettingsForms";
import { outlineSmall } from "@/components/staff/admin/styles";
import { requireStaff } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { PERMISSIONS } from "@/lib/permissions";
import { whenLabel } from "@/server/staff/common";
import { timeLabel } from "@/lib/format";
import { saveMumbaiArea, saveNotificationTemplate, saveRetention } from "@/server/staff/actions/admin";

export const metadata = { title: "Settings" };

const TABS = [
  ["area", "Mumbai area"],
  ["roles", "Roles and permissions"],
  ["templates", "Notifications"],
  ["consents", "Consents and retention"],
  ["audit", "Audit log"],
] as const;
const PER_PAGE = 50;
const ROLES = ["FOUNDER", "HOD", "PRACTITIONER", "OPS", "FINANCE"] as const;

type Area = { cities?: string[]; pinPrefixes?: string[]; radiusLabel?: string; source?: string; whenInside?: string; whenOutside?: string; replaces?: string };

/** 12 Settings (founder only). */
export default async function Settings({ searchParams }: { searchParams: Promise<{ tab?: string; edit?: string; page?: string }> }) {
  const ctx = await requireStaff({ section: "settings" });
  if (ctx.role !== "FOUNDER") redirect("/staff");
  const sp = await searchParams;
  const tab = TABS.find(([k]) => k === sp.tab)?.[0] ?? "area";
  let body: React.ReactNode = null;

  if (tab === "area") {
    const [area, centres, products] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "mumbai_area" } }).then((s) => (s?.value ?? {}) as Area),
      prisma.centre.findMany({ orderBy: { name: "desc" } }),
      prisma.product.findMany({ where: { kind: { in: ["ASSESSMENT", "IN_PERSON_SESSION", "PERSONAL_TRAINING", "GROUP_TRAINING"] } } }),
    ]);
    const kv = (rows: [string, string][]): Row[] => rows.map(([k, v]) => ({ key: k, cells: [{ v: k, b: true }, { v, sans: true }] }));
    body = (
      <Grid variant="one">
        <Block
          title="Around Mumbai"
          cols="1fr 1.6fr"
          rows={kv([
            ["Cities", (area.cities ?? []).join(" · ")],
            ["PIN prefixes", (area.pinPrefixes ?? []).join(" · ") || "·"],
            ["Radius", area.radiusLabel ?? "·"],
            ["Source", area.source ?? "City and PIN from account setup, else Shopify address"],
            ["When inside", area.whenInside ?? "Recommend In person session · paid · never forced"],
            ["When outside", area.whenOutside ?? "No in person option · “Visiting Mumbai? Message the team.”"],
            ["In person vs Online Capture", area.replaces ?? "Set per template: Adds to (default) or Replaces"],
          ])}
        >
          <AreaForm cities={area.cities ?? []} pins={area.pinPrefixes ?? []} radius={area.radiusLabel ?? ""} save={saveMumbaiArea} />
        </Block>
        <Block title="Centres" head={["Centre", "Area", "Rooms", "Hours"]} cols="1fr 1.4fr .5fr 1.4fr" rows={centres.map((c) => ({ key: c.id, cells: [{ v: c.name, sans: true, b: true }, c.area, String(c.rooms), c.hoursLabel ?? "·"] }))} minW="560px" />
        <Block title="Assessment products and prices" sub="Mirrored from Shopify · view only" head={["Product", "Shopify", "Price"]} cols="1.2fr 1.4fr .6fr" rows={products.map((p) => ({ key: p.id, cells: [{ v: p.name, sans: true, b: true }, p.shopifyProductId ?? "·", p.priceLabel] }))} minW="560px" />
      </Grid>
    );
  } else if (tab === "roles") {
    body = (
      <Block
        title="Roles and permissions · defaults to confirm"
        head={["Permission", "Founder", "Head of dept", "Practitioner", "Ops admin", "Finance"]}
        cols="2fr 1fr 1fr 1fr 1.2fr 1fr"
        minW="760px"
        rows={PERMISSIONS.map((p) => ({ key: p.key, cells: [{ v: p.label, sans: true, b: true }, ...ROLES.map((r) => ({ v: p.grid[r], b: p.grid[r] === "✓", color: p.grid[r] === "·" ? "var(--grey-400)" : "var(--ink)" }))] }))}
      />
    );
  } else if (tab === "templates") {
    const ts = await prisma.notificationTemplate.findMany({ orderBy: [{ name: "asc" }, { channel: "desc" }] });
    const edit = ts.find((t) => t.id === sp.edit);
    body = (
      <>
        <Block
          title="Notification templates"
          sub="Tap a template to edit it"
          head={["Name", "Channel", "Text"]}
          cols="1fr .6fr 2.4fr"
          minW="700px"
          rows={ts.map((t) => ({ key: t.id, href: `/staff/settings?tab=templates&edit=${t.id}`, cells: [{ v: t.name, b: true }, t.channel === "EMAIL" ? "Email" : t.channel === "WHATSAPP" ? "WhatsApp" : "Portal", { v: t.channel === "EMAIL" && t.subject ? `Subject: ${t.subject}` : t.body, sans: true }] }))}
        />
        {edit && <TemplateDrawer key={edit.id} title={`${edit.name} · ${edit.channel === "EMAIL" ? "Email" : "WhatsApp"}`} email={edit.channel === "EMAIL"} subject={edit.subject ?? ""} body={edit.body} closeHref="/staff/settings?tab=templates" save={saveNotificationTemplate.bind(null, edit.id)} />}
      </>
    );
  } else if (tab === "consents") {
    const r = ((await prisma.setting.findUnique({ where: { key: "retention" } }))?.value ?? []) as [string, string][];
    body = (
      <Block title="Consents and retention" cols="1fr 1.6fr" rows={r.map(([k, v]) => ({ key: k, cells: [{ v: k, b: true }, { v, sans: true }] }))}>
        <RetentionForm rows={r} save={saveRetention} />
      </Block>
    );
  } else {
    const page = Math.max(1, Number(sp.page) || 1);
    const [total, rows] = await Promise.all([prisma.auditLog.count(), prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE })]);
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));
    body = (
      <>
        <Block title="Audit log" count={`${total}`} head={["When", "Who", "What"]} cols=".8fr .8fr 2.4fr" minW="560px" rows={rows.map((r) => ({ key: r.id, cells: [whenLabel(r.createdAt) === timeLabel(r.createdAt) ? timeLabel(r.createdAt) : `${whenLabel(r.createdAt)} · ${timeLabel(r.createdAt)}`, { v: r.actorName, b: true }, { v: r.detail, sans: true }] }))} empty="Nothing logged yet." />
        {pages > 1 && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11 }}>
            {page > 1 && (
              <Link href={`/staff/settings?tab=audit&page=${page - 1}`} style={outlineSmall}>
                ← Newer
              </Link>
            )}
            <span>
              Page {page} of {pages}
            </span>
            {page < pages && (
              <Link href={`/staff/settings?tab=audit&page=${page + 1}`} style={outlineSmall}>
                Older →
              </Link>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <PageHead kicker="Founder only" title="Settings" />
      <Filters items={TABS.map(([k, l]) => ({ label: l, href: `/staff/settings?tab=${k}`, on: k === tab }))} />
      {body}
    </>
  );
}
