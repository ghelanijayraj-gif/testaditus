import type { Metadata } from "next";
import { prisma } from "@/server/db";
import { devAuthEnabled } from "@/server/auth/factory";
import { AccessShell } from "@/components/client/access/AccessShell";
import { SignInForm } from "@/components/client/access/SignInForm";
import s from "@/components/client/access/access.module.css";
import { DEV_LABELS } from "../../../../prisma/seed/roster";
import { devSignIn, passwordSignIn, requestLink } from "./actions";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ email?: string; pw?: string; error?: string }> }) {
  const sp = await searchParams;
  const dev = devAuthEnabled() ? await prisma.user.findMany({ where: { kind: "CLIENT" }, include: { client: true }, orderBy: { email: "asc" } }) : [];
  // Roster order first (the lifecycle demo states), then everyone else.
  const order = Object.keys(DEV_LABELS);
  dev.sort((a, b) => (order.indexOf(a.email) + 1 || 999) - (order.indexOf(b.email) + 1 || 999));
  return (
    <AccessShell screen="signin">
      <SignInForm email={sp.email ?? ""} pw={sp.pw === "1"} error={sp.error} requestLink={requestLink} passwordSignIn={passwordSignIn} />
      <div className={s.helpBlock}>
        <span>First time here? Your setup link is in your welcome email.</span>
        <span>
          Need help? WhatsApp us on <b>+91 98200 41700</b>
        </span>
      </div>
      {dev.length > 0 && (
        <div className={s.dev}>
          <span className={s.sumKey}>Dev quick sign in</span>
          {dev.map((u) => (
            <form key={u.id} action={devSignIn}>
              <input type="hidden" name="userId" value={u.id} />
              <button className={s.devBtn}>
                <span className={s.devName}>{u.name ?? u.email}</span>
                <span className={s.devLabel}>
                  {DEV_LABELS[u.email] ?? u.email}
                  {u.client && !u.client.accountSetupDone ? " · goes to setup" : ""}
                </span>
              </button>
            </form>
          ))}
        </div>
      )}
    </AccessShell>
  );
}
