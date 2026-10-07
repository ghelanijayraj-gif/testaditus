import type { Metadata } from "next";
import Link from "next/link";
import { requireClient } from "@/server/auth/guards";
import { Button } from "@/components/ds";
import { getCalendarModel, type CalEvent } from "@/server/client/shell/calendar";
import { DOW } from "@/components/client/calendar/dates";
import c from "@/components/client/calendar/calendar.module.css";

export const metadata: Metadata = { title: "Calendar" };

const LEGEND = [
  ["Personal Training", "var(--blue)"],
  ["Group Training", "var(--navy)"],
  ["Assessment", "var(--ink)"],
  ["Breath session", "var(--sky)"],
  ["Review call", "var(--periwinkle)"],
  ["Community event", "var(--ice)"],
];

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function CalendarPage({ searchParams }: { searchParams: SP }) {
  const { client } = await requireClient();
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const view = one("view");
  const v = view === "month" || view === "week" || view === "agenda" ? view : null;
  const m = await getCalendarModel(client.id, { m: one("m"), wk: one("wk") });

  const q = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base = { view: v ?? undefined, m: one("m"), wk: one("wk"), ...extra };
    for (const [k, val] of Object.entries(base)) if (val) p.set(k, val);
    const s = p.toString();
    return `/calendar${s ? "?" + s : ""}`;
  };
  const open = (e: CalEvent) => q({ session: e.id });

  const viewCls = (name: "month" | "week" | "agenda") => {
    if (v) return `${c.view} ${v === name ? c.viewOn : ""}`;
    return `${c.view} ${name === "month" ? c.viewOnDesk : ""} ${name === "agenda" ? c.viewOnMob : ""}`;
  };
  const showMonth = v === "month" ? "" : v ? null : c.deskOnly;
  const showWeek = v === "week" ? "" : null;
  const showAgenda = v === "agenda" ? "" : v ? null : c.mobileOnly;

  return (
    <>
      <div className={c.head}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span className={c.kicker}>{m.pkg}</span>
          <h1 className={c.h1}>Calendar.</h1>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {m.canBook && (
            <Button variant="ink" size="md" href={q({ book: "book" })}>
              BOOK A SESSION
            </Button>
          )}
          {m.re && (
            <Button variant={m.re.variant} size="md" disabled={m.re.disabled} href={m.re.disabled ? undefined : q({ book: "bookRe" })}>
              {m.re.label}
            </Button>
          )}
        </div>
      </div>

      <div className={c.controls}>
        <nav className={c.views} aria-label="Calendar view">
          {(["month", "week", "agenda"] as const).map((n) => (
            <Link key={n} href={q({ view: n })} className={viewCls(n)} aria-current={v === n ? "page" : undefined} scroll={false}>
              {n}
            </Link>
          ))}
        </nav>
        <div className={c.legend}>
          {LEGEND.map(([label, bg]) => (
            <span key={label} className={c.lg}>
              <i className={c.sw} style={{ background: bg }} />
              {label}
            </span>
          ))}
          {m.hasWindow && (
            <span className={c.lg}>
              <i style={{ width: 18, height: 12, background: "var(--mist)", boxShadow: "inset 0 -3px 0 var(--blue)", display: "block" }} />
              Reassessment window
            </span>
          )}
          {m.planEndDay && (
            <span className={c.lg}>
              <i style={{ fontStyle: "normal", fontSize: 8, fontWeight: 700, padding: "1px 4px", background: "var(--ink)", color: "#fff" }}>{m.planEndDay}</i>
              Plan ends
            </span>
          )}
        </div>
      </div>

      {m.empty ? (
        <div className={c.empty}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 22, textTransform: "uppercase" }}>Nothing booked yet.</span>
          <span style={{ font: "400 15px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>Book your Movement Assessment first. Training sessions follow it.</span>
        </div>
      ) : (
        <>
          {showMonth !== null && (
            <div className={`${c.card} ${showMonth}`}>
              <div className={c.cardHead}>
                <div className={c.nav}>
                  <Link href={q({ view: v ?? undefined, m: m.prevM })} className={c.navBtn} aria-label="Previous month" scroll={false}>
                    ←
                  </Link>
                  <span className={c.title18}>{m.monthTitle}</span>
                  <Link href={q({ view: v ?? undefined, m: m.nextM })} className={c.navBtn} aria-label="Next month" scroll={false}>
                    →
                  </Link>
                </div>
                <span className={c.meta}>{m.weekLine}</span>
              </div>
              <div className={c.month}>
                {DOW.map((d) => (
                  <span key={d} className={c.dow}>
                    {d}
                  </span>
                ))}
                {m.cells.map((cell) => (
                  <div key={cell.key} className={`${c.cell} ${cell.window ? c.win : cell.out ? c.out : ""}`}>
                    <span className={c.num} style={{ color: cell.out && !cell.window ? "var(--grey-400)" : "var(--ink)" }}>
                      <span className={cell.today ? c.todayN : undefined}>{cell.label}</span>
                      {cell.planEnd && <span className={c.endChip}>Plan ends</span>}
                    </span>
                    {cell.ev.map((e) => (
                      <Link key={e.id} href={open(e)} scroll={false} className={c.chip} title={`${e.time} ${e.title} · ${e.status}`} style={{ background: e.bg, color: e.fg, boxShadow: e.bd, textDecoration: e.strike ? "line-through" : "none" }}>
                        {e.chip}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showWeek !== null && (
            <div className={c.card} style={{ border: 0 }}>
              <div className={c.cardHead} style={{ border: "2px solid var(--ink)", borderBottom: 0 }}>
                <div className={c.nav}>
                  <Link href={q({ view: "week", wk: m.prevWk })} className={c.navBtn} aria-label="Previous week" scroll={false}>
                    ←
                  </Link>
                  <span className={c.title18}>{m.weekTitle}</span>
                  <Link href={q({ view: "week", wk: m.nextWk })} className={c.navBtn} aria-label="Next week" scroll={false}>
                    →
                  </Link>
                </div>
                <span className={c.meta}>{m.weekLine}</span>
              </div>
              <div className={c.weekWrap}>
                <div className={c.weekGrid}>
                  {m.week.map((d) => (
                    <div key={d.key} className={c.wcol} style={{ background: d.today ? "var(--mist)" : undefined }}>
                      <span className={c.wday} style={{ fontWeight: d.today ? 700 : 400 }}>
                        {d.label}
                      </span>
                      <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                        {d.ev.map((e) => (
                          <Link key={e.id} href={open(e)} scroll={false} className={c.wev} style={{ background: e.bg, color: e.fg, boxShadow: e.bd, textDecoration: e.strike ? "line-through" : "none" }}>
                            <b style={{ fontSize: 11 }}>{e.time}</b>
                            <span style={{ fontSize: 11, lineHeight: 1.3 }}>{e.title}</span>
                            <span style={{ fontSize: 9, textTransform: "uppercase", opacity: 0.85 }}>{e.status}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showAgenda !== null && (
            <div className={`${c.card} ${showAgenda}`}>
              {m.agenda.length === 0 && <div style={{ padding: "14px 18px", font: "400 15px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>Nothing coming up.</div>}
              {m.agenda.map((e) => (
                <Link key={e.id} href={open(e)} scroll={false} className={c.arow}>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <b style={{ fontSize: 12, textTransform: "uppercase" }}>{e.dayLabel}</b>
                    <span style={{ fontSize: 12, color: "var(--grey-700)" }}>{e.time}</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <i className={c.bar} style={{ background: e.statusKey === "CANCELLED" || e.statusKey === "MISSED" ? "transparent" : e.bg }} />
                    <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span style={{ font: "600 15px var(--font-sans)", textDecoration: e.strike ? "line-through" : "none" }}>{e.title}</span>
                      <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>
                        {e.typeLabel} · {e.where}
                      </span>
                    </span>
                  </span>
                  <span style={{ fontSize: 10, textTransform: "uppercase", justifySelf: "end" }}>{e.status}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
