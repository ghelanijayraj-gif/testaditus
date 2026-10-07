"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import s from "./day.module.css";

/** 04 toast: top 72, ink with hard blue shadow, "✓ " prefix, 3 s, one at a time. */
const Ctx = createContext<(msg: string) => void>(() => {});

export function DayToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flash = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), 3000);
  }, []);
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <Ctx.Provider value={flash}>
      {children}
      <div aria-live="polite" role="status">
        {msg && <div className={s.toast}>✓ {msg}</div>}
      </div>
    </Ctx.Provider>
  );
}

export const useDayToast = () => useContext(Ctx);
