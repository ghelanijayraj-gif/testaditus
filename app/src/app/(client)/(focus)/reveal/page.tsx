import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ds";
import { requireClient } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { dDay } from "@/lib/measures";
import { timeLabel } from "@/lib/format";
import { latestBaselineReportId } from "@/server/client/results";

export const metadata: Metadata = { title: "Your report is ready" };
export const dynamic = "force-dynamic";

/** 04 "released": the report is ready, walk me through it, and what was also sent. */
export default async function RevealPage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { client } = await requireClient();
  const { r } = await searchParams;
  const id = r ?? (await latestBaselineReportId(client.id));
  const report = id ? await prisma.report.findFirst({ where: { id, clientId: client.id, status: "RELEASED" }, include: { author: { include: { user: true } }, approver: true } }) : null;
  if (!report) redirect("/");
  const who = report.author?.user.name ?? "Jayraj";
  const sent = await prisma.outboxMessage.findMany({ where: { clientId: client.id, template: "report_ready", channel: { in: ["WHATSAPP", "EMAIL"] } }, orderBy: { createdAt: "desc" } });
  const wa = sent.find((m) => m.channel === "WHATSAPP");
  const em = sent.find((m) => m.channel === "EMAIL");
  const at = report.releasedAt ?? report.createdAt;
  return (
    <>
      <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--grey-600)" }}>
        Hi {client.firstName} · Report released · {dDay(at)}
      </span>
      <div style={{ background: "var(--blue)", color: "#fff", padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ice)" }}>Your next step</span>
        <h1 style={{ margin: 0, fontWeight: 400, fontFamily: "var(--font-display)", fontSize: "clamp(28px,5vw,40px)", lineHeight: 0.92, textTransform: "uppercase" }}>Your report is ready.</h1>
        <span style={{ font: "400 16px/1.45 var(--font-sans)" }}>
          Reviewed by {who}
          {report.approverId ? " and approved by the head coach" : ""}. Six short screens, about 3 minutes.
        </span>
        <Button variant="white" size="lg" full href={`/reveal/walkthrough?r=${report.id}&step=1`}>
          WALK ME THROUGH IT →
        </Button>
      </div>
      {(wa || em) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--grey-600)" }}>Also sent to you</span>
          {wa && (
            <div style={{ alignSelf: "flex-start", maxWidth: 420, border: "1px solid var(--grey-300)", background: "var(--mist)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--grey-600)" }}>WhatsApp · {timeLabel(wa.createdAt)}</span>
              <span style={{ font: "400 15px/1.45 var(--font-sans)", whiteSpace: "pre-line" }}>{wa.body}</span>
            </div>
          )}
          {em && (
            <div style={{ border: "2px solid var(--ink)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--grey-600)" }}>Email · {timeLabel(em.createdAt)}</span>
              <b style={{ font: "600 15px var(--font-sans)" }}>{em.subject ?? "Your report is ready"}</b>
              <span style={{ font: "400 14px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>Your starting point, what matters most, and your recommended path.</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
