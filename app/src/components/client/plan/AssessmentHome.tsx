import Link from "next/link";
import { Suspense } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { now, TZ } from "@/lib/clock";
import { greeting, recommendationVisible } from "@/lib/assessment/next";
import { getClientPlanView } from "@/server/client/plan/view";
import { Flash, LinkButton, ReopenLink } from "./clientParts";
import { Chip, CoverageAside, ProgressBar8, RecCard } from "./parts";
import s from "./plan.module.css";

// CONTRACT (owned by the Plan area): Home content for clients before their report is
// released (06 Home: next step card, plan list, coverage, Mumbai recommendation).
// Rendered by the portal Home page (Shell area) and by staff "Preview as client".
export async function AssessmentHome({ clientId, readOnly }: { clientId: string; readOnly?: boolean }) {
  const v = await getClientPlanView(clientId);
  if (!v) return null;
  const { client, mods, progress, next } = v;
  const showRec = recommendationVisible("home", { inMumbaiArea: client.inMumbaiArea, recommendation: client.recommendation, mods });
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(now()));
  return (
    <ToastProvider bottom={88}>
      <Suspense>
        <Flash />
      </Suspense>
      {showRec && <RecCard screen="home" note={null} practitioner={v.practitioner} readOnly={readOnly} />}
      <main className={`${s.main} ${s.two}`} style={{ maxWidth: 1180 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <span className={s.kicker}>
            {greeting(hour)}, {client.first}
          </span>
          {!showRec && (
            <section aria-label="Your next step" style={{ border: "2px solid var(--ink)", padding: "clamp(18px,3vw,28px)", display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--blue)" }}>Your next step</span>
                <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>{progress.label}</span>
              </span>
              <h2 style={{ margin: 0, fontWeight: 400, fontFamily: "var(--font-display)", fontSize: "clamp(26px,4vw,40px)", lineHeight: 0.92, textTransform: "uppercase" }}>{next.title}</h2>
              <span style={{ font: "400 16px/1.5 var(--font-sans)", color: "var(--grey-700)" }}>{next.line}</span>
              {next.note && (
                <div style={{ background: "var(--grey-50)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--blue)" }}>{next.noteBy}</span>
                  <span style={{ font: "400 15px/1.5 var(--font-sans)" }}>“{next.note}”</span>
                </div>
              )}
              {next.act && next.href && (
                <div>
                  <LinkButton href={next.href} readOnly={readOnly}>
                    {next.act}
                  </LinkButton>
                </div>
              )}
              {next.reopen && <ReopenLink readOnly={readOnly} />}
            </section>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <h2 style={{ margin: 0, fontWeight: 400, fontFamily: "var(--font-display)", fontSize: 18, textTransform: "uppercase" }}>Your assessment plan</h2>
            <Link href="/assessment/plan" className={s.textBtn}>
              See all steps →
            </Link>
          </div>
          <ProgressBar8 pct={progress.pct} />
          <nav aria-label="Assessment steps" style={{ display: "flex", flexDirection: "column", border: "1px solid var(--grey-200)" }}>
            {mods.map((m) => (
              <Link key={m.id} href="/assessment/plan" className={s.rowBtn}>
                <span style={{ font: "500 15px var(--font-sans)" }}>{m.name}</span>
                <Chip status={m.status} pad="3px 8px" />
              </Link>
            ))}
          </nav>
        </div>
        <CoverageAside rows={v.coverage} />
      </main>
    </ToastProvider>
  );
}
