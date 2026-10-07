import type { Metadata } from "next";
import { Button } from "@/components/ds";
import { AccessShell } from "@/components/client/access/AccessShell";
import s from "@/components/client/access/access.module.css";
import { requestLink } from "../actions";

export const metadata: Metadata = { title: "Link expired", robots: { index: false } };

/** Expired or used link (sign in 15 min, setup 48 h). Auth.js `pages.error` also lands here. */
export default async function ExpiredPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  return (
    <AccessShell screen="expired" back={{ href: "/signin", label: "Sign in" }}>
      <div className={s.expiredBox}>
        <span style={{ font: "600 16px var(--font-sans)" }}>Links work once and last 48 hours for setup, 15 minutes for sign in.</span>
        <span className={s.small} style={{ lineHeight: 1.45 }}>Nothing is lost. Your order and details are saved.</span>
      </div>
      <form action={requestLink} className={s.fields} style={{ gap: 28 }}>
        <label className={s.field}>
          <span className={s.fieldLabel}>Email</span>
          <input className={s.input} type="email" name="email" autoComplete="email" placeholder="you@email.com" defaultValue={email} required />
        </label>
        <Button type="submit" variant="blue" size="lg" full>SEND A NEW LINK →</Button>
      </form>
      <span className={s.small}>
        Still stuck? WhatsApp us on <b className={s.strong}>+91 98200 41700</b>
      </span>
    </AccessShell>
  );
}
