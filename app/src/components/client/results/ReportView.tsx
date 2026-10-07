import Link from "next/link";
import { headers } from "next/headers";
import { Button } from "@/components/ds";
import { BodyMap, type BodySpot } from "@/components/shared/BodyMap";
import { CoverageGrid } from "@/components/shared/CoverageGrid";
import { NextSteps } from "@/components/client/plan/NextSteps";
import { counts, dLong, f1, pctOf, pick, status, vt, type MeasureDef } from "@/lib/measures";
import { reportCoverage, hasTrainingPlan, type ReportData, type ResultsData } from "@/server/client/results";
import { Kicker, NightStrip, WhoCanSee } from "./bits";
import { PlanCards } from "./PlanCards";
import { EvaluationReport } from "@/components/evaluation/EvaluationReport";
import { REPORT } from "@/config/evaluation";
import s from "./results.module.css";

const card = { border: "2px solid var(--ink)", padding: 20, display: "flex", flexDirection: "column" as const, gap: 10 };
const blue = "var(--blue)";

/** Absolute link to a report for WhatsApp sharing. */
export async function reportUrl(id: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3100";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/reports/${id}`;
}

/**
 * 05 report view (sections 01 to 09) plus "What this report covers" and the practitioner's
 * "Recommended next assessment steps". `print` drops the actions for the print route.
 */
export async function ReportView({ data, report, print = false }: { data: ResultsData; report: ReportData; print?: boolean }) {
  // Reports built from a coach evaluation of photos and videos (src/config/evaluation.ts).
  if (report.evaluation) {
    const kicker = [REPORT.title, report.releasedAt ? dLong(report.releasedAt) : null, report.practitioner, report.approver ? "approved by the head coach" : null].filter(Boolean).join(" · ");
    return (
      <div className={s.rep} id="report-print" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <EvaluationReport data={report.evaluation} media={report.evalMedia} head={{ kicker, title: `${data.client.first}’s report` }} />
        {!print && (
          <div data-noprint style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button variant="ink" size="md" href={`/reports/${report.id}/print`}>
              SAVE AS PDF
            </Button>
            <Button variant="outline" size="md" href="/reports">
              ALL REPORTS
            </Button>
          </div>
        )}
      </div>
    );
  }
  const base = data.baseline;
  const isRe = report.kind === "REASSESSMENT";
  const snap = isRe ? data.reassessments.find((r) => r.assessmentId === report.assessmentId) ?? null : base;
  const def = (k: string) => data.defs.find((m) => m.key === k);
  const val = (m: MeasureDef) => {
    const b = base?.values[m.key];
    if (isRe) return f1(m, pick(m, b?.v ?? null)) + " → " + f1(m, pick(m, snap?.values[m.key]?.v ?? null));
    return vt(m, b?.v ?? null, b?.text) ?? "Not tested";
  };
  const now = (m: MeasureDef) => pick(m, snap?.values[m.key]?.v ?? null);
  const coverage = await reportCoverage(data.client.id, report.kind, data, snap);
  const meta = [report.kind === "BASELINE" ? "Baseline" : null, report.assessmentDate ? dLong(report.assessmentDate) : null, report.practitioner, report.approver ? "approved by the head coach" : null].filter(Boolean).join(" · ");
  const reCounts = isRe && base && snap ? counts(data.defs.map((m) => status(m, base.values[m.key]?.v ?? null, snap.values[m.key]?.v ?? null))) : null;

  const top = report.findings.slice(0, report.sections.mattersMost ?? 4);
  const move = report.findings.filter((f) => f.sys === "movement");
  const groups = [...new Set(move.flatMap((f) => (f.groups.length ? f.groups : (def(f.key ?? "")?.groups ?? []))))];
  const spots = (view: "front" | "back"): BodySpot[] =>
    move.flatMap((f, i) => f.markers.filter((p) => p.view === view).map((p) => ({ id: f.id + view, x: p.x, y: p.y, n: String(i + 1).padStart(2, "0") })));
  const breath = ["hold", "ribsUpper", "ribs", "ribsBack"].map(def).filter(Boolean) as MeasureDef[];
  const perf = ["goblet", "pushup", "vjump", "run1k"].map(def).filter(Boolean) as MeasureDef[];
  const nights = (snap?.nights ?? []).map((n) => ({ bed: n.bed, dur: n.dur, day: "" }));
  const avg = nights.length ? (nights.reduce((a, n) => a + n.dur, 0) / nights.length).toFixed(1) : null;
  const rhr = def("rhr");
  const pathTitle = report.sections.pathTitle ?? (report.recommendedPath === "GROUP_TRAINING" ? "Group Training." : "Personal Training.");
  const showPlans = !print && !isRe && !(await hasTrainingPlan(data.client.id));
  const share = `https://wa.me/?text=${encodeURIComponent(`My ADITUS ${report.type.toLowerCase()}: ${await reportUrl(report.id)}`)}`;

  return (
    <div className={s.rep} id="report-print">
      {!print && (
        <Link href="/reports" className={s.noPrint} style={{ alignSelf: "flex-start", height: 36, display: "flex", alignItems: "center", fontSize: 12, textTransform: "uppercase", textDecoration: "none" }}>
          ← All reports
        </Link>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Kicker>{meta}</Kicker>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(28px,4vw,52px)", lineHeight: 0.88, textTransform: "uppercase" }}>{report.type}.</h1>
          <WhoCanSee text="Who can see this: you, your coaches and the head coach" />
        </div>
        {!print && (
          <div className={s.noPrint} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button variant="ink" size="md" href={`/reports/${report.id}/print`}>
              DOWNLOAD PDF
            </Button>
            <Button variant="outline" size="md" href={share}>
              SHARE ON WHATSAPP
            </Button>
          </div>
        )}
      </div>

      {report.startingPoint && (
        <div style={card}>
          <Kicker color={blue}>01 · Your starting point</Kicker>
          <p style={{ margin: 0, font: "400 clamp(17px,1.5vw,21px)/1.45 var(--font-sans)", letterSpacing: "-.015em", textWrap: "pretty" }}>{report.startingPoint}</p>
          {reCounts && <span style={{ fontFamily: "var(--font-display)", fontSize: 20, textTransform: "uppercase" }}>{reCounts}</span>}
        </div>
      )}

      <CoverageGrid title="What this report covers" legend="From finished steps" rows={coverage} />

      {top.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Kicker color={blue}>02 · What matters most</Kicker>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 12 }}>
            {top.map((f, i) => {
              const m = f.key ? def(f.key) : undefined;
              return (
                <div key={f.id} style={{ border: "2px solid var(--ink)", padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 24, color: blue }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ font: "600 17px/1.3 var(--font-sans)" }}>{f.title}</span>
                  {m && <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--grey-600)" }}>{val(m)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {move.length > 0 && (
        <div style={{ border: "2px solid var(--ink)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--grey-200)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
            <Kicker color={blue}>03 · Body highlights · Movement</Kicker>
            <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>Numbers match your Movement priorities</span>
          </div>
          <div className={s.bodyGrid}>
            {(["front", "back"] as const).map((v) => (
              <div key={v} style={{ background: "var(--grey-50)", padding: "20px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: v === "back" ? "inset 1px 0 0 var(--grey-200)" : undefined }}>
                <span style={{ fontSize: 10, textTransform: "uppercase" }}>{v === "front" ? "Front" : "Back"}</span>
                <div style={{ position: "relative", width: "100%", maxWidth: 200, aspectRatio: "400/720" }}>
                  <BodyMap view={v} selected={groups} spots={spots(v)} ariaLabel={`Body highlights, ${v}`} />
                </div>
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {move.map((f, i) => {
                const m = f.key ? def(f.key) : undefined;
                return (
                  <div key={f.id} style={{ padding: "14px 18px", borderBottom: "1px solid var(--grey-200)", display: "grid", gridTemplateColumns: "32px minmax(0,1fr)", gap: "4px 10px" }}>
                    <span style={{ gridRow: "span 2", width: 26, height: 26, border: "2px solid var(--blue)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ font: "600 15px var(--font-sans)" }}>{m?.name ?? f.title}</span>
                    <span style={{ fontSize: 12, color: "var(--grey-700)" }}>{m ? `${val(m)} · ${snap?.values[m.key]?.tag ?? m.tag}` : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 12 }}>
        {breath.length > 0 && (
          <div style={{ ...card, padding: 18, gap: 12 }}>
            <Kicker color={blue}>04 · Breath</Kicker>
            {breath.map((m) => (
              <div key={m.key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11, textTransform: "uppercase" }}>
                  <span>{m.name}</span>
                  <b>{f1(m, now(m))}</b>
                </span>
                <div style={{ height: 10, background: "var(--grey-200)", position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: pctOf(m, now(m)), background: blue }} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ ...card, padding: 18, gap: 12 }}>
          <Kicker color={blue}>05 · Recovery</Kicker>
          {nights.length > 0 && <NightStrip nights={nights} height={110} axis={false} inset={2} />}
          {avg && <span style={{ fontSize: 11, color: "var(--grey-700)" }}>Sleep, 7 nights · Self reported · average {avg} h</span>}
          {rhr && (
            <span style={{ display: "flex", justifyContent: "space-between", fontSize: 11, textTransform: "uppercase", borderTop: "1px solid var(--grey-200)", paddingTop: 10 }}>
              <span>Resting heart rate · {snap?.values.rhr?.tag ?? "Measured"}</span>
              <b>{f1(rhr, now(rhr))}</b>
            </span>
          )}
        </div>
        {perf.length > 0 && (
          <div style={{ ...card, padding: 18, gap: 12 }}>
            <Kicker color={blue}>06 · Performance</Kicker>
            {perf.map((m) => (
              <div key={m.key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11, textTransform: "uppercase" }}>
                  <span>{m.name}</span>
                  <b>{f1(m, now(m))}</b>
                </span>
                <div style={{ position: "relative", height: 14, borderBottom: "2px solid var(--ink)" }}>
                  {now(m) != null && <span style={{ position: "absolute", bottom: 3, left: pctOf(m, now(m)), transform: "translateX(-50%)", width: 11, height: 11, background: blue }} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 12 }}>
        <div style={card}>
          <Kicker color={blue}>07 · What we would work on</Kicker>
          {(report.sections.workOn ?? []).map((w, i) => (
            <span key={i} style={{ font: "600 16px/1.4 var(--font-sans)" }}>
              → {w}
            </span>
          ))}
        </div>
        {report.practitionerNote && (
          <div style={{ background: "var(--grey-50)", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <Kicker color={blue}>08 · Practitioner note</Kicker>
            <span style={{ font: "400 17px/1.5 var(--font-sans)", textWrap: "pretty" }}>“{report.practitionerNote}”</span>
            <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--grey-600)" }}>{report.sections.noteBy ?? `${report.practitioner ?? "Jayraj"} · assessment coach`}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Kicker color={blue}>09 · Your recommended path</Kicker>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,2.6vw,32px)", lineHeight: 0.92, textTransform: "uppercase" }}>{pathTitle}</span>
        {report.pathReason && <span style={{ font: "400 15px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>{report.pathReason}</span>}
        {showPlans && <PlanCards recommended={report.recommendedPath} coach={data.coach} />}
      </div>

      {!print && !isRe && (
        <div className={s.noPrint}>
          <NextSteps clientId={data.client.id} reportId={report.id} />
        </div>
      )}
    </div>
  );
}
