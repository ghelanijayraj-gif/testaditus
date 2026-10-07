"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Toast, one at a time like the prototypes.
 * "console" (default): ink bar, bottom centre, 2.6 s (staff and 06 screens).
 * "portal": 05 client portal toast, top centre, blue check square, hard blue shadow, 3.4 s.
 */
const Ctx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children, bottom = 20, variant = "console" }: { children: ReactNode; bottom?: number | string; variant?: "console" | "portal" }) {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flash = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), variant === "portal" ? 3400 : 2600);
  }, [variant]);
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <Ctx.Provider value={flash}>
      {children}
      <div aria-live="polite" role="status">
        {msg && variant === "portal" && (
          <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 20, background: "var(--ink)", color: "#fff", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "6px 6px 0 #006DE0", maxWidth: "calc(100vw - 32px)", font: "600 14px/1.35 var(--font-sans)" }}>
            <span aria-hidden style={{ width: 22, height: 22, flex: "none", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✓</span>
            {msg}
          </div>
        )}
        {msg && variant === "console" && (
          <div style={{ position: "fixed", bottom, left: "50%", transform: "translateX(-50%)", zIndex: 70, background: "var(--ink)", color: "#fff", padding: "10px 16px", font: "500 13px var(--font-sans)", maxWidth: "90vw" }}>
            {msg}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
