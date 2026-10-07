import Link from "next/link";
import { notFound } from "next/navigation";
import { ReadOnlyProvider } from "@/components/client/readonly";
import { ClientShell } from "@/components/client/shell/ClientShell";
import { HomeView } from "@/components/client/home/HomeView";
import { PlanScreen } from "@/components/client/plan/PlanScreen";
import { PreviewGuard } from "@/components/staff/admin/PreviewGuard";
import a from "@/components/staff/admin/admin.module.css";
import { clientScope, logAccess, requireStaff } from "@/server/auth/guards";
import { prisma } from "@/server/db";

export const metadata = { title: "Preview as client" };

/** PREVIEW AS CLIENT: the real client UI, read only, watermarked and logged. */
export default async function PreviewAsClient({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const ctx = await requireStaff({ section: "clients" });
  const { id } = await params;
  const tab = (await searchParams).tab === "plan" ? "plan" : "home";
  const c = await prisma.clientProfile.findFirst({ where: { AND: [{ id }, clientScope(ctx)] } });
  if (!c) notFound();
  await logAccess(ctx, c.id, { type: "preview", name: tab === "plan" ? "Assessment plan" : "Home" }, "PREVIEW_AS_CLIENT");
  const close = `/staff/clients/${c.id}?tab=${tab === "plan" ? "plan" : "overview"}`;
  return (
    <div className={a.pvScrim} role="dialog" aria-modal="true" aria-label={`Preview as ${c.firstName} ${c.lastName}`}>
      <div className={a.pvBox}>
        <div className={a.pvBar}>
          <b>
            Preview as {c.firstName} {c.lastName} · view only · this view is logged
          </b>
          <span style={{ display: "flex", gap: 6 }}>
            <Link href={`/staff/clients/${c.id}/preview?tab=home`} className={a.pvBtn + (tab === "home" ? " " + a.pvOn : "")} aria-current={tab === "home" ? "page" : undefined}>
              Home
            </Link>
            <Link href={`/staff/clients/${c.id}/preview?tab=plan`} className={a.pvBtn + (tab === "plan" ? " " + a.pvOn : "")} aria-current={tab === "plan" ? "page" : undefined}>
              Plan
            </Link>
            <Link href={close} className={a.pvBtn}>
              Close preview
            </Link>
          </span>
        </div>
        <div className={a.pvBody}>
          <div className={a.pvScroll}>
            <PreviewGuard closeHref={close}>
              <ReadOnlyProvider>
                <ClientShell clientId={c.id} preview>
                  {tab === "plan" ? <PlanScreen clientId={c.id} readOnly /> : <HomeView clientId={c.id} readOnly />}
                </ClientShell>
              </ReadOnlyProvider>
            </PreviewGuard>
          </div>
          <div className={a.pvMark} aria-hidden>
            <span>Preview</span>
          </div>
        </div>
      </div>
    </div>
  );
}
