import "server-only";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";
import { dayLabel } from "@/lib/format";
import { STATUS_LABEL, TYPE_LABEL } from "@/lib/assessment/plan";
import { OPS_TYPES, QUICK, type ModuleData } from "@/components/staff/admin/planConstants";
import type { Ctx } from "./common";

export type EdRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  tag: string;
  bg: string;
  locked: boolean;
  required: boolean;
  paid: boolean;
  priceLabel: string;
  paymentUrl: string | null;
  isIP: boolean;
  replaces: boolean;
  due: string;
  dueISO: string;
  note: string;
  opsLocked: boolean;
};

export type EdView = {
  planId: string;
  first: string;
  staffName: string;
  ops: boolean;
  rows: EdRow[];
  quick: { k: string; label: string; off: boolean }[];
  lib: { family: string; name: string; type: string }[];
  diff: { kind: string; name: string; line: string }[];
  draftL: string;
  hist: { v: string; what: string; who: string }[];
};

const isoDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

export async function loadPlanEditor(ctx: Ctx, clientId: string): Promise<EdView | null> {
  const plan = await prisma.assessmentPlan.findFirst({ where: { clientId }, orderBy: { createdAt: "desc" }, include: { modules: { where: { removed: false }, orderBy: { order: "asc" } }, versions: { orderBy: { version: "desc" } }, client: true } });
  if (!plan) return null;
  const ops = ctx.role === "OPS";
  const opsOk = (t: string) => (OPS_TYPES as readonly string[]).includes(t);

  const eff = plan.modules.map((m) => {
    const d = (m.data as ModuleData) ?? {};
    const p = d.pending ?? {};
    const dueAt = p.dueAt !== undefined ? (p.dueAt ? new Date(p.dueAt) : null) : m.dueAt;
    return {
      m,
      d,
      remove: !!p.remove,
      required: p.required ?? m.required,
      paid: p.paid ?? m.paid,
      priceLabel: (p.paid !== undefined ? p.priceLabel : m.priceLabel) ?? "₹X,XXX",
      replaces: p.replacesCapture ?? m.replacesCapture,
      note: p.note !== undefined ? p.note : m.note,
      dueAt,
    };
  });

  const rows: EdRow[] = eff
    .filter((e) => !e.remove)
    .map(({ m, d, required, paid, priceLabel, replaces, note, dueAt }) => {
      const tag = m.draft ? "Draft · not sent" : m.changed ? "Changed" : m.addedBy === "RECOMMENDED" ? `Recommended${paid ? " · paid" : ""}` : m.addedBy !== "SYSTEM" ? `Added by ${m.addedByName ?? "staff"}` : "";
      const due = m.status === "BOOKED" && m.dueLabel && !m.changed ? m.dueLabel : dueAt ? `Due ${dayLabel(dueAt)}` : "No due date";
      return {
        id: m.id,
        name: m.name,
        type: TYPE_LABEL[m.type],
        status: m.draft ? "Draft" : STATUS_LABEL[m.status],
        tag,
        bg: m.draft || m.changed ? "var(--mist)" : "#fff",
        locked: m.locked,
        required,
        paid,
        priceLabel,
        paymentUrl: d.paymentUrl ?? null,
        isIP: m.type === "IN_PERSON",
        replaces,
        due,
        dueISO: dueAt ? isoDate(dueAt) : "",
        note: note ?? "",
        opsLocked: ops && !opsOk(m.type),
      };
    });

  const pendingMods = eff.filter((e) => e.m.draft || e.m.changed);
  const diff = pendingMods.map((e) => {
    const reqL = e.required ? "Required" : "Optional";
    if (e.remove) return { kind: "Removed", name: e.m.name, line: "No longer part of the plan." };
    if (e.m.draft) return { kind: `New step · Added for you by ${e.m.addedByName ?? "staff"}`, name: e.m.name, line: `${e.note || "No note"} · ${reqL}${e.paid ? ` · Paid ${e.priceLabel}` : " · Included"}` };
    return { kind: "Changed", name: e.m.name, line: `${reqL}${e.paid ? " · Paid" : " · Included"}${e.dueAt ? ` · Due ${dayLabel(e.dueAt)}` : ""}${e.note ? ` · “${e.note}”` : ""}` };
  });

  const libT = await prisma.moduleTemplate.findMany({ where: { status: "PUBLISHED", isDefault: false }, orderBy: [{ family: "asc" }, { version: "desc" }] });
  const seen = new Set<string>();
  const lib = libT
    .filter((t) => (seen.has(t.family) ? false : (seen.add(t.family), true)))
    .filter((t) => !ops || opsOk(t.type))
    .map((t) => ({ family: t.family, name: t.name, type: TYPE_LABEL[t.type] }));

  const today = dayLabel(now());
  return {
    planId: plan.id,
    first: plan.client.firstName,
    staffName: ctx.name,
    ops,
    rows,
    quick: QUICK.map((q) => ({ k: q.k, label: q.label, off: ops && q.clinical })),
    lib,
    diff,
    draftL: pendingMods.length ? `Draft v${plan.sentVersion + 1} · ${pendingMods.length} change${pendingMods.length > 1 ? "s" : ""}` : "Up to date",
    hist: plan.versions.map((v) => ({ v: `v${v.version}`, what: v.summary, who: `${dayLabel(v.createdAt) === today ? "Today" : dayLabel(v.createdAt)} · ${v.byName}` })),
  };
}
