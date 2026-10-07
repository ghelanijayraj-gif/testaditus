"use client";

import { useEffect, useRef, useState } from "react";
import { fmtMetric } from "./catalog";

type Props = {
  days: number;
  points: { i: number; v: number }[];
  dec: number;
  unit: string;
  pace?: boolean;
  baseline: { i: number; label: string } | null;
  sessionDays: number[];
  window: { from: number; to: number } | null;
  rightLabel: string;
  label: string;
};

/**
 * 05 §6.3 health trend chart. The prototype stretched a 600×200 SVG with preserveAspectRatio=none,
 * which distorts text and the latest dot [FIX]; here the SVG is drawn at the measured box size.
 */
export function TrendChart({ days, points, dec, unit, pace, baseline, sessionDays, window: win, rightLabel, label }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 200 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.max(240, e.contentRect.width), h: Math.max(140, e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { w: W, h: H } = size;
  const pl = 36, pr = 16, pt = 14, pb = 24;
  if (!points.length) return <div ref={box} style={{ position: "absolute", inset: "16px 18px 8px" }} />;
  const vals = points.map((p) => p.v);
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const pad = (mx - mn) * 0.15 || 1;
  const lo = mn - pad, hi = mx + pad;
  const X = (i: number) => pl + (W - pl - pr) * (i / Math.max(1, days - 1));
  const Y = (v: number) => pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo));
  const mono = { fontFamily: "var(--font-mono)" } as const;
  const last = points[points.length - 1];
  const tick = (v: number) => (pace ? fmtMetric({ dec, pace }, v) : v.toFixed(dec));
  return (
    <div ref={box} style={{ position: "absolute", inset: "16px 18px 8px" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={{ display: "block", overflow: "visible" }}>
        {win && <rect x={X(win.from)} y={pt} width={Math.max(2, X(win.to) - X(win.from))} height={H - pt - pb} fill="#BDEBFF" opacity={0.55} />}
        {[0, 1, 2, 3, 4].map((k) => {
          const v = lo + ((hi - lo) * k) / 4;
          const y = Y(v);
          return (
            <g key={k}>
              <line x1={pl} x2={W - pr} y1={y} y2={y} stroke="#E6E8EC" strokeWidth={1} />
              <text x={pl - 6} y={y + 3} textAnchor="end" style={{ ...mono, fontSize: 9, fill: "#98A2B3" }}>
                {tick(v)}
              </text>
            </g>
          );
        })}
        {sessionDays.map((i) => (
          <rect key={"s" + i} x={X(i) - 2.5} y={H - pb + 6} width={5} height={5} fill="#879DDA" />
        ))}
        {baseline && (
          <g>
            <line x1={X(baseline.i)} x2={X(baseline.i)} y1={pt} y2={H - pb} stroke="#006DE0" strokeWidth={1.5} strokeDasharray="3 3" />
            <text x={X(baseline.i) + 5} y={pt + 9} style={{ ...mono, fontSize: 9, fill: "#006DE0" }}>
              {baseline.label}
            </text>
          </g>
        )}
        <text x={W - pr} y={H - pb + 20} textAnchor="end" style={{ ...mono, fontSize: 9, fill: "#475467" }}>
          {rightLabel}
        </text>
        <text x={pl} y={H - pb + 20} style={{ ...mono, fontSize: 9, fill: "#98A2B3" }}>
          {days} DAYS AGO
        </text>
        <polyline points={points.map((p) => `${X(p.i)},${Y(p.v)}`).join(" ")} fill="none" stroke="#101828" strokeWidth={1.5} strokeLinejoin="round" />
        <circle cx={X(last.i)} cy={Y(last.v)} r={5} fill="#006DE0" stroke="#fff" strokeWidth={2} />
        <text x={X(last.i) - 8} y={Y(last.v) - 10} textAnchor="end" style={{ ...mono, fontSize: 11, fontWeight: 700, fill: "#101828" }}>
          {fmtMetric({ dec, pace }, last.v)}
          {unit ? " " + unit : ""}
        </text>
      </svg>
    </div>
  );
}
