import type { Metadata } from "next";
import Link from "next/link";
import { requireClient } from "@/server/auth/guards";
import { AditusMark } from "@/components/ds";
import { AGREEMENT_VERSION } from "@/server/onboarding/intakeDefs";
import s from "@/components/client/intake/intake.module.css";

export const metadata: Metadata = { title: "Assessment agreement", robots: { index: false } };

const LINES = [
  "Your practitioner leads every test and stops if anything hurts.",
  "You can skip any test, any time, without a reason.",
  "This is an assessment of how you move, breathe and recover. It is not a medical check.",
  "Your results are seen by you, your practitioner and the head coach only.",
  "You can ask us to delete your data from Account.",
];

/** "Read the full agreement →". The full legal text is a placeholder until ADITUS supplies it. */
export default async function AgreementPage() {
  await requireClient();
  return (
    <div className={s.root}>
      <header className={s.head}>
        <div className={s.headRow}>
          <Link href="/" className={s.logo} aria-label="ADITUS Home">
            <AditusMark size={26} />
            <span className={s.logoWord}>ADITUS</span>
          </Link>
        </div>
      </header>
      <div className={s.body} style={{ maxWidth: 720 }}>
        <main className={s.main}>
          <Link href="/intake?step=11" className={s.footBtn} style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>← Agreement</Link>
          <span className={s.kicker}>Version {AGREEMENT_VERSION}</span>
          <h1 className={s.h1}>The assessment agreement.</h1>
          <div className={s.agree}>
            <span className={s.agreeKicker}>The assessment agreement, in plain words</span>
            {LINES.map((x) => (
              <span key={x} className={s.agreeLine}>
                <span className={s.dot}>·</span>
                {x}
              </span>
            ))}
          </div>
          <span className={s.sub}>Full agreement text placeholder.</span>
        </main>
      </div>
    </div>
  );
}
