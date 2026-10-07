import type { Metadata } from "next";
import { requireClient } from "@/server/auth/guards";
import { getResults } from "@/server/client/results";
import { PlanScreen } from "@/components/client/plan/PlanScreen";
import { AssessmentView, type AssessmentParams } from "@/components/client/results/AssessmentView";

export const metadata: Metadata = { title: "Assessment" };
export const dynamic = "force-dynamic";

/**
 * 05 Assessment. Before the baseline report is released this is the Plan area's
 * assessment plan; afterwards Baseline · Reassessment · Compare (?mode=&sys=&m=&hist=).
 */
export default async function AssessmentPage({ searchParams }: { searchParams: Promise<AssessmentParams> }) {
  const { client } = await requireClient();
  const params = await searchParams;
  const data = await getResults(client.id);
  if (!data?.baseline) return <PlanScreen clientId={client.id} />;
  return <AssessmentView data={data} params={params} />;
}
