import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireClient } from "@/server/auth/guards";
import { loadIntake } from "@/server/onboarding/intake";
import { IntakeFlow } from "@/components/client/intake/IntakeFlow";
import * as actions from "./actions";

export const metadata: Metadata = { title: "Intake", robots: { index: false } };

/**
 * 03 Intake: a focused flow outside the portal shell, one section per screen. Resumes at
 * ClientProfile.intakeStep; `?step=` reopens an earlier step (e.g. Home's "Try again" → Injuries).
 */
export default async function IntakePage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const { client } = await requireClient();
  if (!client.accountSetupDone) redirect("/setup");
  const data = await loadIntake(client.id);
  const asked = Number((await searchParams).step);
  const max = data.done ? 12 : data.step;
  const step = Number.isInteger(asked) && asked >= 0 && asked <= max ? asked : data.step;
  return (
    <IntakeFlow
      data={data}
      initialStep={step}
      actions={{
        saveChips: actions.saveChips,
        saveText: actions.saveText,
        goToStep: actions.goToStep,
        toggleConcern: actions.toggleConcern,
        updateConcern: actions.updateConcern,
        saveInjury: actions.saveInjury,
        reportUploadFailed: actions.reportUploadFailed,
        answerSafety: actions.answerSafety,
        setAgreement: actions.setAgreement,
        completeIntake: actions.completeIntake,
      }}
    />
  );
}
