import type { ReactNode } from "react";
import Link from "next/link";
import { AditusMark } from "@/components/ds";
import { requireClient } from "@/server/auth/guards";
import { ToastProvider } from "@/components/ui/Toast";
import s from "@/components/client/results/results.module.css";

/** 04 focused chrome for the report release and walkthrough (no portal shell). */
export default async function RevealLayout({ children }: { children: ReactNode }) {
  await requireClient();
  return (
    <ToastProvider>
      <div style={{ minHeight: "100vh", fontFamily: "var(--font-mono)", color: "var(--ink)", display: "flex", flexDirection: "column", background: "#fff" }}>
        <header className={s.focusHeader}>
          <Link href="/" aria-label="ADITUS home" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--ink)" }}>
            <AditusMark size={26} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>ADITUS</span>
          </Link>
        </header>
        <main className={s.focusMain}>{children}</main>
      </div>
    </ToastProvider>
  );
}
