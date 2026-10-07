import "server-only";
import { prisma } from "@/server/db";
import { clientSignIn } from "@/server/auth/client";
import { now } from "@/lib/clock";
import { hashToken } from "./tokens";

/** A setup link is valid when it exists, is unused and is less than 48 hours old. */
export async function findSetupToken(raw: string) {
  if (!raw || raw.length > 200) return null;
  const t = await prisma.setupToken.findUnique({ where: { tokenHash: hashToken(raw) } });
  if (!t || t.purpose !== "SETUP" || t.usedAt || t.expiresAt <= now()) return null;
  const user = await prisma.user.findUnique({ where: { id: t.userId }, include: { client: true } });
  if (!user || user.kind !== "CLIENT" || user.disabled || !user.client) return null;
  return { token: t, user, client: user.client };
}

/** Opens a client session from a valid setup link (the client `setup-token` provider). */
export async function signInWithSetupToken(raw: string) {
  const hit = await findSetupToken(raw);
  if (!hit) return null;
  await clientSignIn("setup-token", { token: raw, redirect: false });
  return hit;
}

/** Marks every setup link for the account used (on finishing setup). */
export async function consumeSetupTokens(userId: string) {
  await prisma.setupToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now() } });
}
