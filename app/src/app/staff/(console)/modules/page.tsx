import { ModulesView } from "@/components/staff/admin/ModulesView";
import { requireStaff } from "@/server/auth/guards";

export const metadata = { title: "Modules" };

export default async function Modules({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const ctx = await requireStaff({ section: "modules" });
  return <ModulesView ctx={ctx} status={(await searchParams).status} />;
}
