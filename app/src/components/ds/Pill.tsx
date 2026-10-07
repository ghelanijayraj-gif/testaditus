import Link from "next/link";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import s from "./ds.module.css";

/** System pill (999px radius) — the one rounded control in the system. */
export function Pill({ children, href, active, onClick, style }: { children: ReactNode; href?: string; active?: boolean; onClick?: MouseEventHandler<HTMLElement>; style?: CSSProperties }) {
  const cls = s.pill + (active ? " " + s.pillOn : "");
  if (href) return <Link href={href} className={cls} style={style} onClick={onClick}>{children}</Link>;
  return <button type="button" className={cls} style={style} onClick={onClick} aria-pressed={!!active}>{children}</button>;
}
