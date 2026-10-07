"use client";

import { useEffect, type ReactNode } from "react";

/** Right side drawer with scrim. Square, 2px ink rule, display title, × close. */
export function Drawer({ open, title, onClose, children, width = 380, footer }: { open: boolean; title: ReactNode; onClose: () => void; children: ReactNode; width?: number; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(16,24,40,.4)" }} />
      <aside role="dialog" aria-modal="true" style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 41, width: `min(${width}px,100vw)`, background: "#fff", borderLeft: "2px solid var(--ink)", display: "flex", flexDirection: "column", overflow: "auto" }}>
        <div style={{ padding: "14px 16px", borderBottom: "2px solid var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <b style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 18, textTransform: "uppercase" }}>{title}</b>
          <button type="button" onClick={onClose} aria-label="Close" style={{ border: 0, background: "none", fontSize: 20, cursor: "pointer", width: 36, height: 36 }}>×</button>
        </div>
        <div style={{ flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>{footer}</div>}
      </aside>
    </>
  );
}
