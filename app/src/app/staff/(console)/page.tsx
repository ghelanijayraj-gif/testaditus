import { Block, PageHead, type Cell, type Row } from "@/components/staff/Page";
import { ActionButton } from "@/components/ui/ActionButton";
import { requireStaff } from "@/server/auth/guards";
import { loadToday, type Widget } from "@/server/staff/today";
import { scopeLabel } from "@/server/staff/common";
import { nudgeClients } from "@/server/staff/actions/clients";
import { dayLabel } from "@/lib/format";
import { now } from "@/lib/clock";
import { linkBtn } from "@/components/staff/admin/styles";
import d from "./today.module.css";

export const metadata = { title: "Today" };

// Work queues on the left, the day's agenda and money on the right.
const MAIN = ["review", "approval", "more", "stalled"];
const SIDE = ["sessions", "purchases", "expiring", "renewals"];

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
  const widgets = await loadToday(ctx);
  const byKey = new Map(widgets.map((w) => [w.key, w]));
  const pick = (keys: string[]) => keys.map((k) => byKey.get(k)).filter((w): w is Widget => !!w);
  const main = pick(MAIN);
  const side = pick(SIDE);
  const rest = widgets.filter((w) => !MAIN.includes(w.key) && !SIDE.includes(w.key));
  const ordered = [...main, ...side, ...rest];

  return (
    <>
      <PageHead kicker={`${dayLabel(now())} · ${scopeLabel(ctx)}`} title="Today" />
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
