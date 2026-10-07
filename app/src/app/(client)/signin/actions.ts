"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { prisma } from "@/server/db";
import { clientSignIn } from "@/server/auth/client";
import { devAuthEnabled } from "@/server/auth/factory";

const Email = z.email();

/** Home, or account setup when it is not finished yet. */
async function landing(where: { email?: string; id?: string }) {
  const u = await prisma.user.findFirst({ where, include: { client: true } });
  return u?.client && !u.client.accountSetupDone ? "/setup" : "/";
}
const RESEND_WAIT_MS = 30_000;

/**
 * Sends a 15 minute sign in link through the client Auth.js `email-link` provider.
 * Answers the same whether or not the account exists (the provider only mails real clients).
 * Server side rate limit: one link per address per 30 seconds.
 */
async function sendLink(raw: string): Promise<"sent" | "wait" | "invalid"> {
  const email = raw.trim().toLowerCase();
  if (!Email.safeParse(email).success) return "invalid";
  const recent = await prisma.outboxMessage.count({ where: { toAddress: email, template: "sign_in_link", createdAt: { gt: new Date(Date.now() - RESEND_WAIT_MS) } } });
  if (recent > 0) return "wait";
  try {
    await clientSignIn("email-link", { email, redirect: false, redirectTo: "/signin/continue" });
  } catch (e) {
    if (e instanceof AuthError) return "invalid";
    throw e;
  }
  return "sent";
}

export async function requestLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const r = await sendLink(email);
  if (r === "invalid") redirect(`/signin?error=email&email=${encodeURIComponent(email)}`);
  redirect(`/signin/check?email=${encodeURIComponent(email)}`);
}

/** Resend from the Check your email screen (client side 30 s wait as well). */
export async function resendLink(email: string): Promise<{ ok: boolean }> {
  const r = await sendLink(email);
  return { ok: r !== "invalid" };
}

export async function passwordSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  try {
    await clientSignIn("password", { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) redirect(`/signin?pw=1&error=password&email=${encodeURIComponent(email)}`);
    throw e;
  }
  redirect(await landing({ email }));
}

export async function devSignIn(formData: FormData) {
  if (!devAuthEnabled()) return;
  const userId = String(formData.get("userId") ?? "");
  await clientSignIn("dev", { userId, redirect: false });
  redirect(await landing({ id: userId }));
}
