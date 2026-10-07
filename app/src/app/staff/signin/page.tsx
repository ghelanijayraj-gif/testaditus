import type { Metadata } from "next";
import { prisma } from "@/server/db";
import { devAuthEnabled } from "@/server/auth/factory";
import { ROLE_LABEL } from "@/lib/permissions";
import { SignInShell, signinStyles as s } from "@/components/staff/SignInShell";
import { devSignIn, emailLink, googleSignIn } from "./actions";

export const metadata: Metadata = { title: "Sign in · ADITUS Staff", robots: { index: false } };

export default async function StaffSignIn({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const sp = await searchParams;
  const google = !!process.env.AUTH_GOOGLE_ID;
  const dev = devAuthEnabled() ? await prisma.user.findMany({ where: { kind: "STAFF" }, include: { staff: true }, orderBy: { createdAt: "asc" } }) : [];
  if (sp.sent) {
    return (
      <SignInShell title="Check your email.">
        <span className={s.lead}>We sent a sign in link. It works once and expires in 15 minutes. Then you will enter the code from your authenticator app.</span>
        <a href="/staff/signin" className={s.note} style={{ textTransform: "uppercase" }}>← Use a different email</a>
      </SignInShell>
    );
  }
  return (
    <SignInShell title="Sign in to ADITUS Staff.">
      {sp.error && <span className={s.err}>{sp.error === "email" ? "Enter your work email." : "That link did not work. Ask for a new one."}</span>}
      <div className={s.stack}>
        {google && (
          <form action={googleSignIn}>
            <button className={s.white}>Sign in with Google Workspace</button>
          </form>
        )}
        <form action={emailLink} className={s.stack}>
          <input className={s.input} name="email" type="email" autoComplete="email" placeholder="you@aditus.in" aria-label="Work email" required />
          <button className={google ? s.ghost : s.white}>Email me a sign in link</button>
        </form>
        <span className={s.note}>Client accounts cannot sign in here. Clients use aditus.in.</span>
      </div>
      {dev.length > 0 && (
        <div className={s.dev}>
          <span className={s.note}>Dev quick sign in</span>
          {dev.map((u) => (
            <form key={u.id} action={devSignIn}>
              <input type="hidden" name="userId" value={u.id} />
              <button className={s.devBtn}>
                <span>{u.name}</span>
                <span>{u.staff ? ROLE_LABEL[u.staff.role] : ""}</span>
              </button>
            </form>
          ))}
        </div>
      )}
    </SignInShell>
  );
}
