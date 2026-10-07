import Link from "next/link";
import { AditusMark } from "@/components/ds";

/** 06 client header for pages outside the portal shell (Welcome, checkout). */
export function PlanHeader({ name, city, home = "/" }: { name?: string; city?: string; home?: string }) {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,.97)", borderBottom: "2px solid var(--ink)", height: 60, display: "flex", alignItems: "center", gap: 14, padding: "0 clamp(14px,3vw,32px)" }}>
      <Link href={home} aria-label="ADITUS home" style={{ display: "flex", alignItems: "center", gap: 8, flex: "none", textDecoration: "none", color: "var(--ink)" }}>
        <AditusMark size={26} />
        <span style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>ADITUS</span>
      </Link>
      {name && (
        <span style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
          <b style={{ font: "600 14px var(--font-sans)" }}>{name}</b>
          {city && <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--grey-600)" }}>{city}</span>}
        </span>
      )}
    </header>
  );
}
