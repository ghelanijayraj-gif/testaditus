import type { Metadata } from "next";
import { requireClient } from "@/server/auth/guards";
import { ToastProvider } from "@/components/ui/Toast";
import { ExportView } from "@/components/client/records/ExportView";

export const metadata: Metadata = { title: "Your export" };

export default async function ExportPage() {
  const { client } = await requireClient();
  return (
    <ToastProvider>
      <ExportView clientId={client.id} />
    </ToastProvider>
  );
}
