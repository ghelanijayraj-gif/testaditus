"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * Phone: swipe left or right on the system body to move between the four systems,
 * and keep the active tab scrolled into view in the tab strip.
 */
export function SystemSwipe({ prev, next, tabsId, children }: { prev: string | null; next: string | null; tabsId: string; children: ReactNode }) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const strip = document.getElementById(tabsId);
    const on = strip?.querySelector<HTMLElement>("[aria-current='page']");
    if (strip && on) strip.scrollTo({ left: on.offsetLeft - 16, behavior: "smooth" });
  }, [tabsId, prev, next]);
  return (
    <div
      onTouchStart={(e) => {
        const t = e.touches[0];
        start.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const s0 = start.current;
        start.current = null;
        if (!s0 || window.innerWidth >= 760) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s0.x,
          dy = t.clientY - s0.y;
        if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
        const to = dx < 0 ? next : prev;
        if (to) router.push(to, { scroll: false });
      }}
    >
      {children}
    </div>
  );
}
