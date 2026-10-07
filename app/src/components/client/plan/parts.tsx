import type { ReactNode } from "react";
import type { ModuleStatus } from "@prisma/client";
import { Lock } from "@/components/ui/Lock";
import { CoverageGrid, type CoverageRow } from "@/components/shared/CoverageGrid";
import { STATUS_LABEL, TYPE_LABEL, statusChip } from "@/lib/assessment/plan";
import { IN_PERSON_INCLUDES, REC_COPY, REC_WHY, TEAM_WHATSAPP, actionLabel, byLine, isActionable, isCustom, isDoneish, moduleHref, type PlanMod, type RecScreen } from "@/lib/assessment/next";
import { LinkButton, RecButtons } from "./clientParts";
import s from "./plan.module.css";

/** Status chip (06.5). */
export function Chip({ status, pad = "4px 8px" }: { status: ModuleStatus; pad?: string }) {
  const c = statusChip(status);
  return <span style={{ flex: "none", padding: pad, fontSize: 9, textTransform: "uppercase", letterSpacing: ".04em", background: c.bg, color: c.fg, boxShadow: c.ring }}>{STATUS_LABEL[status]}</span>;
}

export function ProgressBar8({ pct }: { pct: number }) {
  return (
    <div className={s.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export function WhoCanSee({ children = "Who can see this: you, Jayraj and your head coach" }: { children?: ReactNode }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, textTransform: "uppercase", color: "var(--grey-700)" }}>
      <Lock size={10} />
      {children}
    </span>
  );
}

export function VisitingMumbai() {
  return (
    <span style={{ fontSize: 12, color: "var(--grey-700)" }}>
      Visiting Mumbai?{" "}
      <a href={TEAM_WHATSAPP} target="_blank" rel="noreferrer">
        Message the team →
      </a>
    </span>
  );
}

export function CoverageAside({ rows, title = "What your plan covers", legend = "Updates as you go", withLegend }: { rows: CoverageRow[]; title?: string; legend?: string; withLegend?: boolean }) {
  return (
    <aside className={s.aside} aria-label="Coverage">
      <CoverageGrid title={title} legend={legend} rows={rows} />
      {withLegend && (
        <span style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--grey-700)" }}>
          Measured: taken by a practitioner with a tool. Observed: seen on video or in person. Self reported: your answers and self tests.
        </span>
      )}
    </aside>
  );
}

/** B. Recommendation card, rendered above the screen main when shown. */
export function RecCard({ screen, note, practitioner, readOnly }: { screen: RecScreen; note: string | null; practitioner: string; readOnly?: boolean }) {
  const copy = REC_COPY[screen];
  return (
    <div className={s.recWrap}>
      <section className={s.rec} style={{ border: "2px solid var(--blue)" }} aria-label="In person recommendation">
        <div style={{ padding: "clamp(16px,2.5vw,24px)", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--blue)" }}>{copy.kicker}</span>
          <h2 style={{ margin: 0, fontWeight: 400, fontFamily: "var(--font-display)", fontSize: "clamp(22px,3vw,30px)", lineHeight: 0.95, textTransform: "uppercase" }}>{copy.title}</h2>
          {REC_WHY.map((y) => (
            <span key={y} style={{ display: "flex", gap: 8, font: "400 15px/1.45 var(--font-sans)" }}>
              <span style={{ color: "var(--blue)" }} aria-hidden>
                ✓
              </span>
              {y}
            </span>
          ))}
          {note && (
            <div style={{ background: "var(--grey-50)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ font: "400 15px/1.5 var(--font-sans)" }}>“{note}”</span>
              <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>{practitioner} · your practitioner</span>
            </div>
          )}
        </div>
        <div style={{ background: "var(--ice)", padding: "clamp(16px,2.5vw,24px)", display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>In person session</span>
            <b style={{ font: "600 18px var(--font-sans)" }}>Paid · ₹X,XXX</b>
          </span>
          {IN_PERSON_INCLUDES.map(([k, v]) => (
            <span key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderTop: "1px solid rgba(16,24,40,.12)", font: "500 14px var(--font-sans)" }}>
              <span>{k}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{v}</span>
            </span>
          ))}
          <RecButtons readOnly={readOnly} />
          <span style={{ fontSize: 10, color: "var(--grey-700)" }}>You can change this later from your assessment plan.</span>
        </div>
      </section>
    </div>
  );
}

/** E. Module card on the plan screen. */
export function ModuleCard({ m, n, practitioner, readOnly }: { m: PlanMod; n: number; practitioner: string; readOnly?: boolean }) {
  const done = isDoneish(m.status);
  const act = actionLabel(m);
  const actionable = isActionable(m.status);
  const custom = isCustom(m);
  const by = byLine(m, practitioner);
  return (
    <article style={{ border: actionable ? "2px solid var(--ink)" : "1px solid var(--grey-200)", display: "flex", flexDirection: "column", background: "#fff" }}>
      {custom && <span style={{ padding: "6px 16px", background: "var(--ice)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--navy)" }}>{by}</span>}
      <div style={{ padding: 16, display: "grid", gridTemplateColumns: "28px minmax(0,1fr)", gap: 12 }}>
        <span
          aria-label={done ? "Done" : `Step ${n}`}
          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, background: done ? "var(--blue)" : "#fff", color: done ? "#fff" : "var(--ink)", boxShadow: `inset 0 0 0 2px ${done ? "var(--blue)" : "var(--ink)"}` }}
        >
          {done ? "✓" : n}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <span style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, font: "600 18px/1.2 var(--font-sans)" }}>{m.name}</h3>
            <Chip status={m.status} />
          </span>
          {m.purpose && <span style={{ font: "400 15px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>{m.purpose}</span>}
          <span style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>
            <span>{TYPE_LABEL[m.type]}</span>
            <span>{m.timeEstimate}</span>
            {m.dueLabel && !done && m.status !== "BOOKED" && <span>Due {m.dueLabel}</span>}
            {!custom && <span>{by}</span>}
          </span>
          {custom && !done && m.note && <div style={{ background: "var(--grey-50)", padding: "10px 12px", font: "400 14px/1.5 var(--font-sans)" }}>“{m.note}”</div>}
          {m.extra && <span style={{ font: "500 14px/1.45 var(--font-sans)", color: "var(--navy)" }}>{m.extra}</span>}
          {act && (
            <div>
              <LinkButton href={moduleHref(m)} variant={actionable ? "ink" : "outline"} size="md" readOnly={readOnly}>
                {act}
              </LinkButton>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/** System steps: Practitioner review and Your report (not client actions). */
export function SystemSteps({ start, practitioner, headCoach }: { start: number; practitioner: string; headCoach: string }) {
  const rows: [string, string][] = [
    ["Practitioner review", `${practitioner} reviews everything, then ${headCoach} checks it.`],
    ["Your report", "Released when every required step is done. Within XX hours of review."],
  ];
  return (
    <>
      {rows.map(([name, line], i) => (
        <div key={name} style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "28px minmax(0,1fr) auto", gap: 12, alignItems: "center", background: "var(--grey-50)" }}>
          <span style={{ fontSize: 11, color: "var(--grey-600)" }}>{String(start + i).padStart(2, "0")}</span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <b style={{ font: "600 15px var(--font-sans)", color: "var(--grey-700)" }}>{name}</b>
            <span style={{ fontSize: 11, color: "var(--grey-600)" }}>{line}</span>
          </span>
          <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--grey-600)" }}>No action</span>
        </div>
      ))}
    </>
  );
}
