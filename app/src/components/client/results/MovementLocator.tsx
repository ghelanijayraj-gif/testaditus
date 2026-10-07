"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BodyMap } from "@/components/shared/BodyMap";
import s from "./results.module.css";

/**
 * 05 Movement locator: pale body outline, the selected measure's regions in blue,
 * front/back flip. Clicking a region selects the first measure that covers it.
 */
export function MovementLocator({ view, selected, items }: { view: "front" | "back"; selected: string[]; items: { key: string; groups: string[]; href: string }[] }) {
  const [v, setV] = useState(view);
  const router = useRouter();
  return (
    <div style={{ position: "relative", background: "var(--grey-50)", padding: "40px 12px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <span style={{ position: "absolute", top: 12, left: 14, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--grey-600)" }}>Locator · {v === "front" ? "Front" : "Back"}</span>
      <div className={s.bodyBox}>
        <BodyMap
          view={v}
          selected={selected}
          ariaLabel={`Body, ${v} view. Highlighted regions belong to the selected measure.`}
          onPick={(k) => {
            const hit = items.find((m) => m.groups.includes(k));
            if (hit) router.push(hit.href, { scroll: false });
          }}
        />
      </div>
      <button type="button" className={s.flip} onClick={() => setV(v === "front" ? "back" : "front")}>
        Flip to {v === "front" ? "back" : "front"}
      </button>
    </div>
  );
}
