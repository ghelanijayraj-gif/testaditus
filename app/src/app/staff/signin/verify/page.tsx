import { redirect } from "next/navigation";
import { totpNow } from "@/server/auth/totp";
import { prisma } from "@/server/db";
import { staffAuth } from "@/server/auth/staff";
import { devAuthEnabled } from "@/server/auth/factory";
import { SignInShell, signinStyles as s } from "@/components/staff/SignInShell";
import { CodeInput } from "@/components/staff/CodeInput";
import { verifyCode } from "../actions";

export default async function Verify({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const session = await staffAuth();
  if (!session?.user?.id) redirect("/staff/signin");
  if (session.user.mfa) redirect("/staff/signin/ready");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const devCode = devAuthEnabled() && user?.totpSecret ? totpNow(user.totpSecret) : null;
  return (
    <SignInShell title="Second step.">
      <form action={verifyCode} className={s.stack} style={{ gap: 10 }}>
        <span className={s.lead}>Enter the 6 digit code from your authenticator app.</span>
        {sp.error && <span className={s.err}>That code did not match. Codes change every 30 seconds.</span>}
        <CodeInput />
        <button className={s.blue}>Verify</button>
        {devCode && <span className={s.note}>Dev: current code {devCode}</span>}
      </form>
    </SignInShell>
  );
}
