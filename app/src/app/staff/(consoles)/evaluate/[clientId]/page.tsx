import type { Metadata } from "next";
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
  if (!(await openClient(ctx, clientId, { type: "evaluation", id: clientId, name: "Evaluation, photos and videos" }))) return <NoAccess />;
  const d = await loadEvaluation(ctx, clientId);
  if (!d) return <NotFound what="This client does not exist." />;
  return (
    <main className={s.main}>
      <TitleRow ctx={`Evaluation · ${d.client.city} · ${d.media.length} uploads`} title={`${d.client.name}.`} />
      <EvaluateScreen d={d} />
    </main>
  );
}
