"use server";

import { redirect } from "next/navigation";
import { totpCheck } from "@/server/auth/totp";
import { AuthError } from "next-auth";
import { prisma } from "@/server/db";
import { staffAuth, staffSignIn, staffUpdateSession } from "@/server/auth/staff";
import { devAuthEnabled } from "@/server/auth/factory";
import { audit } from "@/server/auth/guards";

export async function googleSignIn() {
  await staffSignIn("google", { redirectTo: "/staff/signin/verify" });
}

export async function emailLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/staff/signin?error=email");
  try {
    await staffSignIn("email-link", { email, redirectTo: "/staff/signin/verify" });
  } catch (e) {
    if (e instanceof AuthError) redirect("/staff/signin?error=1");
    throw e;
  }
}

export async function devSignIn(formData: FormData) {
  if (!devAuthEnabled()) return;
  // Dev quick sign in still goes through the second step screen.
  const userId = String(formData.get("userId"));
  await staffSignIn("dev", { userId, redirect: false });
  const session = await staffAuth();
  if (session?.user?.sid) await prisma.mfaVerification.deleteMany({ where: { sid: session.user.sid } });
  redirect("/staff/signin/verify");
}

export async function verifyCode(formData: FormData) {
  const session = await staffAuth();
  if (!session?.user?.id || !session.user.sid) redirect("/staff/signin");
  const code = Array.from({ length: 6 }, (_, i) => String(formData.get("d" + i) ?? "")).join("") || String(formData.get("code") ?? "");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.totpSecret || !totpCheck(code.replace(/\D/g, ""), user.totpSecret)) redirect("/staff/signin/verify?error=1");
  await prisma.mfaVerification.upsert({ where: { sid: session.user.sid }, create: { sid: session.user.sid, userId: user.id }, update: { verifiedAt: new Date() } });
  await staffUpdateSession({});
  await audit({ userId: user.id, name: user.name ?? user.email }, "SIGN_IN", "Signed in to ADITUS Staff");
  redirect("/staff/signin/ready");
}
