import "server-only";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Prisma, StaffRole } from "@prisma/client";
import { prisma } from "@/server/db";
import { clientAuth } from "./client";
import { devAuthEnabled } from "./factory";
import { staffAuth } from "./staff";
import { can, scopeOf, STAFF_NAV, isParked, type Permission } from "@/lib/permissions";
import { now } from "@/lib/clock";

/** Hosted demo: no sign in wall; visitors without a session enter as a demo account. */
const demoAutoLogin = () => process.env.DEMO_MODE === "1" && devAuthEnabled();
const DEMO_CLIENT = "/api/dev/login?kind=client&email=ananya%40example.com&to=%2F";
const DEMO_STAFF = "/api/dev/login?kind=staff&email=jayraj%40aditus.in&to=%2Fstaff";

export async function requireClient() {
  const session = await clientAuth();
  if (!session?.user?.id || session.user.kind !== "CLIENT") redirect(demoAutoLogin() ? DEMO_CLIENT : "/signin");
  const client = await prisma.clientProfile.findUnique({ where: { userId: session.user.id }, include: { user: true } });
  if (!client) redirect("/signin");
  return { session, client, user: client.user };
}

export const DEV_VIEW_AS = "aditus.dev.viewAs";

export async function requireStaff(opts: { section?: string; allowNoMfa?: boolean } = {}) {
  const session = await staffAuth();
  if (!session?.user?.id || session.user.kind !== "STAFF") redirect(demoAutoLogin() ? DEMO_STAFF : "/staff/signin");
  if (!session.user.mfa && !opts.allowNoMfa) redirect("/staff/signin/verify");
  const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id }, include: { user: true } });
  if (!staff) redirect("/staff/signin");
  let role: StaffRole = staff.role;
  // Dev only: a founder can view the console as a practitioner (the prototype's role switch).
  if (devAuthEnabled() && staff.role === "FOUNDER" && (await cookies()).get(DEV_VIEW_AS)?.value === "PRACTITIONER") role = "PRACTITIONER";
  if (opts.section) {
    const nav = STAFF_NAV.find((n) => n.key === opts.section);
    if ((nav && !nav.roles.includes(role)) || isParked(opts.section)) redirect("/staff");
  }
  return { session, staff, role, name: staff.user.name ?? staff.user.email, userId: staff.userId };
}

export type StaffCtx = Awaited<ReturnType<typeof requireStaff>>;

/** Prisma filter for the clients a staff member may see in lists. */
export function clientScope(ctx: Pick<StaffCtx, "staff" | "role">): Prisma.ClientProfileWhereInput {
  const { staff, role } = ctx;
  if (role === "FOUNDER" || role === "OPS") return {};
  if (role === "FINANCE") return {};
  if (role === "PRACTITIONER") return { OR: [{ primaryPractitionerId: staff.id }, { coaches: { some: { staffId: staff.id } } }] };
  // Head of department: clients with a practitioner or coach in their segment, or coached by them.
  return {
    OR: [
      { coaches: { some: { staffId: staff.id } } },
      { primaryPractitionerId: staff.id },
      ...(staff.segment ? [{ coaches: { some: { staff: { segment: staff.segment } } } }, { primaryPractitioner: { segment: staff.segment } }] : []),
    ],
  };
}

/** May this staff member use `perm` on this client? Applies all / segment / own scoping. */
export async function canOnClient(ctx: Pick<StaffCtx, "staff" | "role">, perm: Permission, clientId: string) {
  const scope = scopeOf(ctx.role, perm);
  if (scope === false) return false;
  if (scope === "all" || scope === "limited") return true;
  const hit = await prisma.clientProfile.count({ where: { id: clientId, ...clientScope(ctx) } });
  return hit > 0;
}

export async function audit(ctx: { userId: string; name: string }, action: string, detail: string, clientId?: string) {
  await prisma.auditLog.create({ data: { actorUserId: ctx.userId, actorName: ctx.name, action, detail, createdAt: now() } });
  if (clientId) await prisma.activityLog.create({ data: { clientId, actorName: ctx.name, action: detail, createdAt: now() } });
}

/**
 * Every staff view of health documents or media goes to the audit log and to the
 * client's access log. Denied attempts are logged too ("Sahil tried to open Media · denied").
 */
export async function logAccess(
  ctx: { userId: string; name: string },
  clientId: string,
  resource: { type: string; id?: string; name: string },
  action: "VIEWED" | "DENIED" | "PREVIEW_AS_CLIENT",
) {
  const client = await prisma.clientProfile.findUnique({ where: { id: clientId } });
  const who = client ? `${client.firstName} ${client.lastName}` : clientId;
  await prisma.accessLog.create({
    data: { clientId, actorUserId: ctx.userId, actorName: ctx.name, resourceType: resource.type, resourceId: resource.id, resourceName: resource.name, action, createdAt: now() },
  });
  const verb = action === "DENIED" ? `Tried to open ${who} · ${resource.name} · denied` : action === "PREVIEW_AS_CLIENT" ? `Preview as client · ${who}` : `Viewed ${who} · ${resource.name}`;
  await audit(ctx, action, verb, clientId);
}

export function roleCan(role: StaffRole, p: Permission) {
  return can(role, p);
}
