import type { Metadata } from "next";
import { prisma } from "@/server/db";
import { consoleCtx, openClient } from "@/server/consoles/access";
import { loadEvaluation } from "@/server/evaluation/data";
import { NoAccess, NotFound, TitleRow } from "@/components/staff/consoles/Bits";
import { EvaluateScreen } from "@/components/evaluation/EvaluateScreen";
import s from "@/components/staff/consoles/consoles.module.css";

export const metadata: Metadata = { title: "Evaluate" };

/** Coach evaluation of a client's uploaded photos and videos; the report is built from it. */
export default async function EvaluatePage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const ctx = await consoleCtx();
  if (!ctx.allowed) return <NoAccess />;
  // Coaches: say plainly when this evaluation is someone else's (before the scope check logs a denial).
  if (!ctx.canApprove) {
    const r = await prisma.report.findFirst({ where: { clientId, status: { not: "RELEASED" } }, orderBy: { createdAt: "desc" }, include: { assignedTo: { include: { user: true } }, client: true } });
    const to = r?.assignedToId ?? r?.authorId;
    if (!r || to !== ctx.staff.id) {
      const name = r ? `${r.client.firstName}’s` : "This";
      return <NotFound what={r?.assignedTo ? `${name} evaluation is assigned to ${r.assignedTo.user.name}. Ask the head coach if it should be yours.` : `${name} evaluation is not assigned to you. The head coach assigns evaluations.`} />;
    }
  }
  if (!(await openClient(ctx, clientId, { type: "evaluation", id: clientId, name: "Evaluation, photos and videos" }))) return <NoAccess />;
  const d = await loadEvaluation(ctx, clientId);
  if (!d) return <NotFound what="This client does not exist." />;
  if (d.blocked)
    return <NotFound what={d.assigneeId ? `${d.client.name}’s evaluation is assigned to ${d.author ?? "another coach"}.` : `${d.client.name}’s evaluation has not been assigned yet. The head coach assigns it.`} />;
  return (
    <main className={s.main}>
      <TitleRow ctx={[`Evaluation`, d.client.city, d.author ? `Assigned to ${d.author}` : "Not assigned"].filter(Boolean).join(" · ")} title={`${d.client.name}.`} />
      <EvaluateScreen d={d} />
    </main>
  );
}
