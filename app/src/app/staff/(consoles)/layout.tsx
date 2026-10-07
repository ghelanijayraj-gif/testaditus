import type { Metadata } from "next";
import { Suspense } from "react";
import { consoleCtx } from "@/server/consoles/access";
import { ConsoleHeader } from "@/components/staff/consoles/Header";
import { ConsoleToast } from "@/components/staff/consoles/ui";
import s from "@/components/staff/consoles/consoles.module.css";

export const metadata: Metadata = { title: { default: "Consoles · ADITUS Staff", template: "%s · ADITUS Staff" }, robots: { index: false } };

/** Practitioner console, head coach review and photo review: tablet first, own staff header. */
export default async function ConsolesLayout({ children }: { children: React.ReactNode }) {
  const ctx = await consoleCtx();
  return (
    <ConsoleToast>
      <div className={s.root}>
        <Suspense>
          <ConsoleHeader canApprove={ctx.canApprove} allowed={ctx.allowed} />
        </Suspense>
        {children}
      </div>
    </ConsoleToast>
  );
}
