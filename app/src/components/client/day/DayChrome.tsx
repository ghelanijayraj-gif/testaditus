import Link from "next/link";
import type { ReactNode } from "react";
import { AditusMark } from "@/components/ds";
import { DayToastProvider } from "./DayToast";
import s from "./day.module.css";

/** Minimal focused flow chrome (04 §4.2): mark + wordmark, one optional action at the right. */
export function DayChrome({ action, wide, banner, children }: { action?: ReactNode; wide?: boolean; banner?: ReactNode; children: ReactNode }) {
  return (
    <DayToastProvider>
      <div className={s.root}>
        <header className={s.header}>
          <Link href="/" className={s.brand} aria-label="ADITUS home">
            <AditusMark size={26} />
            <span className={s.brandWord}>ADITUS</span>
          </Link>
          {action}
        </header>
        {banner}
        <main className={`${s.main} ${wide ? s.mainWide : ""}`}>{children}</main>
      </div>
    </DayToastProvider>
  );
}
