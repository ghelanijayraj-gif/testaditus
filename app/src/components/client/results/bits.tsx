import type { CSSProperties, ReactNode } from "react";
import { Lock } from "@/components/ui/Lock";
import { nightBar, tagUI, statusUI, type Status, type TagLabel } from "@/lib/measures";
import s from "./results.module.css";

/** "Who can see this" line with the CSS padlock (05 §0.1). */
export function WhoCanSee({ text }: { text: string }) {
  return (
    <span className={s.who}>
      <Lock size={12} />
      {text}
    </span>
  );
}

export const Kicker = ({ children, color, style }: { children: ReactNode; color?: string; style?: CSSProperties }) => (
  <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: color ?? "var(--grey-600)", ...style }}>{children}</span>
);

/** Small tag chip in the measure list (inset grey ring). */
export const ListTag = ({ tag }: { tag: TagLabel }) => (
  <span style={{ fontSize: 9, textTransform: "uppercase", padding: "2px 6px", boxShadow: "inset 0 0 0 1px var(--grey-400)", whiteSpace: "nowrap", color: "var(--grey-700)" }}>{tag}</span>
);

/** Detail header tag: Measured ink, Observed outline, Self reported grey. */
export const DetailTag = ({ tag }: { tag: TagLabel }) => {
  const u = tagUI(tag);
  return <span style={{ fontSize: 9, textTransform: "uppercase", padding: "3px 7px", background: u.bg, color: u.fg, boxShadow: u.bd, whiteSpace: "nowrap" }}>{tag}</span>;
};

export const StatusChip = ({ st }: { st: Status }) => {
  const u = statusUI(st);
  if (!u.label) return null;
  return <span style={{ fontSize: 9, textTransform: "uppercase", padding: "3px 6px", whiteSpace: st === "nc" ? "normal" : "nowrap", background: u.bg, color: u.fg, boxShadow: u.bd }}>{u.label}</span>;
};

/** Self reported sleep strip: one bar per night from bedtime to wake time. */
export function NightStrip({ nights, height = 220, axis = true, inset = 3 }: { nights: { bed: number; dur: number; day: string }[]; height?: number; axis?: boolean; inset?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: axis ? "44px repeat(7,minmax(0,1fr))" : "repeat(7,1fr)", gap: axis ? 4 : 3, height }}>
      {axis && (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 9, color: "var(--grey-600)", paddingBottom: 22 }} aria-hidden>
          <span>20:00</span>
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
        </div>
      )}
      {nights.map((n, i) => {
        const b = nightBar(n.bed, n.dur);
        const bar = (
          <div style={{ flex: 1, position: "relative", background: "var(--grey-50)", boxShadow: "inset 0 0 0 1px var(--grey-200)", height: axis ? undefined : "100%" }}>
            <div style={{ position: "absolute", left: inset, right: inset, top: b.top, height: b.h, background: "var(--blue)" }} />
          </div>
        );
        if (!axis) return <div key={i}>{bar}</div>;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }} aria-label={`${n.day}: ${n.dur.toFixed(1)} hours`}>
            {bar}
            <span style={{ fontSize: 10, textAlign: "center", fontWeight: 700 }}>{n.dur.toFixed(1)}</span>
            <span style={{ fontSize: 9, textAlign: "center", color: "var(--grey-600)", textTransform: "uppercase" }}>{n.day}</span>
          </div>
        );
      })}
    </div>
  );
}
