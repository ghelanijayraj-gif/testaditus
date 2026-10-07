import { Block, PageHead, type Cell, type Row } from "@/components/staff/Page";
import { ActionButton } from "@/components/ui/ActionButton";
import { requireStaff } from "@/server/auth/guards";
import { loadToday, type Widget } from "@/server/staff/today";
import { scopeLabel } from "@/server/staff/common";
import { nudgeClients } from "@/server/staff/actions/clients";
import { dayLabel } from "@/lib/format";
import { now } from "@/lib/clock";
import { linkBtn } from "@/components/staff/admin/styles";
import { canAssign, loadAssignBoard, loadMyEvaluations } from "@/server/evaluation/assign";
import { MyEvaluations } from "@/components/evaluation/MyEvaluations";
import Link from "next/link";
import d from "./today.module.css";

export const metadata = { title: "Today" };

// Assessment queues on the left, new assessment purchases on the right. Training widgets (sessions, plans,
// renewals) are parked with the rest of the training console until FULL_CONSOLE=1.
const FULL = process.env.FULL_CONSOLE === "1";
const MAIN = ["review", "approval", "more", "stalled"];
const SIDE = FULL ? ["sessions", "purchases", "expiring", "renewals"] : ["purchases"];

const COLS: Record<string, string> = {
  sessions: "84px minmax(0,1.2fr) minmax(0,1fr)",
  purchases: "minmax(0,1fr) minmax(0,1.4fr) 110px",
  more: "minmax(0,1fr) minmax(0,1.2fr) 130px",
};
const DEFAULT_COLS = "minmax(0,1fr) minmax(0,1.2fr) 130px";

const STAT: Record<string, string> = {
  review: "Needs review",
  approval: "Reports to approve",
  more: "Waiting on client",
  stalled: "Stalled",
  sessions: "Sessions today",
  purchases: "New purchases",
  expiring: "Plans expiring",
  renewals: "Renewals due",
};

export default async function Today() {
  const ctx = await requireStaff({ section: "today" });
  // Coaches: just their own evaluations.
  if (ctx.role === "PRACTITIONER")
    return (
      <>
        <PageHead kicker={`${dayLabel(now())} · ${ctx.name}`} title="Today" />
        <MyEvaluations d={await loadMyEvaluations(ctx)} />
      </>
    );
  const widgets = await loadToday(ctx);
  const board = canAssign(ctx) ? await loadAssignBoard(ctx) : null;
  const byKey = new Map(widgets.map((w) => [w.key, w]));
  const pick = (keys: string[]) => keys.map((k) => byKey.get(k)).filter((w): w is Widget => !!w);
  const main = pick(MAIN);
  const side = pick(SIDE);
  const rest = FULL ? widgets.filter((w) => !MAIN.includes(w.key) && !SIDE.includes(w.key)) : [];
  const ordered = [...main, ...side, ...rest];

  return (
    <>
      <PageHead kicker={`${dayLabel(now())} · ${scopeLabel(ctx)}`} title="Today" />
      {board && (board.ready.length > 0 || board.approval.length > 0) && (
        <Link href="/staff/assessments" className={d.callout}>
          <span>
            {[board.ready.length ? `${board.ready.length} ready to assign` : null, board.approval.length ? `${board.approval.length} waiting for your approval` : null].filter(Boolean).join(" · ")}
          </span>
          <b>Open →</b>
        </Link>
      )}
      <nav className={d.stats} aria-label="Summary">
        {ordered.map((w) => (
          <a key={w.key} href={`#w-${w.key}`} className={d.stat + (w.rows.length === 0 ? " " + d.statZero : "")}>
            <span className={d.statN}>{w.rows.length}</span>
            <span className={d.statL}>{STAT[w.key] ?? w.title}</span>
          </a>
        ))}
      </nav>
      <div className={d.board}>
        <div className={d.col}>{[...main, ...rest].map(widget)}</div>
        <div className={d.col}>{side.map(widget)}</div>
      </div>
    </>
  );
}

function widget(w: Widget) {
  return (
    <div key={w.key} id={`w-${w.key}`} className={d.anchor}>
      <Block
        title={w.title}
        cols={COLS[w.key] ?? DEFAULT_COLS}
        empty="Clear. Nothing waiting."
        rows={w.rows.map(
          (r): Row => ({
            key: r.key,
            href: r.href,
            cells: r.cells.map((c, i): Cell => {
              if (r.nudge && i === r.cells.length - 1)
                return (
                  <ActionButton key="n" action={nudgeClients.bind(null, [r.nudge.clientId])} style={linkBtn} aria-label={`Nudge ${r.nudge.first}`}>
                    NUDGE →
                  </ActionButton>
                );
              return { v: c.v, sans: c.sans, b: c.b, chip: c.chip, flag: c.flag, link: c.link };
            }),
          }),
        )}
      />
    </div>
  );
}
