import type { CSSProperties } from "react";

/** Inline style atoms from the 12 prototype, for one off controls. */
export const linkBtn: CSSProperties = { border: 0, background: "none", padding: 0, cursor: "pointer", font: "700 11px var(--font-mono)", color: "var(--blue)", textAlign: "left" };

export const chipBtn = (on: boolean, h = 26): CSSProperties => ({
  height: h,
  padding: "0 8px",
  border: "1.5px solid var(--ink)",
  cursor: "pointer",
  fontSize: 9,
  textTransform: "uppercase",
  background: on ? "var(--ink)" : "#fff",
  color: on ? "#fff" : "var(--ink)",
  fontFamily: "var(--font-mono)",
});

export const squareBtn: CSSProperties = { width: 28, height: 28, border: "1px solid var(--grey-300)", background: "#fff", cursor: "pointer", fontFamily: "var(--font-mono)" };

export const input: CSSProperties = { height: 36, border: "1.5px solid var(--ink)", borderRadius: 0, padding: "0 10px", font: "400 13px var(--font-sans)", background: "#fff", color: "var(--ink)", minWidth: 0 };

export const textarea: CSSProperties = { ...input, height: "auto", minHeight: 72, padding: "8px 10px", lineHeight: 1.45, resize: "vertical" };

export const fieldLabel: CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 9, textTransform: "uppercase", color: "var(--grey-600)", letterSpacing: ".04em" };

export const smallKicker: CSSProperties = { fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" };

export const outlineSmall: CSSProperties = { height: 28, padding: "0 10px", border: "1.5px solid var(--ink)", background: "#fff", cursor: "pointer", fontSize: 10, textTransform: "uppercase", fontFamily: "var(--font-mono)", color: "var(--ink)", display: "inline-flex", alignItems: "center" };
