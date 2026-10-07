import "server-only";
import { canOnClient, logAccess, requireStaff, type StaffCtx } from "@/server/auth/guards";
import { STAFF_NAV, scopeOf } from "@/lib/permissions";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";

const ASSESS_ROLES = STAFF_NAV.find((n) => n.key === "assessments")!.roles;

export type ConsoleCtx = StaffCtx & { allowed: boolean; canApprove: boolean };

/**
 * Page guard for the consoles. Unlike `requireStaff({ section })` it does not redirect
 * Ops and Finance, so a direct URL shows the "No access" panel (and is logged as denied).
 */
export async function consoleCtx(): Promise<ConsoleCtx> {
  const ctx = await requireStaff();
  return { ...ctx, allowed: ASSESS_ROLES.includes(ctx.role), canApprove: scopeOf(ctx.role, "reports.approve") !== false };
}

/** Action guard: staff with the Assessments section, scoped to the client for `perm`. */
export async function actionCtx(clientId?: string, perm: "media.view" | "measures.edit" | "reports.approve" = "measures.edit") {
  const ctx = await requireStaff({ section: "assessments" });
  if (clientId && !(await canOnClient(ctx, perm, clientId))) throw new Error("No access to this client");
  return ctx;
}

/**
 * May this staff member open this client's media and measures? Logs VIEWED once per
 * resource per 10 minutes (pages refresh after every action), and DENIED always.
 */
export async function openClient(ctx: ConsoleCtx, clientId: string, resource: { type: string; id?: string; name: string }) {
  const ok = ctx.allowed && (await canOnClient(ctx, "media.view", clientId));
  if (!ok) {
    await logAccess(ctx, clientId, resource, "DENIED");
    return false;
  }
  const recent = await prisma.accessLog.findFirst({
    where: { clientId, actorUserId: ctx.userId, resourceId: resource.id ?? null, resourceType: resource.type, action: "VIEWED", createdAt: { gte: new Date(now().getTime() - 10 * 60_000) } },
  });
  if (!recent) await logAccess(ctx, clientId, resource, "VIEWED");
  return true;
}
