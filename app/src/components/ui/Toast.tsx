"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/** Toast: ink bar, bottom centre, 2.6 s. One at a time, like the prototypes. */
const Ctx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children, bottom = 20 }: { children: ReactNode; bottom?: number | string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flash = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <Ctx.Provider value={flash}>
      {children}
      <div aria-live="polite" role="status">
        {msg && (
          <div style={{ position: "fixed", bottom, left: "50%", transform: "translateX(-50%)", zIndex: 70, background: "var(--ink)", color: "#fff", padding: "10px 16px", font: "500 13px var(--font-sans)", maxWidth: "90vw" }}>
            {msg}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
