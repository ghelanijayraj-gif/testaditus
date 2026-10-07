"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { checkIn } from "@/server/client/sessions";
import type { TopAction } from "@/server/client/phase";
import s from "./shell.module.css";

export const LAYER_KEYS = ["session", "panel", "confirm", "book"] as const;

/** URL for the current page with a portal layer opened (drawer or modal). */
export function layerHref(pathname: string, open: Record<string, string | undefined>) {
  const q = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  for (const k of LAYER_KEYS) q.delete(k);
  for (const [k, v] of Object.entries(open)) if (v) q.set(k, v);
  const qs = q.toString();
  return `${pathname}${qs ? "?" + qs : ""}`;
}

/** The 05 top right action (also the mobile sticky bar and the "n to do" chip). */
export function ActButton({ a, className, plain, label, disabled }: { a: TopAction; className?: string; plain?: boolean; label?: string; disabled?: boolean }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const toast = useToast();
  const [pending, start] = useTransition();
  if (a.kind === "hidden") return null;
  const tone = a.treatment === "warn" ? s.warn : a.treatment === "quiet" ? s.quiet : s.primary;
  const go = () => {
    if (disabled) return;
    if (a.href) return router.push(a.href);
    if (a.open) return router.push(layerHref(pathname, a.open), { scroll: false });
    if (a.checkIn) {
      const id = a.checkIn;
      start(async () => {
        const r = await checkIn(id);
        if (r.error) toast(r.error);
        else if (r.toast) toast(r.toast);
        router.refresh();
      });
    }
  };
  return (
    <button type="button" onClick={go} disabled={disabled || pending} className={plain ? className : `${s.actBtn} ${tone} ${className ?? ""}`} style={{ opacity: pending ? 0.6 : undefined, border: plain ? 0 : undefined, cursor: "pointer" }}>
      {!plain && a.chip && <span className={s.chip}>{a.chip}</span>}
      {label ?? a.label}
    </button>
  );
}
