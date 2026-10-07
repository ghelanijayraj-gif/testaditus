"use client";

import { Button, type ButtonVariant } from "@/components/ds";
import { useToast } from "@/components/ui/Toast";

/** A design system button whose only job is an explanatory toast (view only notices). */
export function ToastButton({ msg, variant = "outline", children }: { msg: string; variant?: ButtonVariant; children: React.ReactNode }) {
  const toast = useToast();
  return (
    <Button variant={variant} size="sm" onClick={() => toast(msg)}>
      {children}
    </Button>
  );
}
