import "server-only";
import { prisma } from "@/server/db";
import { clientMedia, whenLabel } from "@/server/consoles/data";
import type { ConsoleCtx } from "@/server/consoles/access";
import { readEvaluation } from "@/config/evaluation";

export type EvalMedia = { id: string; kind: "PHOTO" | "VIDEO"; view: string; label: string; src: string | null; capturedAt: string };

/** The report a coach evaluates for a client: the latest unreleased one, else the latest released (read only). */
export async function evaluationReport(clientId: string) {
  return (
    (await prisma.report.findFirst({ where: { clientId, status: { not: "RELEASED" } }, orderBy: { createdAt: "desc" } })) ??
    (await prisma.report.findFirst({ where: { clientId }, orderBy: { createdAt: "desc" } }))
  );
}

export async function loadEvaluation(ctx: ConsoleCtx, clientId: string) {
  const client = await prisma.clientProfile.findUnique({ where: { id: clientId }, include: { safetyFlags: true } });
  if (!client) return null;
  const r = await evaluationReport(clientId);
  const [media, comments, author] = await Promise.all([
    clientMedia(clientId),
    r ? prisma.reviewComment.findMany({ where: { reportId: r.id }, include: { author: { include: { user: true } } }, orderBy: { createdAt: "desc" } }) : [],
    r?.authorId ? prisma.staffProfile.findUnique({ where: { id: r.authorId }, include: { user: true } }) : null,
  ]);
  const status = r?.status ?? "DRAFT";
  const canEdit = status === "DRAFT" || status === "RETURNED" || (status === "PENDING_APPROVAL" && ctx.canApprove);
  return {
    client: { id: client.id, first: client.firstName, name: `${client.firstName} ${client.lastName}`, city: client.city ?? "" },
    flags: client.safetyFlags.map((f) => [f.item, f.note].filter(Boolean).join(". ")),
    report: r ? { id: r.id, status: r.status, submittedAt: r.submittedAt ? whenLabel(r.submittedAt) : null, releasedAt: r.releasedAt ? whenLabel(r.releasedAt) : null } : null,
    evaluation: readEvaluation(r?.evaluation),
    author: author?.user.name ?? null,
    comments: comments.map((c) => ({ id: c.id, action: c.action, body: c.body, by: c.author.user.name ?? "", when: whenLabel(c.createdAt) })),
    media: media.map((m): EvalMedia => ({ id: m.id, kind: m.kind, view: m.view, label: m.label, src: m.src, capturedAt: whenLabel(m.capturedAt) })),
    canEdit,
    canApprove: ctx.canApprove,
  };
}
export type EvaluationScreenData = NonNullable<Awaited<ReturnType<typeof loadEvaluation>>>;
