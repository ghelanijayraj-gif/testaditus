import { Suspense } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { dayLabel } from "@/lib/format";
import { recommendationVisible, showRecNote } from "@/lib/assessment/next";
import { getClientPlanView } from "@/server/client/plan/view";
import { Flash, ReopenButton } from "./clientParts";
import { CoverageAside, ModuleCard, ProgressBar8, RecCard, SystemSteps, VisitingMumbai, WhoCanSee } from "./parts";
import s from "./plan.module.css";

// CONTRACT (owned by the Plan area): the client's Assessment plan screen (06 "plan"):
// module cards, system steps, coverage grid, recommendation card, reopen strip.
// Rendered at /assessment/plan, inside /assessment before the report is released,
// and by staff "Preview as client".
export async function PlanScreen({ clientId, readOnly }: { clientId: string; readOnly?: boolean }) {
  const v = await getClientPlanView(clientId);
  if (!v) return null;
  const { client, mods, progress } = v;
  const showRec = recommendationVisible("plan", { inMumbaiArea: client.inMumbaiArea, recommendation: client.recommendation, mods });
  return (
    <ToastProvider bottom={88}>
      <Suspense>
        <Flash />
      </Suspense>
      {showRec && <RecCard screen="plan" note={showRecNote(mods, client.recommendationNote) ? client.recommendationNote : null} practitioner={v.practitioner} readOnly={readOnly} />}
      <main className={s.main} style={{ maxWidth: 1180, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className={s.kicker}>Assessment · {v.planKind === "REASSESSMENT" ? "Reassessment" : "Baseline"}</span>
            <h1 className={s.h1}>Your assessment plan.</h1>
          </div>
          <WhoCanSee>{`Who can see this: you, ${v.practitioner} and your head coach`}</WhoCanSee>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ font: "600 15px var(--font-sans)" }}>{progress.label}</span>
          <ProgressBar8 pct={progress.pct} />
        </div>
        <div className={`${s.two} ${s.twoTight}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            {mods.map((m, i) => (
              <ModuleCard key={m.id} m={m} n={i + 1} practitioner={v.practitioner} readOnly={readOnly} />
            ))}
            {v.dismissed && (
              <div style={{ border: "1.5px dashed var(--grey-400)", padding: "14px 16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                <span style={{ flex: "1 1 260px", minWidth: 0, font: "400 14px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>
                  You chose to continue online only{client.recommendationAt ? ` on ${dayLabel(client.recommendationAt)}` : ""}. In person session · paid · ₹X,XXX
                </span>
                <ReopenButton readOnly={readOnly} />
              </div>
            )}
            <SystemSteps start={mods.length + 1} practitioner={v.practitioner} headCoach={v.headCoach} />
            {!client.inMumbaiArea && <VisitingMumbai />}
          </div>
          <CoverageAside rows={v.coverage} withLegend />
        </div>
      </main>
    </ToastProvider>
  );
}
