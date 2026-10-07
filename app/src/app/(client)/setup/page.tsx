import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { requireClient } from "@/server/auth/guards";
import { AccessShell, type AccessScreen } from "@/components/client/access/AccessShell";
import { StepDetails, StepDocuments, StepPreferences, StepSecurity } from "@/components/client/access/SetupSteps";
import { SETUP_CONSENTS } from "@/server/onboarding/consents";
import { mobileLocal } from "@/server/onboarding/provisionCore";
import { DOC_TYPE_LABEL } from "@/server/onboarding/upload";
import { dateLong } from "@/lib/format";
import { completeSetup, saveDetails, savePreferences, saveSecurity } from "./actions";

export const metadata: Metadata = { title: "Account setup", robots: { index: false } };

const BACK: Record<number, { href: string; label: string } | undefined> = {
  2: { href: "/setup?step=1", label: "Details" },
  3: { href: "/setup?step=2", label: "Security" },
  4: { href: "/setup?step=3", label: "Preferences" },
};

/** Account setup 1 to 4 (01). Resumes at ClientProfile.setupStep; earlier steps can be revisited. */
export default async function SetupPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const { client, user } = await requireClient();
  if (client.accountSetupDone) redirect("/");
  const asked = Number((await searchParams).step) || client.setupStep;
  const step = Math.min(Math.max(1, asked), Math.max(1, Math.min(4, client.setupStep)));
  const order = await prisma.order.findFirst({ where: { clientId: client.id }, orderBy: { placedAt: "asc" } });
  const screen = `setup${step}` as AccessScreen;
  const name = `${client.firstName} ${client.lastName}`.trim();

  let body: React.ReactNode = null;
  if (step === 1) {
    body = (
      <StepDetails
        action={saveDetails}
        init={{
          name,
          email: user.email,
          mobile: mobileLocal(client.mobile),
          dob: client.dateOfBirth ? client.dateOfBirth.toISOString().slice(0, 10) : "",
          ecName: client.emergencyName ?? "",
          ecPhone: client.emergencyPhone ?? "",
          city: client.city ?? "",
          pin: client.pin ?? "",
          cityFromOrder: !!(order && (client.city || client.pin)),
        }}
      />
    );
  } else if (step === 2) {
    body = <StepSecurity action={saveSecurity} initial={user.signInMethod === "PASSWORD" ? "password" : "link"} />;
  } else if (step === 3) {
    const [centres, consents] = await Promise.all([prisma.centre.findMany({ orderBy: { name: "asc" } }), prisma.consent.findMany({ where: { clientId: client.id, granted: true } })]);
    const ordered = ["tic-kandivali", "samyah-borivali"].map((slug) => centres.find((c) => c.slug === slug)).filter((c) => !!c);
    body = (
      <StepPreferences
        action={savePreferences}
        mobile={mobileLocal(client.mobile)}
        centres={ordered.map((c) => ({ slug: c.slug, name: c.name, desc: `${c.area.split(",").pop()?.trim()} · ${c.hoursLabel ?? ""}` }))}
        consents={SETUP_CONSENTS}
        init={{
          // Nothing is ticked for the client: only what they chose before (when revisiting this step).
          centre: client.setupStep > 3 ? (centres.find((c) => c.id === client.preferredCentreId)?.slug ?? "") : "",
          wa: client.setupStep > 3 ? client.whatsappUpdates : false,
          given: consents.map((c) => c.kind).filter((k) => SETUP_CONSENTS.some((x) => x.kind === k)),
        }}
      />
    );
  } else {
    const docs = await prisma.document.findMany({ where: { clientId: client.id, source: "CLIENT", status: "READY" }, orderBy: { createdAt: "asc" } });
    body = <StepDocuments finish={completeSetup} initial={docs.map((d) => ({ id: d.id, name: d.filename, typeLabel: DOC_TYPE_LABEL[d.type] ?? "Document", date: dateLong(d.testDate ?? d.createdAt) }))} />;
  }

  return (
    <AccessShell screen={screen} first={client.firstName} back={BACK[step]} right={`Secure setup · ${user.email}`}>
      {body}
    </AccessShell>
  );
}
