"use client";

import { useEffect, useRef, type ReactNode } from "react";
import l from "./layers.module.css";

/** Right drawer (kicker) or centre modal (title). Escape and backdrop close; focus is trapped inside. */
export function Overlay({ kind, label, onClose, children }: { kind: "drawer" | "modal"; label: string; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>("button")?.focus();
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && box.current) {
        const f = Array.from(box.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input,select,textarea")).filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", k);
    return () => {
      window.removeEventListener("keydown", k);
      prev?.focus?.();
    };
  }, []);
  return (
    <div className={kind === "drawer" ? l.backdrop : l.modalBackdrop} onClick={onClose}>
      <div ref={box} className={kind === "drawer" ? l.panel : l.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={label}>
        <div className={l.head} style={kind === "modal" ? { position: "static" } : undefined}>
          <span className={kind === "drawer" ? l.kicker : l.mTitle}>{label}</span>
          <button type="button" className={l.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
