import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ds";
import { Block, PageHead, type Row } from "@/components/staff/Page";
import { ActionButton } from "@/components/ui/ActionButton";
import { NoteForm } from "@/components/staff/admin/NoteForm";
import { PlanEditor } from "@/components/staff/admin/PlanEditor";
import a from "@/components/staff/admin/admin.module.css";
import { canOnClient, logAccess, requireStaff } from "@/server/auth/guards";
import { facts, loadClientFile, primeCentres, tabRows, visibleTabs, type TabKey } from "@/server/staff/file";
import { loadPlanEditor } from "@/server/staff/plan";
import { addNote, askAccess } from "@/server/staff/actions/clients";
import { addPlanModule, movePlanModule, removePlanModule, reorderPlan, sendPlan, updatePlanModule } from "@/server/staff/actions/plan";
import { HEALTH_TABS, ROLE_LABEL } from "@/lib/permissions";
import { now } from "@/lib/clock";
import { timeLabel } from "@/lib/format";

export async function generateMetadata() {
  return { title: "Client file" };
}

const LOGGED: TabKey[] = ["intake", "media", "measures", "documents", "health", "program"];

export default async function ClientFilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const ctx = await requireStaff({ section: "clients" });
  const { id } = await params;
  const sp = await searchParams;
  const [c] = await Promise.all([loadClientFile(ctx, id), primeCentres()]);
  if (!c) notFound();
  const TABS = visibleTabs();
  const tab: TabKey = (TABS.find(([k]) => k === sp.tab)?.[0] ?? "overview") as TabKey;
  const label = TABS.find(([k]) => k === tab)![1];
  const name = `${c.firstName} ${c.lastName}`;
  const { facts: F } = facts(c);

  // Permission per tab: health tabs need media/program access; billing needs billing access.
  const isHealth = (HEALTH_TABS as readonly string[]).includes(tab);
  let denied: null | { title: string; line: string } = null;
  if (isHealth && !(await canOnClient(ctx, tab === "program" ? "program.view" : "media.view", c.id)))
    denied = { title: "Health documents and media are private.", line: `Only the client, their practitioner and the head coach can open ${label.toLowerCase()}. You can still see status, schedule and billing.` };
  else if (tab === "billing" && !(await canOnClient(ctx, "billing.view", c.id))) denied = { title: "Billing is not part of your role.", line: "Ask a founder or finance for access." };
  if (denied) await logAccess(ctx, c.id, { type: "tab", name: label }, "DENIED");
  else if (LOGGED.includes(tab)) await logAccess(ctx, c.id, { type: "tab", name: label }, "VIEWED");

  const ed = tab === "plan" && !denied ? await loadPlanEditor(ctx, c.id) : null;
  const canPlan = tab === "plan" ? await canOnClient(ctx, "modules.add", c.id) : false;

  return (
    <>
      <PageHead kicker={`Client file · ${c.code}`} title={name} actions={<><Button variant="blue" size="sm" href={`/staff/evaluate/${c.id}`}>EVALUATE</Button><Button variant="outline" size="sm" href={`/staff/clients/${c.id}/preview?tab=${tab === "plan" ? "plan" : "home"}`}>PREVIEW AS CLIENT</Button></>} />
      <div className={a.fileHead}>
        <div className={a.facts}>
          {F.map(([k, v]) => (
            <span key={k} className={a.fact}>
              <span className={a.factK}>{k}</span>
              <b className={a.factV}>{v}</b>
            </span>
          ))}
        </div>
        <nav className={a.tabs} aria-label="Client file">
          {TABS.map(([k, l]) => (
            <Link key={k} href={`/staff/clients/${c.id}?tab=${k}`} prefetch={false} scroll={false} className={a.tab + (k === tab ? " " + a.tabOn : "")} aria-current={k === tab ? "page" : undefined}>
              {l}
            </Link>
          ))}
        </nav>
      </div>

      {denied ? (
        <div className={a.denied} role="alert">
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--blue)" }}>No access · {ROLE_LABEL[ctx.role]}</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 1, textTransform: "uppercase" }}>{denied.title}</span>
          <span style={{ font: "400 15px/1.5 var(--font-sans)", color: "var(--grey-700)" }}>{denied.line}</span>
          <span style={{ fontSize: 11, color: "var(--grey-600)" }}>This attempt was written to the audit log at {timeLabel(now())}.</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Button variant="outline" size="sm" href={`/staff/clients/${c.id}?tab=overview`}>
              BACK TO OVERVIEW
            </Button>
            <ActionButton action={askAccess.bind(null, c.id, label)} style={{ height: 40, padding: "0 14px", border: "2px solid var(--ink)", background: "transparent", fontFamily: "var(--font-display)", fontSize: 12, cursor: "pointer", color: "var(--ink)" }}>
              ASK JAYRAJ
            </ActionButton>
          </div>
        </div>
      ) : tab === "plan" ? (
        ed ? (
          canPlan ? (
            <PlanEditor clientId={c.id} ed={ed} actions={{ add: addPlanModule, move: movePlanModule, remove: removePlanModule, update: updatePlanModule, send: sendPlan, reorder: reorderPlan }} />
          ) : (
            <Block title="Assessment plan" cols="minmax(140px,.6fr) minmax(0,1.4fr)" rows={ed.rows.map((r) => ({ key: r.id, cells: [{ v: r.name, b: true }, { v: `${r.type} · ${r.status}${r.tag ? ` · ${r.tag}` : ""} · ${r.due}`, sans: true }] }))} />
          )
        ) : (
          <Block title="Assessment plan" rows={[]} empty="No assessment plan yet." />
        )
      ) : (
        <Block title={label + (tab === "notes" ? " · staff only" : "")} cols="minmax(140px,.6fr) minmax(0,1.4fr)" rows={tabRows(tab, c).map((r, i): Row => ({ key: String(i), href: r.href, cells: [{ v: r.k, b: true }, { v: r.v, sans: true }] }))} empty={tab === "notes" ? "No notes yet." : "Nothing here."}>
          {tab === "notes" && <NoteForm add={addNote.bind(null, c.id)} />}
        </Block>
      )}
    </>
  );
}
