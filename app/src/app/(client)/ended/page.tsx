import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireClient } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";
import { AditusMark } from "@/components/ds";
import { ToastProvider } from "@/components/ui/Toast";
import { ActBtn } from "@/components/client/records/ui";
import { dateLong } from "@/components/client/records/fmt";
import { exportAgain, startCheckout } from "@/server/client/records/actions";
import s from "@/components/client/records/records.module.css";

export const metadata: Metadata = { title: "Access ended" };

/** Full screen Access ended (05 §2.11). Only for clients whose access end date has passed. */
export default async function EndedPage() {
  const { client } = await requireClient();
  if (!client.accessEndsAt || client.accessEndsAt.getTime() > now().getTime()) redirect("/");
  const last = await prisma.clientPlan.findFirst({ where: { clientId: client.id }, include: { product: true }, orderBy: { startsAt: "desc" } });
  const slug = last?.product.slug ?? "pt-12";
  return (
    <ToastProvider>
      <div className={s.ended}>
        <div className={s.endedSide}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AditusMark size={32} color="#FFFFFF" muted="#475467" />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>ADITUS</span>
          </div>
          <div style={{ margin: "0 -80px -120px auto" }}>
            <AditusMark size={320} color="#475467" muted="#1F3777" />
          </div>
        </div>
        <main className={s.endedMain}>
          <span className={s.kicker}>
            {client.firstName} {client.lastName} · ID {client.code}
          </span>
          <h1 className={s.h1} style={{ fontSize: "clamp(32px,4.6vw,60px)" }}>
            Your ADITUS access has ended.
          </h1>
          <p style={{ margin: 0, font: "400 18px/1.45 var(--font-sans)" }}>
            {client.exportedAt ? `Your reports were exported on ${dateLong(client.exportedAt)}. The download link in your email still works.` : "Your reports are ready to export. We email you the download link."}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <ActBtn action={startCheckout.bind(null, slug, "renewal")} variant="blue" size="lg">
              REACTIVATE →
            </ActBtn>
            <ActBtn action={exportAgain} variant="outline" size="lg">
              EXPORT AGAIN
            </ActBtn>
          </div>
          <span style={{ font: "400 14px/1.5 var(--font-sans)", color: "var(--grey-700)", borderTop: "1px solid var(--grey-200)", paddingTop: 14 }}>
            We keep your records for the period the law requires, then delete them. To delete them sooner, write to privacy@aditus.in or WhatsApp +91 98200 41700.
          </span>
        </main>
      </div>
    </ToastProvider>
  );
}
