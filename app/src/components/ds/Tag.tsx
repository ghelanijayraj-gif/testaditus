import type { CSSProperties, ReactNode } from "react";

/** Outlined tag; md = mono uppercase 26px, lg = Archivo 38px. */
export function Tag({ children, tone = "ink", size = "md", style }: { children: ReactNode; tone?: "ink" | "light"; size?: "md" | "lg"; style?: CSSProperties }) {
  const c = tone === "light" ? "#FFFFFF" : "var(--ink)";
  const big = size === "lg";
  return (
    <span
      style={{
        height: big ? 38 : 26,
        padding: big ? "0 14px" : "0 9px",
        border: "1.5px solid " + c,
        color: c,
        display: "inline-flex",
        alignItems: "center",
        fontFamily: big ? "var(--font-sans)" : "var(--font-mono)",
        fontSize: big ? 15 : 10,
        textTransform: big ? "none" : "uppercase",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
