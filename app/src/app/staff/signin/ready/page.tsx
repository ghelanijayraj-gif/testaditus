import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaff } from "@/server/auth/guards";
import { ROLE_LABEL } from "@/lib/permissions";
import { SignInShell, signinStyles as s } from "@/components/staff/SignInShell";

const SCOPE = { FOUNDER: "All clients and staff", HOD: "Personal Training segment", PRACTITIONER: "Own clients", OPS: "Scheduling and billing", FINANCE: "Billing only" } as const;

export default async function Ready() {
  const ctx = await requireStaff();
  if (!ctx) redirect("/staff/signin");
  const scope = ctx.role === "HOD" && ctx.staff.segment ? `${ctx.staff.segment} segment` : SCOPE[ctx.role];
  return (
    <SignInShell title="Signed in.">
      <div className={s.stack} style={{ gap: 10 }}>
        <div className={s.card}>
          <b className={s.cardName}>{ctx.name}</b>
          <span className={s.cardRole}>
            {ROLE_LABEL[ctx.role]} · {scope}
          </span>
        </div>
        <Link href="/staff" className={s.blue}>
          Open console →
        </Link>
      </div>
    </SignInShell>
  );
}
