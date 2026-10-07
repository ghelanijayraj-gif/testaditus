import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { requireClient } from "@/server/auth/guards";
import { Button } from "@/components/ds";
import { AccessShell } from "@/components/client/access/AccessShell";
import { DoneCountdown } from "@/components/client/access/SetupSteps";
import { SETUP_CONSENTS } from "@/server/onboarding/consents";
import s from "@/components/client/access/access.module.css";

export const metadata: Metadata = { title: "You're in", robots: { index: false } };

/** Setup done: summary, then Welcome (owned by the Plan area) after 5 seconds. */
export default async function SetupDone() {
  const { client, user } = await requireClient();
  if (!client.accountSetupDone) redirect("/setup");
  const [centre, consents, docs] = await Promise.all([
    client.preferredCentreId ? prisma.centre.findUnique({ where: { id: client.preferredCentreId } }) : null,
    prisma.consent.count({ where: { clientId: client.id, granted: true, kind: { in: SETUP_CONSENTS.map((c) => c.kind) } } }),
    prisma.document.count({ where: { clientId: client.id, source: "CLIENT", status: "READY" } }),
  ]);
  const rows: [string, string][] = [
    ["Name", `${client.firstName} ${client.lastName}`.trim()],
    ["Sign in", user.signInMethod === "PASSWORD" ? "Password" : "Email link"],
    ["Centre", centre?.name ?? "Not chosen"],
    ["WhatsApp updates", client.whatsappUpdates ? "On" : "Off"],
    ["Consents given", `${consents} of ${SETUP_CONSENTS.length}`],
    ["Documents added", String(docs)],
  ];
  return (
    <AccessShell screen="done" first={client.firstName}>
      <div className={s.ruled}>
        {rows.map(([k, v]) => (
          <div key={k} className={s.sumRow}>
            <span className={s.sumKey}>{k}</span>
            <span className={s.sumVal}>{v}</span>
          </div>
        ))}
      </div>
      <Button href="/welcome" variant="ink" size="lg" full>GO TO MY PROFILE →</Button>
      <DoneCountdown to="/welcome" />
    </AccessShell>
  );
}
