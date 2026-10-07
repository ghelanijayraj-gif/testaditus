import type { Metadata } from "next";
import { requireClient } from "@/server/auth/guards";
import { ToastProvider } from "@/components/ui/Toast";
import { HealthView } from "@/components/client/records/HealthView";

export const metadata: Metadata = { title: "Health data" };

export default async function HealthPage({ searchParams }: { searchParams: Promise<{ sys?: string; metric?: string; range?: string }> }) {
  const { client } = await requireClient();
  const sp = await searchParams;
  return (
    <ToastProvider>
      <HealthView clientId={client.id} {...sp} />
    </ToastProvider>
  );
}
