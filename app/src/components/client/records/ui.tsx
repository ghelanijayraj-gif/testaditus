"use client";

import { useEffect, useRef, useTransition, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ds";
import { useToast } from "@/components/ui/Toast";
import { useReadOnly } from "@/components/client/readonly";
import s from "./records.module.css";

export type Result = { toast?: string; error?: string; redirect?: string } | void;

/** Run a server action, show its toast, then follow its redirect or refresh. */
export function useRun() {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (action: () => Promise<Result>, opts: { confirm?: string | null; onDone?: (r: Result) => void } = {}) => {
    if (opts.confirm && !window.confirm(opts.confirm)) return;
    start(async () => {
      const r = await action();
      if (r?.error) toast(r.error);
      else if (r?.toast) toast(r.toast);
      opts.onDone?.(r);
      if (r?.redirect) router.push(r.redirect);
      else router.refresh();
    });
  };
  return { run, pending };
}

/** DS Button bound to a server action. Disabled in staff "Preview as client". */
export function ActBtn({ action, children, variant = "ink", size = "sm", full, confirm, disabled, style, label }: {
  action: () => Promise<Result>;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  confirm?: string | null;
  disabled?: boolean;
  style?: CSSProperties;
  label?: string;
}) {
  const ro = useReadOnly();
  const { run, pending } = useRun();
  return (
    <Button variant={variant} size={size} full={full} style={style} disabled={disabled || ro || pending} aria-label={label} onClick={() => run(action, { confirm })}>
      {children}
    </Button>
  );
}

/** Unstyled button bound to a server action (keeps each screen's exact styling). */
export function ActRaw({ action, children, className, style, confirm, title, label, disabled }: {
  action: () => Promise<Result>;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  confirm?: string | null;
  title?: string;
  label?: string;
  disabled?: boolean;
}) {
  const ro = useReadOnly();
  const { run, pending } = useRun();
  return (
    <button type="button" className={className} style={{ ...style, opacity: pending ? 0.6 : style?.opacity }} title={title} aria-label={label} disabled={disabled || ro || pending} onClick={() => run(action, { confirm })}>
      {children}
    </button>
  );
}

export function Toggle({ on, small }: { on: boolean; small?: boolean }) {
  return (
    <span aria-hidden className={[s.tgl, small ? s.tglSm : "", on ? s.tglOn : ""].join(" ")}>
      <i />
    </span>
  );
}

/** Right drawer whose open state lives in the URL. Scrim click, × and Escape go to `closeHref`. */
export function UrlDrawer({ kicker, closeHref, children }: { kicker: string; closeHref: string; children: ReactNode }) {
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && router.push(closeHref, { scroll: false });
    window.addEventListener("keydown", k);
    panel.current?.focus();
    return () => window.removeEventListener("keydown", k);
  }, [closeHref, router]);
  return (
    <div className={s.scrim} onClick={() => router.push(closeHref, { scroll: false })}>
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={kicker} className={s.drawer} onClick={(e) => e.stopPropagation()} style={{ outline: "none" }}>
        <div className={s.drawerHead}>
          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>{kicker}</span>
          <Link href={closeHref} scroll={false} className={s.close} aria-label="Close">
            ×
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Centre modal (05 §1.7). */
export function Modal({ title, onClose, children, width = 500 }: { title: ReactNode; onClose: () => void; children: ReactNode; width?: number }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    panel.current?.focus();
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className={s.modalScrim} onClick={onClose}>
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" className={s.modal} style={{ width: `min(${width}px,100%)`, outline: "none" }} onClick={(e) => e.stopPropagation()}>
        <div className={s.modalHead}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, textTransform: "uppercase" }}>{title}</span>
          <button type="button" onClick={onClose} className={s.close} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
