import Link from "next/link";
import type { ReactNode } from "react";
import { AditusMark, type SystemId } from "@/components/ds";
import s from "./access.module.css";

export type AccessScreen = "signin" | "check" | "expired" | "paid" | "setup1" | "setup2" | "setup3" | "setup4" | "done";

/** Panel copy per screen (01 §1.4), verbatim. `{first}` is the client's first name. */
const PANEL: Record<AccessScreen, [string, string, string]> = {
  signin: ["Welcome back", "Sign in.", "Your sessions, homework and reports are where you left them."],
  check: ["Sign in", "Check your email.", "We sent you a sign in link. Tap it and you are in. No password needed."],
  expired: ["Sign in", "This link has expired.", "Send yourself a new one. It takes a few seconds."],
  paid: ["Payment confirmed", "Your assessment starts here.", "Thank you, {first}. Next, set up your account so you can book your assessment and track your sessions."],
  setup1: ["Account setup · 1 of 4", "Confirm your details.", "We filled these in from your order. Check they are right."],
  setup2: ["Account setup · 2 of 4", "Secure your account.", "Choose how you want to sign in. You can change it later in Account."],
  setup3: ["Account setup · 3 of 4", "Your preferences.", "Where you train, how we reach you, and what you are happy for us to use. Nothing is ticked for you."],
  setup4: ["Account setup · 4 of 4 · optional", "Bring your documents.", "Upload blood tests, scans or physio notes you already have. They help us read your baseline. Skip if you have none."],
  done: ["You're in", "You're in.", "Your account is ready. First step: fill your intake and book your Movement Assessment. It becomes your baseline."],
};

const MARK: Partial<Record<AccessScreen, SystemId>> = { setup1: "movement", setup2: "breathwork", setup3: "recovery", setup4: "performance", done: "performance" };
const STEP_LABELS = ["Details", "Security", "Preferences", "Documents"];

export function AccessShell({ screen, first = "", back, right = "Client profile", wide, children }: { screen: AccessScreen; first?: string; back?: { href: string; label: string }; right?: string; wide?: boolean; children: ReactNode }) {
  const [kicker, title, rawLine] = PANEL[screen];
  const line = rawLine.replace("{first}", first);
  const step = screen.startsWith("setup") ? Number(screen.slice(5)) : 0;
  return (
    <div className={s.shell}>
      <aside className={s.panel}>
        <div className={s.panelLogo}>
          <AditusMark size={36} color="#FFFFFF" muted="#879DDA" />
          <span className={s.panelWord}>ADITUS</span>
        </div>
        <div className={s.panelText}>
          <span className={s.panelKicker}>{kicker}</span>
          <h1 className={s.panelTitle}>{title}</h1>
          <p className={s.panelLine}>{line}</p>
        </div>
        <div className={s.panelFoot}>
          <span className={s.panelHelp}>
            Help · WhatsApp +91 98200 41700
            <br />
            TIC Kandivali · Samyah Borivali
          </span>
          <div className={s.panelMark} aria-hidden>
            <AditusMark size={300} color="#FFFFFF" muted="#31B1EF" active={MARK[screen] ?? ""} />
          </div>
        </div>
      </aside>
      <div className={s.col}>
        <header className={s.head}>
          <Link href="/signin" className={`${s.headLogo} ${s.mobileOnly}`} aria-label="ADITUS">
            <AditusMark size={26} />
            <span className={s.headWord}>ADITUS</span>
          </Link>
          {back && (
            <Link href={back.href} className={s.back}>
              ← {back.label}
            </Link>
          )}
          <span className={s.headRight}>{right}</span>
        </header>
        <main className={s.main}>
          <div className={`${s.inner} ${wide ? s.innerWide : ""}`}>
            <div className={`${s.mHead} ${s.mobileOnly}`}>
              <span className={s.mKicker}>{kicker}</span>
              <h1 className={s.mTitle}>{title}</h1>
              <p className={s.mLine}>{line}</p>
            </div>
            {step > 0 && (
              <div className={s.steps} aria-label={`Step ${step} of 4`}>
                {STEP_LABELS.map((l, i) => {
                  const n = i + 1;
                  return (
                    <div key={l} className={s.stepCell} aria-current={n === step ? "step" : undefined}>
                      <span className={s.stepBar} style={{ background: n < step ? "var(--ink)" : n === step ? "var(--blue)" : "var(--grey-200)" }} />
                      <span className={s.stepLabel} style={{ color: n <= step ? "var(--ink)" : "var(--grey-600)" }}>
                        {String(n).padStart(2, "0")} · {l}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
