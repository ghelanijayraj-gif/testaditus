import "server-only";
import { clientAuth } from "@/server/auth/client";
import { prisma } from "@/server/db";

/** Signed in client for route handlers (no redirect): null when there is no client session. */
export async function sessionClient() {
  const session = await clientAuth();
  if (!session?.user?.id || session.user.kind !== "CLIENT") return null;
  return prisma.clientProfile.findUnique({ where: { userId: session.user.id }, include: { user: true } });
}
