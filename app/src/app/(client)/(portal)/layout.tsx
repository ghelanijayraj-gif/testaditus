import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireClient } from "@/server/auth/guards";
import { ClientShell } from "@/components/client/shell/ClientShell";
import { now } from "@/lib/clock";

/** Every portal page renders inside the 05 shell. Setup unfinished → /setup (Access). Access ended → /ended (Records). */
export default async function PortalLayout({ children }: { children: ReactNode }) {
  const { client } = await requireClient();
  if (!client.accountSetupDone) redirect("/setup");
  if (client.accessEndsAt && client.accessEndsAt < now()) redirect("/ended");
  return <ClientShell clientId={client.id}>{children}</ClientShell>;
}
