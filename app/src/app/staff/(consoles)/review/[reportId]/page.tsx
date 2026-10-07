import type { Metadata } from "next";
import { prisma } from "@/server/db";
import { canOnClient } from "@/server/auth/guards";
import { consoleCtx, openClient } from "@/server/consoles/access";
import { loadReview } from "@/server/consoles/data";
import { NoAccess, NotFound, TitleRow } from "@/components/staff/consoles/Bits";
import { ReviewScreen } from "@/components/staff/consoles/ReviewScreen";
import s from "@/components/staff/consoles/consoles.module.css";

export const metadata: Metadata = { title: "Report review" };

/** 10.10 Head coach review: measures, priorities, media, flags, report preview; approve, return, edit. */
export default async function ReviewPage({ params, searchParams }: { params: Promise<{ reportId: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { reportId } = await params;
  const sp = await searchParams;
  const ctx = await consoleCtx();
  const head = await prisma.report.findUnique({ where: { id: reportId }, select: { clientId: true } });
  if (!head) return <NotFound what="This report does not exist." />;
  if (!(await openClient(ctx, head.clientId, { type: "report", id: reportId, name: "Report draft, measures and media" }))) return <NoAccess />;
  const d = await loadReview(reportId);
  if (!d) return <NotFound what="This report does not exist." />;
  const canAct = ctx.canApprove && (await canOnClient(ctx, "reports.approve", d.client.id));
  const edit = sp.edit === "1" && canAct && d.report.status !== "RELEASED";
  return (
    <main className={s.main}>
      <TitleRow ctx={`Head coach · ${d.client.name} · submitted by ${d.author}`} title={`${d.client.name}.`} />
      <ReviewScreen d={d} canAct={canAct} edit={edit} me={ctx.name} />
    </main>
  );
}
