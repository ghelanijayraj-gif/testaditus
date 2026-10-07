"use client";

import { useState } from "react";
import { BODY, GROUP_NAMES } from "./bodyGeometry";

export type BodyView = "front" | "back" | "left" | "right";
export type BodySpot = { id: string; x: number; y: number; n?: string; on?: boolean; onPick?: () => void };

/** "R:knee" → "Right knee", "C:neck" → "Neck". */
export function groupLabel(k: string) {
  const [s, g] = k.split(":");
  const name = GROUP_NAMES[g] ?? g;
  return (s === "R" ? "Right " : s === "L" ? "Left " : "") + (s === "C" ? name : name.toLowerCase());
}

type Props = {
  view: BodyView;
  /** Groups filled blue (selected / highlighted). */
  selected?: string[];
  /** Group filled ink (focus). */
  focus?: string | null;
  spots?: BodySpot[];
  /** Shoulder/hip/knee/floor guide lines and plumb line (capture and review overlays). */
  guides?: boolean;
  onPick?: (group: string) => void;
  /** Called with the hovered group label (or null), e.g. to show "Right knee". */
  onHover?: (group: string | null) => void;
  ariaLabel?: string;
};

/**
 * Body outline split into muscle groups (front, back, left, right), viewBox 400×720.
 * Fills: selected blue, focus ink, hover grey 400, rest grey 200. Render inside a box
 * with aspect-ratio 400/720; the svg fills it absolutely.
 */
export function BodyMap({ view, selected = [], focus = null, spots = [], guides = false, onPick, onHover, ariaLabel }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const side = view === "left" || view === "right";
  const near = view === "front" ? "R" : view === "back" ? "L" : view === "right" ? "R" : "L";
  const far = near === "R" ? "L" : "R";
  const fillOf = (k: string) => (selected.includes(k) ? "#006DE0" : focus === k ? "#101828" : hover === k ? "#98A2B3" : "#E6E8EC");
  const paths: React.ReactNode[] = [];
  const mk = (k: string, d: string, i: number, tf?: string) =>
    paths.push(
      <path
        key={k + i + (tf ? "m" : "")}
        d={d}
        transform={tf}
        onClick={onPick ? () => onPick(k) : undefined}
        onMouseEnter={() => {
          setHover(k);
          onHover?.(k);
        }}
        onMouseLeave={() => {
          setHover(null);
          onHover?.(null);
        }}
        style={{ fill: fillOf(k), stroke: "#FFFFFF", strokeWidth: 2, strokeLinejoin: "round", cursor: onPick ? "pointer" : "default", transition: "fill .25s" }}
      >
        <title>{groupLabel(k)}</title>
      </path>,
    );
  const set = side ? BODY.side : BODY[view as "front" | "back"];
  set.forEach(([t, id, d], i) => {
    if (t === "C") mk("C:" + id, d, i);
    else if (side) mk(near + ":" + id, d, i);
    else {
      mk((t === "M" ? "C" : near) + ":" + id, d, i);
      mk((t === "M" ? "C" : far) + ":" + id, d, i, "translate(400,0) scale(-1,1)");
    }
  });
  return (
    <svg viewBox="0 0 400 720" role="img" aria-label={ariaLabel ?? `Body, ${view} view`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
      {guides && (
        <g>
          {([[140, "Shoulder"], [366, "Hip"], [543, "Knee"], [710, "Floor"]] as const).map(([y, t]) => (
            <g key={t}>
              <line x1={0} x2={400} y1={y} y2={y} style={{ stroke: "#D0D5DD", strokeWidth: 1, strokeDasharray: "3 5" }} />
              <text x={2} y={y - 6} style={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "#98A2B3", letterSpacing: ".06em" }}>
                {t.toUpperCase()}
              </text>
            </g>
          ))}
          <line x1={200} x2={200} y1={14} y2={712} style={{ stroke: "#BDEBFF", strokeWidth: 1.5 }} />
        </g>
      )}
      <ellipse cx={200} cy={712} rx={120} ry={8} style={{ fill: "#E6E8EC" }} />
      <g transform={view === "left" ? "translate(400,0) scale(-1,1)" : undefined}>{paths}</g>
      {spots.map((s) => (
        <g key={s.id} onClick={s.onPick} style={{ cursor: s.onPick ? "pointer" : "default" }}>
          {s.on && (
            <circle cx={s.x} cy={s.y} r={12} style={{ fill: "none", stroke: "#101828", strokeWidth: 1.5, pointerEvents: "none" }}>
              <animate attributeName="r" values="10;28" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values=".8;0" dur="1.8s" repeatCount="indefinite" />
            </circle>
          )}
          <circle cx={s.x} cy={s.y} r={s.on ? 8 : 6} style={{ fill: s.on ? "#101828" : "#FFFFFF", stroke: s.on ? "#FFFFFF" : "#006DE0", strokeWidth: 2.5 }} />
          {s.n && (
            <text x={s.x + (s.x > 300 ? -14 : 14)} y={s.y + 4} textAnchor={s.x > 300 ? "end" : "start"} style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, fill: "#101828", paintOrder: "stroke", stroke: "#F7F8FA", strokeWidth: 4, pointerEvents: "none" }}>
              {s.n}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
