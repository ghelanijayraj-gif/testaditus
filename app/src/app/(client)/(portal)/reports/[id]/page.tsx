import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireClient } from "@/server/auth/guards";
import { getReport, getResults } from "@/server/client/results";
import { ReportView } from "@/components/client/results/ReportView";
import { MarkReportStep } from "@/components/client/results/ClientEffects";

export const metadata: Metadata = { title: "Report" };
export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client } = await requireClient();
  const [report, data] = await Promise.all([getReport(client.id, id), getResults(client.id)]);
  if (!report || !data) notFound();
  return (
    <>
      <MarkReportStep reportId={report.id} step={0} />
      <ReportView data={data} report={report} />
    </>
  );
}
