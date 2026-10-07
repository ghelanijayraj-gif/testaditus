import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AditusMark, Button } from "@/components/ds";
import { BodyMap, type BodySpot } from "@/components/shared/BodyMap";
import { requireClient } from "@/server/auth/guards";
import { getReport, getResults, hasTrainingPlan, latestBaselineReportId, trainingProducts } from "@/server/client/results";
import { startTraining } from "@/server/client/results/actions";
import { reportUrl } from "@/components/client/results/ReportView";
import { MarkReportStep } from "@/components/client/results/ClientEffects";
import { SYSTEMS, f1, pad2, vt, type MeasureDef } from "@/lib/measures";

export const metadata: Metadata = { title: "Your report, step by step" };
export const dynamic = "force-dynamic";

const TITLES = ["Your starting point.", "The four systems.", "What matters most.", "What we would work on.", "Your recommended path.", "Start training."];
const PATH_NAME = { PERSONAL_TRAINING: "Personal Training", GROUP_TRAINING: "Group Training", EITHER: "Personal or Group Training" } as const;

/** 04 reveal: six short screens over the released baseline report (?r=&step=1..6). Skippable. */
export default async function WalkthroughPage({ searchParams }: { searchParams: Promise<{ r?: string; step?: string }> }) {
  const { client } = await requireClient();
  const sp = await searchParams;
  const id = sp.r ?? (await latestBaselineReportId(client.id));
  const [report, data] = await Promise.all([id ? getReport(client.id, id) : null, getResults(client.id)]);
  if (!report || !data) redirect("/");
  const step = Math.min(6, Math.max(1, Number(sp.step) || 1));
  const rv = step - 1;
  const url = (n: number) => `/reveal/walkthrough?r=${report.id}&step=${n}`;
  const snap = report.kind === "REASSESSMENT" ? data.reassessments.find((r) => r.assessmentId === report.assessmentId) : data.baseline;
  const def = (k: string | null) => (k ? data.defs.find((m) => m.key === k) : undefined);
  const plan = await hasTrainingPlan(client.id);
  const products = await trainingProducts();
  const path = report.recommendedPath ?? "PERSONAL_TRAINING";
  const recSlug = products.find((p) => p.kind === (path === "GROUP_TRAINING" ? "GROUP_TRAINING" : "PERSONAL_TRAINING"))?.slug ?? "pt-12";

  // Step 3: Movement priorities with right side first ("R 22° · L 36°"), self reported as "6/10, your own rating".
  const move = report.findings.filter((f) => f.sys === "movement");
  const markVal = (m: MeasureDef) => {
    const c = snap?.values[m.key];
    if (!c) return "";
    const v = c.v;
    if (v && typeof v === "object") {
      const first = m.focus;
      const other = first === "R" ? "L" : "R";
      return `${first} ${f1(m, v[first])} · ${other} ${f1(m, v[other])}`;
    }
    const t = vt(m, v, c.text) ?? "";
    return c.tag === "Self reported" ? `${t}, your own rating` : t;
  };
  const spots = (view: "front" | "back"): BodySpot[] => move.flatMap((f, i) => f.markers.filter((p) => p.view === view).map((p) => ({ id: f.id + view, x: p.x, y: p.y, n: pad2(i) })));
  const groups = [...new Set(move.flatMap((f) => f.groups))];
  const systems = report.sections.systems ?? {};
  const share = `https://wa.me/?text=${encodeURIComponent(`My ADITUS report: ${await reportUrl(report.id)}`)}`;

  return (
    <>
      <MarkReportStep reportId={report.id} step={step} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 3, flex: 1, maxWidth: 240 }} role="progressbar" aria-valuemin={1} aria-valuemax={6} aria-valuenow={step} aria-label="Walkthrough progress">
          {TITLES.map((_, i) => (
            <i key={i} style={{ height: 4, background: i <= rv ? "var(--blue)" : "var(--grey-200)", display: "block" }} />
          ))}
        </div>
        <Link href="/" style={{ height: 36, display: "flex", alignItems: "center", fontSize: 11, textTransform: "uppercase", color: "var(--grey-600)", textDecoration: "none" }}>
          Skip
        </Link>
      </div>
      <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--blue)" }}>{step} of 6</span>
      <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(30px,6vw,48px)", lineHeight: 0.88, textTransform: "uppercase" }}>{TITLES[rv]}</h1>

      {step === 1 && <span style={{ font: "400 19px/1.5 var(--font-sans)", letterSpacing: "-.01em" }}>{report.startingPoint}</span>}

      {step === 2 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "2px solid var(--ink)" }}>
          {SYSTEMS.map(([sid, name]) => (
            <div key={sid} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, boxShadow: "inset -1px -1px 0 var(--grey-200)" }}>
              <AditusMark size={32} active={sid} />
              <b style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 16, textTransform: "uppercase" }}>{name}</b>
              <span style={{ font: "400 14px/1.4 var(--font-sans)", color: "var(--grey-700)" }}>{systems[sid] ?? report.findings.find((f) => f.sys === sid)?.title ?? ""}</span>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, background: "var(--grey-50)", padding: 12 }}>
            {(["front", "back"] as const).map((v) => (
              <div key={v} style={{ position: "relative", width: "100%", aspectRatio: "400/720" }}>
                <BodyMap view={v} selected={groups} spots={spots(v)} ariaLabel={`Your Movement priorities, ${v} view`} />
              </div>
            ))}
          </div>
          <div style={{ border: "2px solid var(--ink)" }}>
            {move.map((f, i) => {
              const m = def(f.key);
              return (
                <div key={f.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--grey-200)", display: "grid", gridTemplateColumns: "32px 1fr", gap: "3px 10px" }}>
                  <span style={{ gridRow: "span 2", width: 26, height: 26, border: "2px solid var(--blue)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{pad2(i)}</span>
                  <b style={{ font: "600 15px var(--font-sans)" }}>{f.title}</b>
                  <span style={{ fontSize: 12, color: "var(--grey-700)" }}>{m ? markVal(m) : ""}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {step === 4 &&
        (report.sections.workOn ?? []).map((t, i) => (
          <div key={i} style={{ border: "2px solid var(--ink)", padding: 16, display: "grid", gridTemplateColumns: "36px 1fr", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--blue)" }}>{pad2(i)}</span>
            <span style={{ font: "600 16px/1.4 var(--font-sans)" }}>{t}</span>
          </div>
        ))}

      {step === 5 && (
        <>
          <span style={{ font: "400 17px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>
            {report.practitioner ?? "Jayraj"} recommends {PATH_NAME[path]} first. {report.pathReason ?? ""}
          </span>
          {products.map((p) => {
            const pt = p.kind === "PERSONAL_TRAINING";
            const rec = p.slug === recSlug;
            return (
              <div key={p.id} style={{ border: "2px solid var(--ink)", padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: rec ? "var(--ice)" : "#fff" }}>
                <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <b style={{ font: "600 16px var(--font-sans)" }}>
                    {p.name} · {p.sessions} {pt ? "sessions" : "classes"}
                  </b>
                  <span style={{ fontSize: 11, color: "var(--grey-700)" }}>
                    {pt ? `1:1${data.coach ? " with " + data.coach : ""}` : "Mobility Lab and Fundamentals"} · {p.validityDays} days{rec ? " · recommended" : ""}
                  </span>
                </span>
                <b style={{ font: "600 17px var(--font-sans)" }}>{p.priceLabel}</b>
              </div>
            );
          })}
        </>
      )}

      {step === 6 && (
        <>
          <span style={{ font: "400 18px/1.45 var(--font-sans)" }}>
            {plan ? "Your plan is active. Your next session is on your calendar." : `Pay on Shopify and your full dashboard opens. Your first session${data.coach ? " with " + data.coach : ""} is the next thing to book.`}
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Button variant="outline" size="md" full href={`/reports/${report.id}/print`}>
              DOWNLOAD PDF
            </Button>
            <Button variant="outline" size="md" full href={share}>
              SHARE ON WHATSAPP
            </Button>
          </div>
        </>
      )}

      <form action={startTraining} style={{ position: "sticky", bottom: 0, zIndex: 3, background: "rgba(255,255,255,.97)", borderTop: "1px solid var(--grey-200)", padding: "12px 0", display: "grid", gridTemplateColumns: step > 1 ? "auto 1fr" : "1fr", gap: 8, marginTop: "auto" }}>
        <input type="hidden" name="productSlug" value={recSlug} />
        {step > 1 && (
          <Button variant="outline" size="lg" href={url(step - 1)} aria-label="Back">
            ←
          </Button>
        )}
        {step < 6 ? (
          <Button variant="ink" size="lg" full href={url(step + 1)}>
            NEXT →
          </Button>
        ) : plan ? (
          <Button variant="blue" size="lg" full href="/">
            GO TO MY DASHBOARD →
          </Button>
        ) : (
          <Button variant="blue" size="lg" full type="submit">
            START TRAINING →
          </Button>
        )}
      </form>
    </>
  );
}
