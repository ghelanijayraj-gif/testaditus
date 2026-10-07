import type { Metadata } from "next";
import { requireClient } from "@/server/auth/guards";
import { ToastProvider } from "@/components/ui/Toast";
import { PlanView } from "@/components/client/records/PlanView";

export const metadata: Metadata = { title: "My plan" };

export default async function MyPlanPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { client } = await requireClient();
  const { tab } = await searchParams;
  return (
    <ToastProvider>
      <PlanView clientId={client.id} tab={tab} />
    </ToastProvider>
  );
}
