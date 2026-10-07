import Link from "next/link";
import type { ModuleTemplate } from "@prisma/client";
import { Block, Filters, PageHead, type Row } from "@/components/staff/Page";
import { ActionButton } from "@/components/ui/ActionButton";
import { ModuleBuilder } from "./ModuleBuilder";
import { ToastButton } from "./ToastButton";
import { FIELD_TYPES } from "./planConstants";
import { chipBtn } from "./styles";
import { prisma } from "@/server/db";
import { can } from "@/lib/permissions";
import { TYPE_LABEL } from "@/lib/assessment/plan";
import type { StaffCtx } from "@/server/auth/guards";
import { addRule, addTemplateField, newModule, publishTemplate, removeRule, removeTemplateField, saveTemplateMeta } from "@/server/staff/actions/modules";

const AVAIL: Record<string, string> = { ONLINE: "Online", IN_PERSON: "In person", BOTH: "Online and in person" };
const TAG: Record<string, string> = { MEASURED: "Measured", OBSERVED: "Observed", SELF_REPORTED: "Self reported" };
const SYS: Record<string, string> = { MOVEMENT: "Movement", BREATH: "Breath", RECOVERY: "Recovery", PERFORMANCE: "Performance" };
type FieldDef = { label?: string; type?: string; meta?: string; map?: { system?: string; measure?: string; unit?: string; tag?: string; direction?: string; availability?: string } };

function mapLabel(f: FieldDef) {
  const m = f.map;
  if (!m) return "Not mapped";
  return [SYS[m.system ?? ""] ?? m.system, m.measure, m.unit, TAG[m.tag ?? ""], m.direction === "LOWER_BETTER" ? "lower is better" : m.direction === "HIGHER_BETTER" ? "higher is better" : null, m.availability ? (m.availability === "BOTH" ? "both" : m.availability === "IN_PERSON" ? "in person" : "online") : null].filter(Boolean).join(" · ");
}

type Fam = { family: string; versions: ModuleTemplate[]; pub?: ModuleTemplate; draft?: ModuleTemplate; head: ModuleTemplate; status: "Published" | "Draft" | "Archived" };

/** 12 Modules: library with status filter and the builder for the selected template. */
export async function ModulesView({ ctx, family, status }: { ctx: StaffCtx; family?: string; status?: string }) {
  const all = await prisma.moduleTemplate.findMany({ orderBy: [{ family: "asc" }, { version: "desc" }] });
  const fams = new Map<string, ModuleTemplate[]>();
  for (const t of all) fams.set(t.family, [...(fams.get(t.family) ?? []), t]);
  const list: Fam[] = [...fams.entries()].map(([fam, versions]) => {
    const pub = versions.find((v) => v.status === "PUBLISHED");
    const draft = versions.find((v) => v.status === "DRAFT");
    return { family: fam, versions, pub, draft, head: draft ?? pub ?? versions[0], status: pub ? "Published" : draft ? "Draft" : "Archived" };
  });
  // Library order: defaults first, then by usage, archived last.
  list.sort((a, b) => Number(b.head.isDefault) - Number(a.head.isDefault) || Number(a.status === "Archived") - Number(b.status === "Archived") || b.versions.reduce((n, v) => n + v.inUse, 0) - a.versions.reduce((n, v) => n + v.inUse, 0));

  const st = (["all", "published", "draft", "archived"] as const).find((x) => x === status) ?? "all";
  const shown = list.filter((f) => st === "all" || (st === "published" && f.pub) || (st === "draft" && f.draft) || (st === "archived" && f.status === "Archived"));
  const sel = list.find((f) => f.family === family) ?? list.find((f) => f.family === "gait") ?? list.find((f) => !f.head.isDefault) ?? list[0];
  const canEdit = can(ctx.role, "templates.edit");

  const rows: Row[] = shown.map((f) => ({
    key: f.family,
    href: `/staff/modules/${f.family}${st !== "all" ? `?status=${st}` : ""}`,
    bg: sel?.family === f.family ? "var(--mist)" : undefined,
    cells: [
      { v: f.head.name, sans: true, b: true },
      TYPE_LABEL[f.head.type],
      { v: f.status, chip: true, flag: f.status === "Draft" },
      f.pub && f.draft ? `v${f.pub.version} · v${f.draft.version} draft` : f.draft ? `v${f.draft.version} draft` : `v${f.head.version}`,
      String(f.versions.reduce((n, v) => n + v.inUse, 0)),
    ],
  }));

  const t = sel?.head;
  const pick = sel ? [sel, ...list.filter((f) => f.draft && f.family !== sel.family)].slice(0, 4) : [];
  const fields = ((t?.fields ?? []) as FieldDef[]).map((f) => ({ label: f.label ?? "Field", type: f.meta ?? FIELD_TYPES.find((x) => x[0] === f.type)?.[1] ?? f.type ?? "Field", map: mapLabel(f), tall: ["PHOTO", "VIDEO", "BODY_OUTLINE"].includes(f.type ?? "") }));
  const statusRow = !sel
    ? ""
    : sel.draft && sel.pub
      ? `Draft v${sel.draft.version} · v${sel.pub.version} is live`
      : sel.draft
        ? `Draft v${sel.draft.version} · not visible to anyone`
        : sel.pub
          ? `Published v${sel.pub.version} · editing creates v${sel.versions[0].version + 1}`
          : `Archived v${sel.head.version}`;
  const fam = sel?.family ?? "";

  return (
    <>
      <PageHead
        kicker={`Library · ${list.length} templates`}
        title="Modules"
        actions={
          canEdit ? (
            <>
              <ActionButton action={newModule} style={{ height: 40, padding: "0 14px", border: "2px solid var(--ink)", background: "transparent", fontFamily: "var(--font-display)", fontSize: 12, cursor: "pointer", color: "var(--ink)" }}>
                NEW MODULE
              </ActionButton>
              {sel && (
                <ActionButton action={publishTemplate.bind(null, fam)} style={{ height: 40, padding: "0 14px", border: 0, background: "var(--blue)", fontFamily: "var(--font-display)", fontSize: 12, cursor: "pointer", color: "#fff" }}>
                  {sel.draft ? `PUBLISH V${sel.draft.version}` : `PUBLISHED V${sel.pub?.version ?? sel.head.version}`}
                </ActionButton>
              )}
            </>
          ) : (
            <ToastButton msg="Ask a head of department to edit templates.">VIEW ONLY · PRACTITIONER</ToastButton>
          )
        }
      />
      <Filters items={(["all", "published", "draft", "archived"] as const).map((k) => ({ label: k[0].toUpperCase() + k.slice(1), href: `/staff/modules${family ? `/${family}` : ""}${k === "all" ? "" : `?status=${k}`}`, on: st === k }))} />
      {sel && t && (
        <>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {pick.map((p) => (
              <Link key={p.family} href={`/staff/modules/${p.family}`} style={{ ...chipBtn(p.family === sel.family, 30), fontSize: 10, padding: "0 10px", display: "inline-flex", alignItems: "center" }} aria-current={p.family === sel.family ? "true" : undefined}>
                {p.head.name}
              </Link>
            ))}
          </div>
          <ModuleBuilder
            key={`${t.id}-${t.version}`}
            metaRows={[
              ["Status", statusRow],
              ["Type", TYPE_LABEL[t.type]],
              ["Time", t.timeEstimate],
              ["Purpose", t.purpose],
              ["Instructions", t.instructions ?? "None"],
              ["Safety note", t.safetyNote ?? "None"],
              ["Availability", AVAIL[t.availability] + (t.type === "IN_PERSON" ? ` · ${t.replacesCapture ? "replaces" : "adds to"} Online Capture` : "")],
            ]}
            meta={{ name: t.name, purpose: t.purpose, type: t.type, timeEstimate: t.timeEstimate, instructions: t.instructions ?? "", safetyNote: t.safetyNote ?? "", availability: t.availability, replacesCapture: t.replacesCapture }}
            fields={fields}
            rules={((t.rules ?? []) as { text?: string }[]).map((r) => r.text ?? "").filter(Boolean)}
            ptype={`${TYPE_LABEL[t.type]} · ${t.timeEstimate}`}
            canEdit={canEdit && sel.status !== "Archived"}
            actions={{
              addField: addTemplateField.bind(null, fam),
              removeField: removeTemplateField.bind(null, fam),
              addRule: addRule.bind(null, fam),
              removeRule: removeRule.bind(null, fam),
              saveMeta: saveTemplateMeta.bind(null, fam),
            }}
          />
        </>
      )}
      <Block title="Library" head={["Name", "Type", "Status", "Version", "In use"]} cols="1.6fr 1.2fr .9fr .8fr .6fr" rows={rows} minW="620px" empty="No templates in this view." />
    </>
  );
}
