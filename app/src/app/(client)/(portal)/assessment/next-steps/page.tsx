import type { Metadata } from "next";
import { requireClient } from "@/server/auth/guards";
import { NextSteps } from "@/components/client/plan/NextSteps";
import s from "@/components/client/plan/plan.module.css";

export const metadata: Metadata = { title: "Recommended next steps" };

export default async function Page() {
  const { client } = await requireClient();
  return (
    <main className={s.main} style={{ maxWidth: 1080 }}>
      <NextSteps clientId={client.id} />
    </main>
  );
}
