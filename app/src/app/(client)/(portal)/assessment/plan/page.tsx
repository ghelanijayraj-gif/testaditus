import type { Metadata } from "next";
import { requireClient } from "@/server/auth/guards";
import { PlanScreen } from "@/components/client/plan/PlanScreen";

export const metadata: Metadata = { title: "Assessment plan" };

export default async function Page() {
  const { client } = await requireClient();
  return <PlanScreen clientId={client.id} />;
}
