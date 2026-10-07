import type { CSSProperties } from "react";
import s from "./ds.module.css";

export type SystemId = "movement" | "breathwork" | "recovery" | "performance";

const LOOPS: { id: SystemId; name: string; cx: number; cy: number; r: number; rot: number }[] = [
  { id: "movement", name: "Movement", cx: 628, cy: 382, r: 218, rot: -8 },
  { id: "breathwork", name: "Breath", cx: 880, cy: 636, r: 218, rot: 20 },
  { id: "recovery", name: "Recovery", cx: 622, cy: 878, r: 218, rot: 6 },
  { id: "performance", name: "Performance", cx: 380, cy: 622, r: 218, rot: -24 },
];

const pts = (l: (typeof LOOPS)[number]) =>
  Array.from({ length: 7 }, (_, i) => {
    const a = ((l.rot + (i * 360) / 7 - 90) * Math.PI) / 180;
    return (l.cx + l.r * Math.cos(a)).toFixed(1) + "," + (l.cy + l.r * Math.sin(a)).toFixed(1);
  }).join(" ");

type Props = {
  active?: SystemId | "";
  color?: string;
  muted?: string;
  size?: number | string;
  onPick?: (id: SystemId | "") => void;
  style?: CSSProperties;
};

/** The ADITUS mark: four interlocking rounded heptagon loops, one per system. */
export function AditusMark({ active = "", color = "#006DE0", muted = "#BDEBFF", size = 120, onPick, style }: Props) {
  return (
    <svg viewBox="80 80 1094 1094" role="img" aria-label={"ADITUS" + (active ? " — " + active : "")} style={{ width: size, height: size, display: "block", overflow: "visible", flex: "none", ...style }}>
      {LOOPS.map((l) => {
        const on = active === l.id;
        const dim = !!active && !on;
        return (
          <g
            key={l.id}
            className={s.markLoop}
            onClick={onPick ? () => onPick(on ? "" : l.id) : undefined}
            style={{ cursor: onPick ? "pointer" : "default", opacity: dim ? 0.55 : 1, transform: on ? "scale(1.045)" : "scale(1)" }}
          >
            <polygon points={pts(l)} fill="none" stroke={dim ? muted : color} strokeWidth="104" strokeLinejoin="round" />
          </g>
        );
      })}
    </svg>
  );
}
