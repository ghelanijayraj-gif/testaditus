import type { Metadata } from "next";
import { AccessShell } from "@/components/client/access/AccessShell";
import { CheckEmail } from "@/components/client/access/CheckEmail";
import { resendLink } from "../actions";

export const metadata: Metadata = { title: "Check your email", robots: { index: false } };

export default async function CheckPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  return (
    <AccessShell screen="check" back={{ href: "/signin", label: "Sign in" }}>
      <CheckEmail email={email} resend={resendLink} />
    </AccessShell>
  );
}
