import Link from "next/link";
import type { ReactNode } from "react";
import s from "./staff.module.css";

/** Console page head: kicker, display title, actions on the right. */
export function PageHead({ kicker, title, actions }: { kicker: ReactNode; title: ReactNode; actions?: ReactNode }) {
  return (
    <div className={s.head}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className={s.kicker}>{kicker}</span>
        <h1 className={s.title}>{title}</h1>
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
    </div>
  );
}

/** Square filter chips (saved views, centre filters, settings tabs). Link based so state lives in the URL. */
export function Filters({ items }: { items: { label: string; href: string; on: boolean }[] }) {
  return (
    <div className={s.filters}>
      {items.map((f) => (
        <Link key={f.label} href={f.href} scroll={false} className={s.filter + (f.on ? " " + s.filterOn : "")} aria-current={f.on ? "true" : undefined}>
          {f.label}
        </Link>
      ))}
    </div>
  );
}

export function Grid({ variant = "one", children }: { variant?: "one" | "auto" | "two" | "three"; children: ReactNode }) {
  const v = { one: "", auto: s.gridAuto, two: s.grid2, three: s.grid3 }[variant];
  return <div className={s.grid + " " + v}>{children}</div>;
}

export type Cell =
  | ReactNode
  | { v: ReactNode; sans?: boolean; b?: boolean; chip?: boolean; flag?: boolean; fill?: boolean; link?: boolean; muted?: boolean; color?: string };

export type Row = { key: string; cells: Cell[]; href?: string; onClickNode?: ReactNode; bg?: string };

function renderCell(c: Cell, i: number) {
  if (c && typeof c === "object" && "v" in (c as object)) {
    const o = c as Exclude<Cell, ReactNode> & { v: ReactNode };
    const cls = [s.cell, o.sans ? s.cellSans : "", o.b ? s.cellB : "", o.link ? s.cellLink : ""].join(" ");
    const inner = o.chip ? <span className={[s.chip, o.flag ? s.chipFlag : "", o.fill ? s.chipFill : ""].join(" ")}>{o.v}</span> : o.fill ? <span className={s.chipFill} style={{ padding: "2px 6px" }}>{o.v}</span> : o.v;
    return (
      <span key={i} className={cls} style={{ color: o.muted ? "var(--grey-600)" : o.color }}>
        {inner}
      </span>
    );
  }
  return (
    <span key={i} className={s.cell}>
      {c as ReactNode}
    </span>
  );
}

/** Ruled section with an optional table. `cols` is a CSS grid template. */
export function Block({ title, sub, count, head = [], cols, rows, empty = "Nothing here.", minW, children }: {
  title: ReactNode;
  sub?: ReactNode;
  count?: ReactNode;
  head?: string[];
  cols?: string;
  rows?: Row[];
  empty?: string;
  minW?: string;
  children?: ReactNode;
}) {
  return (
    <section className={s.block}>
      <div className={s.blockHead}>
        <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <b className={s.blockTitle}>{title}</b>
          {sub && <span className={s.blockSub}>{sub}</span>}
        </span>
        <span className={s.blockCount}>{count ?? (rows ? String(rows.length) : null)}</span>
      </div>
      {rows && (
        <div className={s.scroll}>
          <div style={{ minWidth: minW ?? 0, display: "flex", flexDirection: "column" }}>
            {head.length > 0 && (
              <div className={s.thead} style={{ gridTemplateColumns: cols }}>
                {head.map((h, i) => (
                  <span key={i} className={s.th}>
                    {h}
                  </span>
                ))}
              </div>
            )}
            {rows.map((r) =>
              r.href ? (
                <Link key={r.key} href={r.href} className={s.row + " " + s.rowLink} style={{ gridTemplateColumns: cols, background: r.bg }}>
                  {r.cells.map(renderCell)}
                </Link>
              ) : (
                <div key={r.key} className={s.row} style={{ gridTemplateColumns: cols, background: r.bg }}>
                  {r.cells.map(renderCell)}
                </div>
              ),
            )}
            {rows.length === 0 && <span className={s.empty}>{empty}</span>}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

/** Key/value rows used on client file tabs, drawers and settings. */
export function KV({ rows, keyW = "minmax(140px,.6fr)" }: { rows: [ReactNode, ReactNode][]; keyW?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {rows.map(([k, v], i) => (
        <div key={i} className={s.row} style={{ gridTemplateColumns: `${keyW} minmax(0,1.4fr)` }}>
          <span className={s.cell + " " + s.cellB}>{k}</span>
          <span className={s.cell + " " + s.cellSans}>{v}</span>
        </div>
      ))}
    </div>
  );
}

export { s as staffStyles };
