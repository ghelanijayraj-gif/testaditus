import Link from "next/link";
import { AditusMark, Button } from "@/components/ds";
import { AssessmentHome } from "@/components/client/plan/AssessmentHome";
import { getClientPhase } from "@/server/client/phase";
import { getHomeModel } from "@/server/client/shell/home";
import { renewPlan } from "@/server/client/shell/actions";
import s from "./home.module.css";

// CONTRACT (owned by the Shell area): Home page body for a client (05 Home, or the
// Plan area's AssessmentHome before the report is released).
export async function HomeView({ clientId, readOnly }: { clientId: string; readOnly?: boolean }) {
  const ph = await getClientPhase(clientId);
  if (!ph.baseline?.releasedAt && !ph.plan) return <AssessmentHome clientId={clientId} readOnly={readOnly} />;
  const m = await getHomeModel(clientId);
  const ro = !!readOnly;
  const L = (href: string) => (ro ? undefined : href);

  return (
    <div className={s.grid}>
      <div className={s.left}>
        {m.step && (
          <div className={`${s.stepWrap} ${s.o1}`}>
            <h1 className={s.h1}>{m.greeting}</h1>
            <div className={s.step}>
              <div className={s.stepL}>
                <span className={s.stepK}>Your next step · {m.step.kicker}</span>
                <span className={s.stepT}>{m.step.title}</span>
                <span className={s.stepLine}>{m.step.line}</span>
              </div>
              {m.step.cta && (
                <div className={s.stepR}>
                  <Button variant="white" size="md" full href={L(m.step.cta.href)} disabled={ro}>
                    {m.step.cta.label}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {m.endChoice && (
          <>
            <div className={`${s.endHead} ${s.o1}`}>
              <span className={s.kicker}>{m.endChoice.kicker}</span>
              <h1 className={s.endH1}>What would you like to do next?</h1>
              <span className={s.body16}>Your reports, Compare and documents stay available while you decide. No rush.</span>
            </div>
            <div className={`${s.endCards} ${s.o1}`}>
              <div className={s.endCard}>
                <span className={s.k10} style={{ color: "var(--blue)" }}>
                  Keep going
                </span>
                <b>Renew.</b>
                <span className={s.body15}>{m.endChoice.coach} suggests {m.endChoice.total} more sessions to keep building. Your history and Compare carry over.</span>
                <form action={renewPlan}>
                  <Button variant="ink" size="md" type="submit" disabled={ro}>
                    RENEW PLAN →
                  </Button>
                </form>
              </div>
              <div className={s.endCard}>
                <span className={s.k10} style={{ color: "var(--grey-600)" }}>
                  Finish here
                </span>
                <b>Do not renew.</b>
                <span className={s.body15}>We prepare an export of everything. You keep read access for a short grace period.</span>
                <Button variant="outline" size="md" href={L("/export")} disabled={ro}>
                  PREPARE MY EXPORT →
                </Button>
              </div>
            </div>
          </>
        )}

        {m.planStrip && (
          <div className={`${s.plan} ${s.o4}`}>
            <span className={s.planFirst}>
              <span className={s.planTop}>
                <span>{m.planStrip.kind}</span>
                <b>{m.planStrip.status}</b>
              </span>
              <span className={s.segs} style={{ gridTemplateColumns: `repeat(${m.planStrip.total},1fr)` }} aria-label={`${m.planStrip.used} of ${m.planStrip.total} used`}>
                {Array.from({ length: m.planStrip.total }, (_, i) => (
                  <i key={i} style={{ background: i < m.planStrip!.used ? "var(--blue)" : "var(--grey-200)" }} />
                ))}
              </span>
            </span>
            <span className={s.stat}>
              <span>Used</span>
              <b>{m.planStrip.used}</b>
            </span>
            <span className={s.stat}>
              <span>Left</span>
              <b>{m.planStrip.left}</b>
            </span>
            <span className={s.stat}>
              <span>Days left</span>
              <b>{m.planStrip.days}</b>
            </span>
            <span className={s.stat}>
              <span>Ends</span>
              <b className={s.small}>{m.planStrip.ends}</b>
            </span>
          </div>
        )}

        {m.showJourney && (
          <div className={`${s.journey} ${s.o2}`}>
            <div className={s.cardHead}>
              <span className={s.cardTitle}>Your journey.</span>
              <span className={s.jStatus}>{m.journey.status}</span>
            </div>
            <div className={s.jScroll}>
              <div className={s.jGrid}>
                <span className={s.jLab} style={{ gridColumn: 1 }}>
                  Baseline
                </span>
                {m.journey.winStart > 1 && (
                  <span className={s.jLab} style={{ gridColumn: `2 / span ${m.journey.winStart - 1}`, color: "var(--grey-700)" }}>
                    Training
                  </span>
                )}
                <span className={s.jLab} style={{ gridColumn: `${m.journey.winStart + 1} / span ${13 - m.journey.winStart}`, color: "var(--blue)" }}>
                  {m.journey.windowLabel}
                </span>
                <span className={s.jLab} style={{ gridColumn: 14 }}>
                  Compare
                </span>
                <div className={s.jCell} style={m.journey.baseDone ? { background: "var(--ink)", color: "#fff" } : { background: "#fff" }}>
                  {m.journey.baseDone ? "✓ Done" : "To do"}
                </div>
                {m.journey.weeks.map((w) => (
                  <div key={w.n} className={`${s.wk} ${s["wk_" + w.state]}`} aria-label={`Week ${w.n}${w.state === "now" ? ", now" : ""}`}>
                    {w.state === "now" ? "NOW" : ""}
                  </div>
                ))}
                <div className={s.jCell} style={m.journey.reassessed ? { background: "var(--blue)", color: "#fff" } : { background: "#fff", color: "var(--grey-600)", boxShadow: "inset 0 0 0 1.5px var(--grey-300)" }}>
                  {m.journey.reassessed ? "Ready" : "Locked"}
                </div>
                <span className={s.jFoot}>{m.journey.startLabel}</span>
                {m.journey.weeks.map((w) => (
                  <span key={w.n} className={s.jFoot} style={{ textAlign: "center", color: w.state === "now" ? "var(--ink)" : undefined }}>
                    W{w.n}
                  </span>
                ))}
                <span className={s.jFoot}>After retest</span>
              </div>
            </div>
          </div>
        )}

        {m.showJourney && (
          <div className={`${s.tiles} ${s.o3}`}>
            {m.tiles.map((t) => (
              <Link key={t.id} href={ro ? "#" : `/assessment?sys=${t.id}`} className={s.tile} aria-disabled={ro || undefined}>
                <span className={s.tileTop}>
                  <AditusMark size={44} active={t.id} />
                  <span className={s.meta10}>{t.count}</span>
                </span>
                <span className={s.tileName}>{t.name}</span>
                <span className={s.tileTopLine}>{t.top}</span>
                <span className={s.open11}>Open →</span>
              </Link>
            ))}
          </div>
        )}

        <div className={`${s.card} ${s.o5}`}>
          <div className={s.hsHead}>
            <span className={s.hsTitle}>Between sessions.</span>
            <Link href={ro ? "#" : "/health"} className={s.open11}>
              Health data →
            </Link>
          </div>
          {m.health.connected ? (
            <>
              <div className={s.hsGrid}>
                {m.health.items.map((x) => (
                  <div key={x.k} className={s.hsCell}>
                    <span className={s.hsK}>{x.k}</span>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                      <span className={s.hsV}>{x.v}</span>
                      <span style={{ fontSize: 11 }}>{x.u}</span>
                    </span>
                    <span style={{ fontSize: 10, color: "var(--grey-600)" }}>{x.d}</span>
                  </div>
                ))}
              </div>
              <span className={s.hsFoot}>{m.health.footer}</span>
            </>
          ) : (
            <div className={s.hsEmpty}>
              <span className={s.body15}>Connect Apple Health or another app so your coach sees sleep and heart rate between sessions. Optional.</span>
              <Button variant="outline" size="sm" href={L("/health")} disabled={ro}>
                CONNECT →
              </Button>
            </div>
          )}
        </div>
      </div>

      <aside className={s.right}>
        {m.latestReport && (
          <div className={`${s.latest} ${s.o6}`}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>Latest report</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ font: "600 16px var(--font-sans)" }}>{m.latestReport.title}</span>
                <span style={{ fontSize: 11, color: "var(--grey-600)", textTransform: "uppercase" }}>{m.latestReport.meta}</span>
              </div>
              <Link href={ro ? "#" : m.latestReport.href} style={{ fontSize: 12, textTransform: "uppercase", textDecoration: "none", fontWeight: 700, whiteSpace: "nowrap" }}>
                Open →
              </Link>
            </div>
          </div>
        )}
        <div className={`${s.side} ${s.o7}`}>
          <div className={s.docHead}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>Recent documents</span>
            <Link href={ro ? "#" : "/documents"} style={{ fontSize: 11, textTransform: "uppercase", textDecoration: "none", fontWeight: 700 }}>
              All →
            </Link>
          </div>
          {m.recentDocs.map((d) => (
            <Link key={d.id} href={ro ? "#" : d.href} className={s.docRow}>
              <span style={{ font: "600 14px var(--font-sans)" }}>{d.name}</span>
              <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>{d.meta}</span>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
