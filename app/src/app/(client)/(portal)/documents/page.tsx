import type { Metadata } from "next";
import { requireClient } from "@/server/auth/guards";
import { ToastProvider } from "@/components/ui/Toast";
import { DocumentsView } from "@/components/client/records/DocumentsView";
import type { DocFilters } from "@/server/client/records/documents";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<DocFilters> }) {
  const { client } = await requireClient();
  const filters = await searchParams;
  return (
    <ToastProvider>
      <DocumentsView clientId={client.id} filters={filters} />
    </ToastProvider>
  );
}
