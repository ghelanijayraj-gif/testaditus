"use client";

import { Button } from "@/components/ds";

export function PrintButton({ label = "PRINT OR SAVE AS PDF" }: { label?: string }) {
  return (
    <Button variant="ink" size="sm" onClick={() => window.print()}>
      {label}
    </Button>
  );
}
