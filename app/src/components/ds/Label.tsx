import type { CSSProperties, ReactNode } from "react";

export type LabelTone = "blue" | "ink" | "sky" | "ice" | "navy" | "periwinkle";
const T: Record<LabelTone, [string, string]> = {
  blue: ["var(--blue)", "#FFFFFF"],
  ink: ["var(--ink)", "#FFFFFF"],
  sky: ["var(--sky)", "var(--ink)"],
  ice: ["var(--ice)", "var(--ink)"],
  navy: ["var(--navy)", "#FFFFFF"],
  periwinkle: ["var(--periwinkle)", "var(--ink)"],
};

/** Filled square label (kicker/badge). */
export function Label({ children, tone = "blue", display = false, style }: { children: ReactNode; tone?: LabelTone; display?: boolean; style?: CSSProperties }) {
  const [bg, fg] = T[tone] ?? T.blue;
  return (
    <span
      style={{
        display: "inline-flex",
        alignSelf: "flex-start",
        padding: display ? "4px 10px" : "3px 8px",
        background: bg,
        color: fg,
        fontFamily: display ? "var(--font-display)" : "var(--font-mono)",
        fontSize: display ? 12 : 11,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
