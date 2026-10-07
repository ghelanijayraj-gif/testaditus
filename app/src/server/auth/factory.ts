import "server-only";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { EmailConfig } from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import type { AccountKind, StaffRole } from "@prisma/client";
import { prisma } from "@/server/db";
import { notifier } from "@/server/integrations/notify";

/**
 * Two Auth.js instances, one per interface. They share the Prisma user table but
 * use different secrets, cookie names and base paths, and each only admits its own
 * account kind — so a client session can never open the staff console and vice versa.
 */

declare module "next-auth" {
  interface Session {
    user: { id: string; email: string; name?: string | null; kind: AccountKind; role?: StaffRole | null; mfa?: boolean; sid?: string };
  }
}

/** Dev quick sign in: local development, or a hosted demo with DEMO_MODE=1 (never a real production deploy). */
export const devAuthEnabled = () => process.env.DEV_AUTH === "1" && (process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "1");

type Kind = "client" | "staff";

function emailLinkProvider(kind: Kind): EmailConfig {
  return {
    id: "email-link",
    type: "email",
    name: "Email link",
    // Client sign in link: 15 minutes. Staff: 15 minutes too; setup links are separate (48 h).
    maxAge: 15 * 60,
    async sendVerificationRequest({ identifier, url }) {
      const user = await prisma.user.findUnique({ where: { email: identifier }, include: { client: true } });
      // Respond identically whether or not the account exists; only send to the right kind.
      if (!user || user.kind !== (kind === "staff" ? "STAFF" : "CLIENT")) return;
      await notifier.send({
        clientId: user.client?.id,
        to: identifier,
        channel: "EMAIL",
        template: kind === "staff" ? "staff_sign_in_link" : "sign_in_link",
        subject: kind === "staff" ? "Your ADITUS Staff sign in link" : "Your ADITUS sign in link",
        body: `Tap to sign in. The link works once and expires in 15 minutes.\n\n${url}`,
      });
    },
  } as EmailConfig;
}

export function makeAuth(kind: Kind) {
  const accountKind: AccountKind = kind === "staff" ? "STAFF" : "CLIENT";
  const secure = process.env.NODE_ENV === "production";
  const prefix = `aditus.${kind}`;
  const cookie = (name: string, httpOnly = true) => ({ name: `${prefix}.${name}`, options: { httpOnly, sameSite: "lax" as const, path: "/", secure } });

  const providers: NextAuthConfig["providers"] = [emailLinkProvider(kind)];

  if (kind === "client") {
    providers.push(
      Credentials({
        id: "password",
        name: "Password",
        credentials: { email: {}, password: {} },
        async authorize(raw) {
          const email = String(raw?.email ?? "").trim().toLowerCase();
          const password = String(raw?.password ?? "");
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || user.kind !== "CLIENT" || user.disabled) return null;
          if (user.passwordHash && (await bcrypt.compare(password, user.passwordHash))) return { id: user.id, email: user.email, name: user.name };
          // Temporary password from the login details email: works once, 48 hours.
          if (user.tempPasswordHash && user.tempPasswordExpires && user.tempPasswordExpires > new Date() && (await bcrypt.compare(password, user.tempPasswordHash))) {
            await prisma.user.update({ where: { id: user.id }, data: { tempPasswordHash: null } });
            return { id: user.id, email: user.email, name: user.name };
          }
          return null;
        },
      }),
    );
  }

  if (kind === "client") {
    // Account setup link (48 h, from the Shopify paid email): signs the client in until setup is done.
    providers.push(
      Credentials({
        id: "setup-token",
        name: "Setup link",
        credentials: { token: {} },
        async authorize(raw) {
          const { findSetupToken } = await import("@/server/onboarding/setup");
          const hit = await findSetupToken(String(raw?.token ?? ""));
          return hit ? { id: hit.user.id, email: hit.user.email, name: hit.user.name } : null;
        },
      }),
    );
  }

  if (kind === "staff" && process.env.AUTH_GOOGLE_ID) {
    providers.push(
      Google({
        // Restrict to the Workspace domain when configured.
        authorization: process.env.STAFF_GOOGLE_WORKSPACE_DOMAIN ? { params: { hd: process.env.STAFF_GOOGLE_WORKSPACE_DOMAIN, prompt: "select_account" } } : undefined,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  if (devAuthEnabled()) {
    providers.push(
      Credentials({
        id: "dev",
        name: "Dev quick sign in",
        credentials: { userId: {} },
        async authorize(raw) {
          const user = await prisma.user.findUnique({ where: { id: String(raw?.userId ?? "") } });
          if (!user || user.kind !== accountKind) return null;
          return { id: user.id, email: user.email, name: user.name };
        },
      }),
    );
  }

  return NextAuth({
    basePath: `/api/auth/${kind}`,
    secret: kind === "staff" ? process.env.AUTH_SECRET_STAFF : process.env.AUTH_SECRET_CLIENT,
    trustHost: true,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt", maxAge: kind === "staff" ? 12 * 3600 : 30 * 86400 },
    cookies: {
      sessionToken: cookie("session"),
      callbackUrl: cookie("callback"),
      csrfToken: cookie("csrf"),
      pkceCodeVerifier: cookie("pkce"),
      state: cookie("state"),
      nonce: cookie("nonce"),
    },
    pages: kind === "staff"
      ? { signIn: "/staff/signin", verifyRequest: "/staff/signin?sent=1", error: "/staff/signin?error=1" }
      : { signIn: "/signin", verifyRequest: "/signin/check", error: "/signin/expired" },
    providers,
    callbacks: {
      async signIn({ user, email }) {
        // Invite only (staff) and Shopify created (clients): never create accounts here.
        if (!user?.email) return false;
        const db = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
        if (!db || db.kind !== accountKind || db.disabled) return email?.verificationRequest ? true : false;
        return true;
      },
      async jwt({ token, user, trigger, account }) {
        if (user?.email) {
          const db = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() }, include: { staff: true } });
          if (!db) return token;
          token.uid = db.id;
          token.kind = db.kind;
          token.role = db.staff?.role ?? null;
          token.sid = randomUUID();
          token.issuedAt = Date.now();
          // Dev quick sign in skips the second step; every real provider must pass it.
          token.mfa = kind === "client" || account?.provider === "dev";
        }
        // "Sign out of all devices" (Account): drop client tokens issued before the policy time.
        if (kind === "client" && token.uid) {
          const policy = await prisma.clientSessionPolicy.findUnique({ where: { userId: String(token.uid) } });
          if (policy && Number(token.issuedAt ?? 0) < policy.sessionsValidAfter.getTime()) return null;
        }
        // Staff second step: only flip mfa when the server recorded a TOTP check for this sid.
        if (trigger === "update" && kind === "staff" && token.sid) {
          const v = await prisma.mfaVerification.findUnique({ where: { sid: String(token.sid) } });
          if (v && v.userId === token.uid) token.mfa = true;
        }
        if (trigger === "update" && token.uid) {
          const db = await prisma.user.findUnique({ where: { id: String(token.uid) }, include: { staff: true } });
          token.role = db?.staff?.role ?? null;
        }
        return token;
      },
      async session({ session, token }) {
        session.user = {
          ...session.user,
          id: String(token.uid ?? ""),
          email: String(token.email ?? session.user?.email ?? ""),
          kind: (token.kind as AccountKind) ?? accountKind,
          role: (token.role as StaffRole | null) ?? null,
          mfa: Boolean(token.mfa),
          sid: token.sid ? String(token.sid) : undefined,
        };
        return session;
      },
    },
  });
}
