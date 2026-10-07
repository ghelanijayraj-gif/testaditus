import type { ReactNode } from "react";
import { Lock } from "@/components/ui/Lock";
import s from "./records.module.css";

export function Who({ children }: { children: ReactNode }) {
  return (
    <span className={s.who}>
      <Lock size={12} />
      {children}
    </span>
  );
}

export function PageHead({ kicker, title, who, right, h1Style }: { kicker: ReactNode; title: ReactNode; who?: ReactNode; right?: ReactNode; h1Style?: React.CSSProperties }) {
  return (
    <div className={s.head}>
      <div className={s.titleCol}>
        <span className={s.kicker}>{kicker}</span>
        <h1 className={s.h1} style={h1Style}>
          {title}
        </h1>
        {who && <Who>{who}</Who>}
      </div>
      {right}
    </div>
  );
}

export function Segments({ used, total, height = 12 }: { used: number; total: number; height?: number }) {
  return (
    <div className={s.segs} style={{ gridTemplateColumns: `repeat(${total},1fr)` }} aria-label={`${used} of ${total} used`} role="img">
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < used ? s.used : ""} style={{ height }} />
      ))}
    </div>
  );
}

export function Chip({ tone, children, style }: { tone: "ink" | "ice" | "white" | "blue"; children: ReactNode; style?: React.CSSProperties }) {
  const t = { ink: s.chipInk, ice: s.chipIce, white: s.chipWhite, blue: s.chipBlue }[tone];
  return (
    <span className={`${s.chip} ${t}`} style={style}>
      {children}
    </span>
  );
}
