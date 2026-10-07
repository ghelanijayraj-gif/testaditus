import type { Metadata } from "next";
import { requireClient } from "@/server/auth/guards";
import { getClientPlanView } from "@/server/client/plan/view";
import { recommendationVisible, showRecNote } from "@/lib/assessment/next";
import { ToastProvider } from "@/components/ui/Toast";
import { PlanHeader } from "@/components/client/plan/PlanHeader";
import { LinkButton } from "@/components/client/plan/clientParts";
import { CoverageAside, RecCard, VisitingMumbai } from "@/components/client/plan/parts";
import s from "@/components/client/plan/plan.module.css";

export const metadata: Metadata = { title: "Welcome" };

const LINES = [
  "There is no fixed program at ADITUS. The assessment finds your starting point.",
  "Your plan is a short list of steps. Some are the same for everyone, some get added for you.",
  "At the end you get a report, 3 to 5 priorities and a recommended path.",
];

/** 06 C. Welcome: "Your assessment starts here." with the plan checklist and coverage. */
export default async function WelcomePage() {
  const { client } = await requireClient();
  const v = await getClientPlanView(client.id);
  if (!v) return null;
  const showRec = recommendationVisible("welcome", { inMumbaiArea: v.client.inMumbaiArea, recommendation: v.client.recommendation, mods: v.mods });
  const intakeDone = v.mods.find((m) => m.key === "intake")?.status === "DONE" || v.client.intakeDone;
  return (
    <ToastProvider bottom={24}>
      <div style={{ minHeight: "100vh", fontFamily: "var(--font-mono)", color: "var(--ink)", display: "flex", flexDirection: "column", background: "#fff" }}>
        <PlanHeader name={v.client.full} city={v.client.city} />
        {showRec && <RecCard screen="welcome" note={showRecNote(v.mods, v.client.recommendationNote) ? v.client.recommendationNote : null} practitioner={v.practitioner} />}
        <main className={`${s.main} ${s.two}`} style={{ maxWidth: 1180, paddingBottom: 80 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <h1 className={s.h1} style={{ fontSize: "clamp(34px,6vw,60px)", lineHeight: 0.88 }}>
              Your assessment starts here.
            </h1>
            {LINES.map((l) => (
              <span key={l} className={s.lead}>
                {l}
              </span>
            ))}
            <ol style={{ listStyle: "none", margin: 0, padding: 0, border: "2px solid var(--ink)", display: "flex", flexDirection: "column" }} aria-label="Your plan">
              {v.mods.map((m, i) => (
                <li key={m.id} style={{ padding: "14px 16px", borderBottom: "1px solid var(--grey-200)", display: "grid", gridTemplateColumns: "28px minmax(0,1fr) auto", gap: 12, alignItems: "center", background: "#fff" }}>
                  <span style={{ fontSize: 11, color: "var(--grey-600)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <b style={{ font: "600 16px var(--font-sans)" }}>{m.name}</b>
                    <span style={{ fontSize: 11, color: "var(--grey-600)" }}>{m.shortLine}</span>
                  </span>
                  <span style={{ fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap" }}>{m.timeEstimate}</span>
                </li>
              ))}
            </ol>
            {!v.client.inMumbaiArea && <VisitingMumbai />}
            <div>{intakeDone ? <LinkButton href="/assessment/plan">SEE YOUR PLAN →</LinkButton> : <LinkButton href="/intake">START INTAKE →</LinkButton>}</div>
          </div>
          <CoverageAside rows={v.coverage} />
        </main>
      </div>
    </ToastProvider>
  );
}
