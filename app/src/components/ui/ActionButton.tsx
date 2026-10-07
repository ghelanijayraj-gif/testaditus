"use client";

import { useTransition, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";

export type ActionResult = { ok?: boolean; toast?: string; redirect?: string; error?: string } | void;

/**
 * Plain button that runs a server action, then shows its toast and refreshes.
 * Unstyled by default so each screen keeps its exact prototype styling.
 */
export function ActionButton({ action, children, style, className, disabled, title, confirm, ...rest }: {
  action: () => Promise<ActionResult>;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  disabled?: boolean;
  title?: string;
  confirm?: string;
  "aria-label"?: string;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      style={{ ...style, opacity: pending ? 0.6 : style?.opacity }}
      disabled={disabled || pending}
      title={title}
      aria-label={rest["aria-label"]}
      onClick={(e) => {
        e.stopPropagation();
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const r = await action();
          if (r?.error) toast(r.error);
          else if (r?.toast) toast(r.toast);
          if (r?.redirect) router.push(r.redirect);
          else router.refresh();
        });
      }}
    >
      {children}
    </button>
  );
}
