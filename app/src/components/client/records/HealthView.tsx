import Link from "next/link";
import { AditusMark } from "@/components/ds";
import { getHealthView } from "@/server/client/records/health";
import { retrySource } from "@/server/client/records/actions";
import { prisma } from "@/server/db";
import { SYSTEMS, fmtMetric } from "./catalog";
import { PageHead } from "./parts";
import { ActBtn } from "./ui";
import { HealthSources } from "./HealthSources";
import { TrendChart } from "./TrendChart";
import s from "./records.module.css";

export async function HealthView({ clientId, sys, metric, range }: { clientId: string; sys?: string; metric?: string; range?: string }) {
  const v = await getHealthView(clientId, { sys, metric, range });
  const coaches = await prisma.clientCoach.findMany({ where: { clientId }, include: { staff: { include: { user: true } } } });
  const coachNames = [...new Set(coaches.filter((c) => c.staff.shownToClients).map((c) => c.staff.user.name ?? ""))].filter(Boolean);
  const coachLine = coachNames.length ? coachNames.join(" and ") : "your coaches";
  const href = (p: { sys?: string; metric?: string; range?: number }) => {
    const q = new URLSearchParams();
    const sy = p.sys ?? v.sys;
    if (sy !== "movement") q.set("sys", sy);
    if (p.metric) q.set("metric", p.metric);
    const r = p.range ?? v.range;
    if (r !== 90) q.set("range", String(r));
    const qs = q.toString();
    return "/health" + (qs ? "?" + qs : "");
  };

  return (
    <div className={s.page} style={{ maxWidth: 1180 }}>
      <PageHead kicker="Synced from your apps · informs your coach, never diagnoses" title="Health data." who="Who can see this: you, your coaches and the head coach" />

      {v.errors.map((e) => (
        <div key={e.provider} style={{ background: "var(--ice)", padding: "14px 18px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, boxShadow: "inset 4px 0 0 #101828" }}>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <b style={{ font: "600 15px var(--font-sans)" }}>{e.title}</b>
            <span style={{ fontSize: 12, color: "var(--grey-700)" }}>{e.line}</span>
          </span>
          <ActBtn action={retrySource.bind(null, e.provider)} variant="ink" size="sm" disabled={v.readOnly}>
            TRY AGAIN
          </ActBtn>
        </div>
      ))}

      {!v.anyOn && (
        <div className={s.card} style={{ padding: "clamp(20px,3vw,32px)", gap: 12, maxWidth: 720 }}>
          <span className={s.display24}>Nothing connected yet.</span>
          <span className={s.body}>Connect an app and your coach sees sleep, resting heart rate and activity between sessions. You choose exactly what is shared. Optional.</span>
        </div>
      )}
      {v.readOnly && <span style={{ fontSize: 12, color: "var(--grey-700)" }}>Your plan has ended. Nothing new is synced. You can still read everything here.</span>}

      <div className={s.healthGrid}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          {v.anyOn && (
            <>
              <nav aria-label="Systems" style={{ display: "flex", overflowX: "auto", borderBottom: "2px solid var(--ink)", scrollbarWidth: "none" }}>
                {SYSTEMS.map((t) => {
                  const on = t.id === v.sys;
                  return (
                    <Link key={t.id} href={href({ sys: t.id })} scroll={false} aria-current={on ? "page" : undefined} className={s.sysTab} style={{ background: on ? "var(--ink)" : "#fff", color: on ? "#fff" : "var(--ink)" }}>
                      <AditusMark size={26} active={t.id} color={on ? "#FFFFFF" : "#006DE0"} muted={on ? "#475467" : "#BDEBFF"} />
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 13, textTransform: "uppercase" }}>{t.name}</span>
                    </Link>
                  );
                })}
              </nav>
              {v.metrics.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,170px),1fr))", border: "2px solid var(--ink)" }}>
                  {v.metrics.map((m) => {
                    const on = m.id === v.cur?.id;
                    return (
                      <Link key={m.id} href={href({ metric: m.id })} scroll={false} aria-current={on ? "true" : undefined} className={s.tile} style={{ background: on ? "var(--ice)" : undefined, boxShadow: `inset -1px 0 0 var(--grey-200)${on ? ",inset 0 -4px 0 #006DE0" : ""}` }}>
                        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>{m.name}</span>
                        <span style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: 30, lineHeight: 0.9 }}>{fmtMetric(m, m.latest)}</span>
                          <span style={{ fontSize: 11 }}>{m.unit}</span>
                        </span>
                        <span style={{ fontSize: 10, color: "var(--grey-600)" }}>
                          {m.via} · {m.sync}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p style={{ margin: 0, font: "400 15px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>None of your connected apps share {v.sysName} data yet.</p>
              )}
              {v.cur && v.chart && (
                <div className={s.card}>
                  <div style={{ padding: "14px 18px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }} className={s.rowLine}>
                    <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ font: "600 16px var(--font-sans)" }}>
                        {v.cur.name} · {v.cur.desc}
                      </span>
                      <span className={s.meta}>
                        Source {v.cur.via} · last sync {v.cur.sync}
                      </span>
                    </span>
                    <div className={s.seg} role="group" aria-label="Range">
                      {[7, 30, 90].map((n) => (
                        <Link key={n} href={href({ metric: v.cur!.id, range: n })} scroll={false} className={`${s.segBtn} ${v.range === n ? s.segOn : ""}`} aria-current={v.range === n ? "true" : undefined}>
                          {n} days
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: "16px 18px 8px", position: "relative", aspectRatio: "3/1", minHeight: 180 }}>
                    <TrendChart {...v.chart} dec={v.cur.dec} unit={v.cur.unit} pace={v.cur.pace} label={`${v.cur.name}, last ${v.range} days`} />
                  </div>
                  <div style={{ padding: "8px 18px 14px", display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 10, textTransform: "uppercase", color: "var(--grey-700)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><i style={{ width: 14, height: 2, background: "var(--ink)", display: "block" }} />Daily value</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--blue)", display: "block" }} />Latest</span>
                    {v.chart.legendBaseline && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><i style={{ width: 2, height: 12, background: "var(--blue)", display: "block" }} />{v.chart.legendBaseline}</span>}
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><i style={{ width: 6, height: 6, background: "var(--periwinkle)", display: "block" }} />Session day</span>
                    {v.chart.legendWindow && <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{v.chart.window && <i style={{ width: 10, height: 10, background: "var(--ice)", display: "block" }} />}{v.chart.legendWindow}</span>}
                  </div>
                </div>
              )}
              {v.note && (
                <div style={{ background: "var(--grey-50)", padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em" }}>Used by your coach · {v.sysName}</span>
                  <span style={{ font: "400 16px/1.5 var(--font-sans)" }}>“{v.note.text}”</span>
                  <span className={s.meta}>{v.note.by}</span>
                </div>
              )}
            </>
          )}
        </div>
        <HealthSources sources={v.sources} closed={v.readOnly} coaches={coachLine} />
      </div>
    </div>
  );
}
