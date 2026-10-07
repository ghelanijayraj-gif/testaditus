import type { Metadata } from "next";
import { prisma } from "@/server/db";
import { canOnClient } from "@/server/auth/guards";
import { consoleCtx, openClient } from "@/server/consoles/access";
import { loadReview } from "@/server/consoles/data";
import { NoAccess, NotFound, TitleRow } from "@/components/staff/consoles/Bits";
import { ReviewScreen } from "@/components/staff/consoles/ReviewScreen";
import { EvaluationReport, type ReportMedia } from "@/components/evaluation/EvaluationReport";
import { EvalReviewActions } from "@/components/evaluation/EvalReviewActions";
import { REPORT, hasEvaluation, readEvaluation } from "@/config/evaluation";
import { clientMedia } from "@/server/consoles/data";
import s from "@/components/staff/consoles/consoles.module.css";

export const metadata: Metadata = { title: "Report review" };

/** 10.10 Head coach review: measures, priorities, media, flags, report preview; approve, return, edit. */
export default async function ReviewPage({ params, searchParams }: { params: Promise<{ reportId: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { reportId } = await params;
  const sp = await searchParams;
  const ctx = await consoleCtx();
  const head = await prisma.report.findUnique({ where: { id: reportId }, include: { client: true, author: { include: { user: true } }, comments: { include: { author: { include: { user: true } } }, orderBy: { createdAt: "desc" } } } });
  if (!head) return <NotFound what="This report does not exist." />;
  if (!(await openClient(ctx, head.clientId, { type: "report", id: reportId, name: "Report draft, measures and media" }))) return <NoAccess />;
  // Reports built from a coach evaluation of photos and videos.
  if (hasEvaluation(head.evaluation)) {
    const canAct = ctx.canApprove && (await canOnClient(ctx, "reports.approve", head.clientId));
    const media: ReportMedia = Object.fromEntries((await clientMedia(head.clientId)).map((m) => [m.id, { src: m.src, kind: m.kind, label: m.label, view: m.view }]));
    const name = `${head.client.firstName} ${head.client.lastName}`;
    const author = head.author?.user.name ?? "the coach";
    const ret = head.comments.find((c) => c.action === "RETURNED");
    const line = head.status === "RELEASED" ? `${head.client.firstName} has the report` : head.status === "RETURNED" ? `Returned to ${author}${ret ? ": “" + ret.body + "”" : ""}` : head.status === "PENDING_APPROVAL" ? `Submitted by ${author}` : "Draft · not submitted yet";
    return (
      <main className={s.main}>
        <TitleRow ctx={`Head coach · ${name} · evaluation by ${author}`} title={`${name}.`} />
        <EvalReviewActions reportId={head.id} clientId={head.clientId} status={head.status} canAct={canAct} line={line} />
        <div style={{ maxWidth: 920 }}>
          <EvaluationReport data={readEvaluation(head.evaluation)} media={media} internal head={{ kicker: `${REPORT.title} · ${author}`, title: name }} />
        </div>
      </main>
    );
  }
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
