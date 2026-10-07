"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, type ButtonVariant, type ButtonSize } from "@/components/ds";
import { ActionButton } from "@/components/ui/ActionButton";
import { useToast } from "@/components/ui/Toast";
import { useReadOnly } from "@/components/client/readonly";
import { dismissRecommendation, reopenRecommendation } from "@/server/client/plan/actions";
import ds from "@/components/ds/ds.module.css";
import s from "./plan.module.css";

/** Toasts carried across a redirect as ?t=… (cleared from the URL after showing). */
const FLASH: Record<string, (q: URLSearchParams) => string> = {
  submitted: (q) => `Submitted. ${q.get("by") ?? "Jayraj"} has been told.`,
  booked: (q) => `Booked. ${q.get("by") ?? "Jayraj"} has been told.`,
  paid: () => "Shopify checkout · paid ₹X,XXX",
  dismissed: () => "Saved. You can reopen this from your assessment plan.",
  capture: () => "Submitted. Your practitioner reviews within XX hours.",
  sent: (q) => `Sent. ${q.get("by") ?? "Jayraj"}’s review time restarts now.`,
  later: () => "Saved to your plan. Your slot is not held until payment is done.",
};

export function Flash() {
  const q = useSearchParams();
  const toast = useToast();
  const router = useRouter();
  const path = usePathname();
  const shown = useRef<string | null>(null);
  const t = q.get("t");
  useEffect(() => {
    if (!t || shown.current === t || !FLASH[t]) return;
    shown.current = t;
    toast(FLASH[t](q));
    const next = new URLSearchParams(q);
    next.delete("t");
    next.delete("by");
    const qs = next.toString();
    router.replace(path + (qs ? `?${qs}` : ""), { scroll: false });
  }, [t, q, toast, router, path]);
  return null;
}

/** Link styled as a DS button; disabled in staff preview. */
export function LinkButton({ href, children, variant = "ink", size = "lg", full, readOnly }: { href: string; children: React.ReactNode; variant?: ButtonVariant; size?: ButtonSize; full?: boolean; readOnly?: boolean }) {
  const ro = useReadOnly() || readOnly;
  return (
    <Button href={ro ? undefined : href} disabled={ro} variant={variant} size={size} full={full}>
      {children}
    </Button>
  );
}

/** REC card buttons: ADD AND BOOK → / CONTINUE ONLINE ONLY. */
export function RecButtons({ readOnly }: { readOnly?: boolean }) {
  const ro = useReadOnly() || readOnly;
  return (
    <>
      <Button href={ro ? undefined : "/assessment/in-person?step=pay"} disabled={ro} variant="blue" size="md" full>
        ADD AND BOOK →
      </Button>
      <DsAction action={dismissRecommendation} variant="outline" size="md" full disabled={ro}>
        CONTINUE ONLINE ONLY
      </DsAction>
    </>
  );
}

/** "Changed your mind? In person session →" and REOPEN. */
export function ReopenLink({ readOnly }: { readOnly?: boolean }) {
  const ro = useReadOnly() || readOnly;
  return (
    <ActionButton action={reopenRecommendation} disabled={ro} className={s.textBtn} style={{ alignSelf: "flex-start", textDecoration: "underline" }}>
      Changed your mind? In person session →
    </ActionButton>
  );
}

export function ReopenButton({ readOnly }: { readOnly?: boolean }) {
  const ro = useReadOnly() || readOnly;
  return (
    <DsAction action={reopenRecommendation} variant="outline" size="sm" disabled={ro}>
      REOPEN
    </DsAction>
  );
}

/** ActionButton with the DS Button look. */
export function DsAction({ action, children, variant = "ink", size = "lg", full, disabled }: { action: Parameters<typeof ActionButton>[0]["action"]; children: React.ReactNode; variant?: ButtonVariant; size?: ButtonSize; full?: boolean; disabled?: boolean }) {
  const ro = useReadOnly() || disabled;
  const v = { ink: ds.ink, blue: ds.blue, outline: ds.outline, white: ds.white, "outline-light": ds.outlineLight }[variant];
  return (
    <ActionButton action={action} disabled={ro} className={[ds.btn, v, ds[size], full ? ds.full : ""].join(" ")}>
      {children}
    </ActionButton>
  );
}
