import { PageHead } from "@/components/staff/Page";
import { requireStaff } from "@/server/auth/guards";

// Placeholder; the Admin Console area replaces this with Today.
export default async function Today() {
  const ctx = await requireStaff();
  return <PageHead kicker={ctx.name} title="Today" />;
}
