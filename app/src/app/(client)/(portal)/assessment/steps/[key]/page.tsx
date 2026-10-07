import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { requireClient } from "@/server/auth/guards";
import { timeLabel } from "@/lib/format";
import { TYPE_LABEL } from "@/lib/assessment/plan";
import { byLine, isCustom } from "@/lib/assessment/next";
import { findModule } from "@/server/client/plan/common";
import { ToastProvider } from "@/components/ui/Toast";
import { ModuleForm, type FieldDef } from "@/components/client/plan/ModuleForm";

export const metadata: Metadata = { title: "Assessment step" };

/** 06 F. Module screen rendered from the module's template fields. */
export default async function ModulePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const { client } = await requireClient();
  if (key === "intake") redirect("/intake");
  const mod = await findModule(client.id, key);
  if (!mod) notFound();
  if (mod.type === "IN_PERSON") redirect("/assessment/in-person");
  const practitioner = client.primaryPractitionerId ? (await prisma.staffProfile.findUnique({ where: { id: client.primaryPractitionerId }, include: { user: true } }))?.user.name ?? "Jayraj" : "Jayraj";
  const fields = ((mod.template?.fields as FieldDef[]) ?? []).filter((f) => f && f.key && f.type);
  const data = (mod.data as { values?: Record<string, unknown>; savedAt?: string }) ?? {};
  const locked = !["NOT_STARTED", "IN_PROGRESS", "MORE_NEEDED"].includes(mod.status);
  return (
    <ToastProvider bottom={96}>
      <ModuleForm
        moduleKey={mod.key}
        name={mod.name}
        purpose={mod.purpose ?? ""}
        typeLabel={TYPE_LABEL[mod.type]}
        time={mod.timeEstimate ?? "XX min"}
        by={isCustom(mod) && mod.note ? byLine(mod, practitioner) : null}
        note={mod.note && isCustom(mod) ? mod.note : null}
        safety={mod.template?.safetyNote ?? null}
        instructions={mod.template?.instructions ?? null}
        fields={fields}
        initial={data.values ?? {}}
        savedAt={data.savedAt ? timeLabel(new Date(data.savedAt)) : null}
        locked={locked}
        practitioner={practitioner}
      />
    </ToastProvider>
  );
}
