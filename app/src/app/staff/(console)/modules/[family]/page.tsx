import { notFound } from "next/navigation";
import { ModulesView } from "@/components/staff/admin/ModulesView";
import { requireStaff } from "@/server/auth/guards";
import { prisma } from "@/server/db";

export const metadata = { title: "Modules" };

export default async function ModuleFamily({ params, searchParams }: { params: Promise<{ family: string }>; searchParams: Promise<{ status?: string }> }) {
  const ctx = await requireStaff({ section: "modules" });
  const { family } = await params;
  if (!(await prisma.moduleTemplate.count({ where: { family } }))) notFound();
  return <ModulesView ctx={ctx} family={family} status={(await searchParams).status} />;
}
