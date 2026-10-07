import type { Metadata } from "next";
import { prisma } from "@/server/db";
import { devAuthEnabled } from "@/server/auth/factory";
import { AccessShell } from "@/components/client/access/AccessShell";
import { SignInForm } from "@/components/client/access/SignInForm";
import s from "@/components/client/access/access.module.css";
import { DEV_GROUPS, DEV_LABELS } from "../../../../prisma/seed/roster";
import { devSignIn, passwordSignIn, requestLink } from "./actions";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ email?: string; pw?: string; error?: string }> }) {
  const sp = await searchParams;
  const dev = devAuthEnabled() ? await prisma.user.findMany({ where: { kind: "CLIENT" }, include: { client: true }, orderBy: { email: "asc" } }) : [];
  // Roster order first (the lifecycle demo states), then everyone else.
  const order = Object.keys(DEV_LABELS);
  dev.sort((a, b) => (order.indexOf(a.email) + 1 || 999) - (order.indexOf(b.email) + 1 || 999));
  const grouped = new Set(DEV_GROUPS.flatMap((g) => g.emails));
  const groups = [
    ...DEV_GROUPS.map((g) => ({ title: g.title, users: g.emails.map((e) => dev.find((u) => u.email === e)).filter((u): u is (typeof dev)[number] => !!u) })),
    { title: "Other", users: dev.filter((u) => !grouped.has(u.email)) },
  ].filter((g) => g.users.length > 0);
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
          <span className={s.sumKey}>Dev quick sign in · {dev.length} demo clients</span>
          <nav className={s.devJump} aria-label="Jump to a stage">
            {groups.map((g, i) => (
              <a key={g.title} href={`#dev-${i}`}>
                {i + 1} · {g.title} <span>{g.users.length}</span>
              </a>
            ))}
          </nav>
          {groups.map((g, i) => (
            <details key={g.title} id={`dev-${i}`} className={s.devGroup} open>
              <summary>
                <span>
                  {i + 1} · {g.title}
                </span>
                <span className={s.devCount}>{g.users.length}</span>
              </summary>
              {g.users.map((u) => (
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
            </details>
          ))}
        </div>
      )}
    </AccessShell>
  );
}
