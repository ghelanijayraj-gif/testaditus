import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireClient } from "@/server/auth/guards";
import { getReport, getResults } from "@/server/client/results";
import { ReportView } from "@/components/client/results/ReportView";
import { PrintOnLoad } from "@/components/client/results/ClientEffects";

export const metadata: Metadata = { title: "Report PDF" };
export const dynamic = "force-dynamic";

/** Print optimised report: opens the print dialog (Save as PDF). Only the report is printed, not the portal chrome. */
export default async function ReportPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client } = await requireClient();
  const [report, data] = await Promise.all([getReport(client.id, id), getResults(client.id)]);
  if (!report || !data) notFound();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <style>{`@media print {
  @page { margin: 14mm; }
  body * { visibility: hidden !important; }
  #report-print, #report-print * { visibility: visible !important; }
  #report-print { position: absolute; left: 0; top: 0; width: 100%; max-width: none; }
  [data-noprint] { display: none !important; }
  #report-print > div { break-inside: avoid; }
}`}</style>
      <PrintOnLoad />
      <ReportView data={data} report={report} print />
    </div>
  );
}
