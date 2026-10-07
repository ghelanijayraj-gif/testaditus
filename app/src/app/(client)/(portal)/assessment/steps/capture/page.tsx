import type { Metadata } from "next";
import Link from "next/link";
import { requireClient } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { dayLabel } from "@/lib/format";
import { getCaptureView } from "@/server/client/plan/captureView";
import { ToastProvider } from "@/components/ui/Toast";
import { CaptureWizard } from "@/components/client/plan/CaptureWizard";
import { LinkButton } from "@/components/client/plan/clientParts";
import s from "@/components/client/plan/plan.module.css";

export const metadata: Metadata = { title: "Online Capture" };

/** Online Capture module: the 02 wizard (photos, movement videos, self tests, review, submit). */
export default async function CapturePage() {
  const { client } = await requireClient();
  const v = await getCaptureView(client.id);
  if (!v) return null;
  if (v.status === "SUBMITTED" || v.status === "DONE" || v.status === "SKIPPED_BY_PRACTITIONER") {
    const mod = await prisma.planModule.findFirst({ where: { plan: { clientId: client.id, kind: "BASELINE" }, key: "capture" }, orderBy: { updatedAt: "desc" } });
    return (
      <main className={s.main} style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}>
        <Link href="/assessment/plan" className={s.textBtn}>
          ← Assessment plan
        </Link>
        <span className={s.kicker}>Online Capture</span>
        <h1 className={s.h1} style={{ fontSize: "clamp(28px,5vw,44px)" }}>
          All sent.
        </h1>
        <span className={s.lead}>
          {v.status === "SKIPPED_BY_PRACTITIONER"
            ? `${v.practitioner} skipped this step. Nothing to do here.`
            : `${mod?.submittedAt ? `Submitted ${dayLabel(mod.submittedAt)}. ` : ""}${v.practitioner} is reviewing it. If a photo needs redoing, we will tell you exactly which one.`}
        </span>
        <div>
          <LinkButton href="/assessment/plan">SEE YOUR PLAN →</LinkButton>
        </div>
      </main>
    );
  }
  return (
    <ToastProvider bottom={96}>
      <CaptureWizard key={`${v.status}-${v.consentOff}`} init={v} />
    </ToastProvider>
  );
}
