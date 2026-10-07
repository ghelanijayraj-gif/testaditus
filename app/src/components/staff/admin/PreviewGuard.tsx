"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * Preview as client is view only: scrolling works, but clicks, form submits and
 * key presses inside the client UI never reach it. Escape closes the preview.
 */
export function PreviewGuard({ closeHref, children }: { closeHref: string; children: ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && router.push(closeHref);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [router, closeHref]);
  const stop = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  return (
    <div onClickCapture={stop} onSubmitCapture={stop} onKeyDownCapture={(e) => e.key !== "Escape" && e.key !== "Tab" && stop(e)}>
      {children}
    </div>
  );
}
