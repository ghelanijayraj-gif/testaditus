"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import s from "./consoles.module.css";

/** Console toast (spec 0.1): ink bar, hard blue offset shadow, "✓ " prefix, 3 s. */
const Ctx = createContext<(msg: string) => void>(() => {});

export function ConsoleToast({ children }: { children: ReactNode }) {
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
        {msg && <div className={s.toast}>{msg.startsWith("✓") ? msg : "✓ " + msg}</div>}
      </div>
    </Ctx.Provider>
  );
}

export const useFlash = () => useContext(Ctx);

type R = { ok?: boolean; toast?: string; error?: string; redirect?: string } | void;

/** Run a server action: toast its message or error, follow its redirect, else refresh. */
export function useRun() {
  const [pending, start] = useTransition();
  const flash = useFlash();
  const router = useRouter();
  const run = useCallback(
    (fn: () => Promise<R>, opts: { refresh?: boolean; onOk?: () => void } = {}) =>
      start(async () => {
        try {
          const r = await fn();
          if (r?.error) {
            flash(r.error.replace(/^✓ /, ""));
            return;
          }
          if (r?.toast) flash(r.toast);
          opts.onOk?.();
          if (r?.redirect) router.push(r.redirect);
          else if (opts.refresh !== false) router.refresh();
        } catch {
          flash("Could not reach the server. Try again.");
        }
      }),
    [flash, router],
  );
  return { run, pending };
}

/** CSS padlock 10×12 (spec: 6×6 shackle, 10×7 body). */
export function Padlock() {
  return (
    <span aria-hidden style={{ position: "relative", width: 10, height: 12, flex: "none", display: "inline-block" }}>
      <span style={{ position: "absolute", left: 2, top: 0, width: 6, height: 6, border: "1.5px solid currentColor", borderBottom: 0, borderRadius: "3px 3px 0 0" }} />
      <span style={{ position: "absolute", left: 0, bottom: 0, width: 10, height: 7, background: "currentColor" }} />
    </span>
  );
}

export function Check({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={s.check + (on ? " " + s.checkOn : "")}>
      {on ? "✓" : ""}
    </span>
  );
}
