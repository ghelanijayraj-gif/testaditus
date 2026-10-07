import Link from "next/link";
import { AditusMark, Button, Pill } from "@/components/ds";
import { now } from "@/lib/clock";
import {
  SYSTEMS,
  change,
  compareText,
  dDay,
  dLong,
  dShort,
  counts,
  f1,
  n1,
  pad2,
  pctOf,
  pick,
  status,
  statusUI,
  sysName,
  vt,
  type MeasureDef,
  type Status,
  type SysId,
  type Val,
} from "@/lib/measures";
import { getReport, type ResultsData, type Snapshot } from "@/server/client/results";
import { prisma } from "@/server/db";
import { DetailTag, ListTag, NightStrip, StatusChip, WhoCanSee } from "./bits";
import { MovementLocator } from "./MovementLocator";
import { Ribcage } from "./Ribcage";
import { SystemSwipe } from "./SystemSwipe";
import s from "./results.module.css";

export type AssessmentParams = { mode?: string; sys?: string; m?: string; hist?: string };
type Mode = "baseline" | "re" | "compare";

const DEFAULT_SEL: Record<SysId, string> = { movement: "hipIR", breathwork: "ribs", recovery: "sleep", performance: "goblet" };
const longDay = (d: Date) => dDay(d).split(" ")[0] + " " + dLong(d);
const weekday = (d: Date) => dDay(d).split(" ")[0];

/** 05 Assessment page (Baseline · Reassessment · Compare). Rendered once a baseline report is released. */
export async function AssessmentView({ data, params, basePath = "/assessment" }: { data: ResultsData; params: AssessmentParams; basePath?: string }) {
  const base = data.baseline!;
  const res = data.reassessments;
  const hasRe = res.length > 0;
  const hasHist = res.length >= 2;
  let mode: Mode = params.mode === "baseline" || params.mode === "re" || params.mode === "compare" ? params.mode : hasRe ? "compare" : "baseline";
  if (mode === "compare" && !hasRe) mode = "baseline";
  const isCompare = mode === "compare";
  const histN = Math.min(Math.max(1, Number(params.hist) || res.length || 1), Math.max(1, res.length));
  const target: Snapshot | null = hasRe ? res[histN - 1] : null;
  const sys: SysId = (SYSTEMS.find(([k]) => k === params.sys)?.[0] ?? "movement") as SysId;
  const sysList = data.defs.filter((m) => m.sys === sys);
  const sel = sysList.find((m) => m.key === params.m) ?? sysList.find((m) => m.key === DEFAULT_SEL[sys]) ?? sysList[0];
  const selIdx = sel ? sysList.indexOf(sel) : 0;
  const due = data.reDueFrom!;
  const dueLabel = "Due from " + dShort(due);

  const href = (p: Partial<{ mode: Mode; sys: SysId; m: string | null; hist: number }>) => {
    const q = new URLSearchParams();
    const md = p.mode ?? mode;
    q.set("mode", md);
    q.set("sys", p.sys ?? sys);
    const m = p.m === undefined ? (p.sys && p.sys !== sys ? null : (sel?.key ?? null)) : p.m;
    if (m) q.set("m", m);
    const h = p.hist ?? (hasHist ? histN : undefined);
    if (h && hasHist) q.set("hist", String(h));
    return `${basePath}?${q.toString()}`;
  };

  // Values per mode
  const baseV = (m: MeasureDef): Val => base.values[m.key]?.v ?? null;
  const reV = (m: MeasureDef): Val => target?.values[m.key]?.v ?? null;
  const valFor = (m: MeasureDef): Val => (mode === "re" ? reV(m) : baseV(m));
  const textFor = (m: MeasureDef) => (mode === "re" ? target?.values[m.key]?.text : base.values[m.key]?.text) ?? null;
  const bv = (m: MeasureDef): Val => (isCompare ? reV(m) : valFor(m));
  const comparable = (m: MeasureDef) => {
    const a = base.values[m.key],
      b = target?.values[m.key];
    if (!a || !b) return true;
    return a.comparable && b.comparable && a.tag === b.tag && !(a.method && b.method && a.method !== b.method);
  };
  const st = (m: MeasureDef): Status => status(m, baseV(m), reV(m), comparable(m));
  const howOf = (m: MeasureDef) => (mode !== "baseline" ? target?.values[m.key]?.method : undefined) ?? base.values[m.key]?.method ?? m.how;
  const tagOf = (m: MeasureDef) => (mode !== "baseline" ? target?.values[m.key]?.tag : undefined) ?? base.values[m.key]?.tag ?? m.tag;

  const noneState = mode === "re" && !hasRe;
  const name = data.client.name;
  const cmpLabel = hasHist && histN >= 2 ? `Baseline vs reassessment ${histN}` : "Baseline vs reassessment";
  const dateLine = isCompare ? cmpLabel : mode === "re" ? (target ? "Reassessment · " + longDay(target.date) : "Reassessment · due from " + dShort(due)) : "Baseline · " + longDay(base.date);
  const modeHint = target ? `Baseline ${dShort(base.date)} · Reassessment ${dShort(target.date)}` : `Compare unlocks after your reassessment, due from ${dShort(due)}.`;
  const who = data.coach ? `Who can see this: you, Coach ${data.coach} and the head coach` : "Who can see this: you, your coaches and the head coach";
  const coach = data.coach ?? "Your coach";

  const header = (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span className={s.kicker}>
          {name} · {dateLine}
        </span>
        <h1 className={s.h1}>Assessment.</h1>
        <WhoCanSee text={who} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", maxWidth: "100%" }}>
        <nav className={s.seg} aria-label="Assessment view">
          {(
            [
              ["baseline", "Baseline"],
              ["re", "Reassessment"],
              ["compare", "Compare"],
            ] as [Mode, string][]
          ).map(([k, l]) => {
            const dis = k === "compare" && !hasRe,
              on = mode === k;
            const st2 = { background: on ? "var(--ink)" : "#fff", color: dis ? "var(--grey-400)" : on ? "#fff" : "var(--ink)", cursor: dis ? "not-allowed" : "pointer" };
            return dis ? (
              <span key={k} className={s.segBtn} style={st2} aria-disabled="true" title={modeHint}>
                {l}
              </span>
            ) : (
              <Link key={k} href={href({ mode: k })} scroll={false} className={s.segBtn} style={st2} aria-current={on ? "page" : undefined}>
                {l}
              </Link>
            );
          })}
        </nav>
        <span style={{ fontSize: 11, color: "var(--grey-600)", textAlign: "right" }}>{modeHint}</span>
        <Link href={`/reveal?r=${base.reportId}`} className={s.link} style={{ fontSize: 11 }}>
          Walk me through my report →
        </Link>
      </div>
    </div>
  );

  if (noneState) {
    const booked = await prisma.session.count({ where: { clientId: data.client.id, type: "REASSESSMENT", status: { in: ["SCHEDULED", "CONFIRMED"] } } });
    const open = now() >= due;
    const label = booked ? "REASSESSMENT BOOKED" : open ? "BOOK REASSESSMENT →" : "REASSESSMENT FROM " + dShort(due).toUpperCase();
    return (
      <div className={s.root}>
        {header}
        <div style={{ border: "2px solid var(--ink)", padding: "clamp(20px,3vw,32px)", display: "flex", flexDirection: "column", gap: 12, maxWidth: 720 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 0.92, textTransform: "uppercase" }}>Reassessment due from {dShort(due)}.</span>
          <span style={{ font: "400 16px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>We retest every baseline measure, in the same order, with the same coach. Book once the window opens.</span>
          <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--grey-600)" }}>We measure Movement, Breath, Recovery and Performance. Each has its own list of measures.</span>
          <span>
            <Button variant={open && !booked ? "blue" : "outline"} size="md" disabled={!open || !!booked} href={open && !booked ? "/calendar?book=reassessment" : undefined}>
              {label}
            </Button>
          </span>
        </div>
      </div>
    );
  }

  // ── Compare summary ──
  const allSt = data.defs.map(st);
  const notes = target ? data.notes[target.assessmentId] : undefined;
  const ncCount = allSt.filter((x) => x === "nc").length,
    newCount = allSt.filter((x) => x === "new").length;
  const compareSummary = isCompare && (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", border: "2px solid var(--ink)" }}>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10, boxShadow: "inset -1px 0 0 var(--grey-200)" }}>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--grey-600)" }}>All four systems · {cmpLabel}</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,2.2vw,28px)", lineHeight: 0.95, textTransform: "uppercase" }}>{counts(allSt)}</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 11, textTransform: "uppercase" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <i style={{ width: 12, height: 12, background: "var(--blue)", display: "block" }} />
            Improved
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <i style={{ width: 12, height: 12, boxShadow: "inset 0 0 0 1.5px var(--ink)", display: "block" }} />
            Unchanged
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <i style={{ width: 12, height: 12, background: "var(--grey-400)", display: "block" }} />
            Lower than baseline
          </span>
        </div>
        {(ncCount > 0 || newCount > 0) && (
          <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>
            {allSt.filter((x) => x === "up" || x === "same" || x === "down").length} compared · {ncCount} different method · {newCount} new
          </span>
        )}
      </div>
      {notes?.overall && (
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8, background: "var(--grey-50)" }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em" }}>{notes.overall.coach} · overall</span>
          <span style={{ font: "400 16px/1.45 var(--font-sans)", textWrap: "pretty" }}>“{notes.overall.text}”</span>
        </div>
      )}
    </div>
  );

  // ── Tabs ──
  const sysIds = SYSTEMS.map(([k]) => k);
  const si = sysIds.indexOf(sys);
  const tabs = (
    <nav id="assessment-systems" className={s.tabs} aria-label="Systems">
      {SYSTEMS.map(([id, nm]) => {
        const on = sys === id,
          l = data.defs.filter((m) => m.sys === id);
        const sub = isCompare ? counts(l.map(st)).split(",")[0] : l.length + " measures";
        return (
          <Link key={id} href={href({ sys: id })} scroll={false} className={s.tab} aria-current={on ? "page" : undefined} style={{ background: on ? "var(--ink)" : "#fff", color: on ? "#fff" : "var(--ink)", boxShadow: on ? "none" : "inset -1px 0 0 var(--grey-200)" }}>
            <AditusMark size={30} active={id} color={on ? "#FFFFFF" : "#006DE0"} muted={on ? "#475467" : "#BDEBFF"} />
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 15, textTransform: "uppercase" }}>{nm}</span>
              <span style={{ fontSize: 10, textTransform: "uppercase", opacity: 0.75, whiteSpace: "nowrap" }}>{sub}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );

  // ── Measure list ──
  const list = (
    <div style={{ display: "flex", flexDirection: "column", border: "2px solid var(--ink)", minWidth: 0 }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--grey-200)", display: "flex", justifyContent: "space-between", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>
        <span>{sysName(sys)} measures</span>
        <span style={{ color: "var(--grey-600)" }}>{sysList.length} measures</span>
      </div>
      {sysList.map((m) => {
        const on = m.key === sel?.key;
        let val: string;
        let stv: Status | null = null;
        if (isCompare) {
          stv = st(m);
          val = stv === "none" ? "Not retested" : compareText(m, baseV(m), reV(m), stv, target?.values[m.key]?.text);
        } else {
          const v = valFor(m);
          val = vt(m, v, textFor(m)) ?? (mode === "re" ? dueLabel : "Not tested at baseline");
        }
        return (
          <Link key={m.key} href={href({ m: m.key })} scroll={false} className={s.rowBtn} aria-current={on ? "true" : undefined} style={{ borderBottom: "1px solid var(--grey-200)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, background: on ? "var(--ice)" : "#fff", boxShadow: on ? "inset 4px 0 0 #006DE0" : "none" }}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
              <span style={{ font: "600 15px/1.3 var(--font-sans)" }}>{m.name}</span>
              <ListTag tag={tagOf(m)} />
            </span>
            <span style={{ display: "flex", flexWrap: stv === "nc" ? "wrap" : "nowrap", justifyContent: "space-between", gap: 10, alignItems: "center", fontSize: 12 }}>
              <span>{val}</span>
              {stv && stv !== "none" && <StatusChip st={stv} />}
            </span>
          </Link>
        );
      })}
    </div>
  );

  // ── Centre visual ──
  const barRow = (label: string, v: number | null, m: MeasureDef, bg: string, bd = "none", h = 14) => ({ label, txt: v == null ? "Not tested" : f1(m, v), pct: v == null ? "0%" : pctOf(m, v), bg, bd, h });
  type Bar = ReturnType<typeof barRow>;
  const Bars = ({ bars }: { bars: Bar[] }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {bars.map((b) => (
        <div key={b.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ display: "flex", justifyContent: "space-between", fontSize: 11, textTransform: "uppercase" }}>
            <span>{b.label}</span>
            <b>{b.txt}</b>
          </span>
          <div style={{ height: b.h, background: "var(--grey-200)", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: b.pct, background: b.bg, boxShadow: b.bd, transition: "width .45s cubic-bezier(.2,.7,.1,1)" }} />
          </div>
        </div>
      ))}
    </div>
  );

  let visual: React.ReactNode = null;
  if (sys === "movement" && sel) {
    let bars: Bar[] = [],
      diff = "",
      diffLabel = "";
    if (isCompare) {
      const stv = st(sel);
      const reBg = stv === "same" ? "transparent" : stv === "down" ? "var(--grey-600)" : "var(--blue)";
      const reBd = stv === "same" ? "inset 0 0 0 2px #101828" : "none";
      const b0 = baseV(sel),
        r0 = reV(sel);
      if (sel.sides) {
        for (const k of ["L", "R"] as const) {
          const nm = k === "L" ? "Left" : "Right";
          const bb = b0 && typeof b0 === "object" ? b0[k] : null,
            rr = r0 && typeof r0 === "object" ? r0[k] : null;
          bars.push(barRow(nm + " · baseline", bb, sel, "var(--grey-300)"), barRow(nm + " · reassessment", rr, sel, reBg, reBd));
        }
      } else bars = [barRow("Baseline", pick(sel, b0), sel, "var(--grey-300)", "none", 18), barRow("Reassessment", pick(sel, r0), sel, reBg, reBd, 18)];
      diffLabel = "Change";
      diff = change(sel, b0, r0) || "New";
    } else {
      const v = valFor(sel);
      if (v != null && typeof v === "object") {
        bars = [barRow("Left", v.L, sel, sel.focus === "L" ? "var(--blue)" : "var(--ink)", "none", 22), barRow("Right", v.R, sel, sel.focus === "R" ? "var(--blue)" : "var(--ink)", "none", 22)];
        if (v.L != null && v.R != null) {
          diffLabel = "Difference left to right";
          diff = n1(Math.abs(v.L - v.R)) + sel.unit;
        }
      } else if (v != null) bars = [barRow(sel.name, v, sel, "var(--blue)", "none", 22)];
    }
    const scaleNote = sel.criteria ? "Scored " + sel.criteria : "Shared scale 0 to " + f1(sel, sel.max);
    visual = (
      <div className={s.split}>
        <MovementLocator key={sel.key} view={sel.view ?? "front"} selected={sel.groups} items={sysList.map((m) => ({ key: m.key, groups: m.groups, href: href({ m: m.key }) }))} />
        <div style={{ padding: "clamp(16px,2vw,24px)", display: "flex", flexDirection: "column", gap: 16, justifyContent: "center", minWidth: 0 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--grey-600)" }}>{howOf(sel)}</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,2vw,28px)", lineHeight: 0.92, textTransform: "uppercase" }}>{sel.name}</span>
          {bars.length > 0 ? <Bars bars={bars} /> : <span style={{ fontSize: 12 }}>{mode === "re" ? dueLabel : "Not tested at baseline"}</span>}
          {diff && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, borderTop: "1px solid var(--grey-200)", paddingTop: 12 }}>
              <span style={{ fontSize: 11, textTransform: "uppercase" }}>{diffLabel}</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>{diff}</span>
            </div>
          )}
          <span style={{ fontSize: 10, color: "var(--grey-600)" }}>{scaleNote}</span>
        </div>
      </div>
    );
  }

  if (sys === "breathwork") {
    const gm = (k: string) => data.defs.find((m) => m.key === k);
    const num = (m?: MeasureDef) => (m ? pick(m, bv(m)) : null);
    const gauges = ["ribsUpper", "ribs", "ribsBack"].map(gm).filter(Boolean) as MeasureDef[];
    const hold = gm("hold");
    const holdV = num(hold);
    const holdB = hold ? pick(hold, baseV(hold)) : null;
    visual = (
      <div className={s.split}>
        <div style={{ background: "var(--grey-50)", padding: "24px 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 300, aspectRatio: "300/320" }}>
            <Ribcage id="assess" selected={sel?.key ?? null} u={num(gm("ribsUpper")) ?? 0} l={num(gm("ribs")) ?? 0} b={num(gm("ribsBack")) ?? 0} />
          </div>
        </div>
        <div style={{ padding: "clamp(16px,2vw,24px)", display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--grey-600)" }}>Rib expansion · tape at three levels, full breath in and out</span>
          {gauges.map((m, i) => {
            const v = num(m),
              b0 = pick(m, baseV(m));
            return (
              <Link key={m.key} href={href({ m: m.key })} scroll={false} className={s.rowBtn} style={{ background: sel?.key === m.key ? "var(--ice)" : "transparent", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ display: "flex", justifyContent: "space-between", fontSize: 11, textTransform: "uppercase" }}>
                  <span>
                    {pad2(i)} · {m.gauge}
                  </span>
                  <b>{v == null ? "Due" : f1(m, v) + (isCompare ? " · " + change(m, baseV(m), reV(m)) : "")}</b>
                </span>
                <div style={{ height: 12, background: "var(--grey-200)", position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: v == null ? "0%" : pctOf(m, v), background: "var(--blue)", transition: "width .45s" }} />
                  {isCompare && b0 != null && <div style={{ position: "absolute", top: -4, bottom: -4, left: pctOf(m, b0), width: 2, background: "var(--ink)" }} />}
                </div>
                <span style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--grey-600)" }}>
                  <span>0 cm</span>
                  <span>{isCompare && b0 != null ? "Line marks baseline " + f1(m, b0) : ""}</span>
                  <span>{f1(m, m.max)}</span>
                </span>
              </Link>
            );
          })}
          {hold && (
            <div style={{ borderTop: "1px solid var(--grey-200)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ display: "flex", justifyContent: "space-between", fontSize: 11, textTransform: "uppercase" }}>
                <span>Breath hold after a normal exhale</span>
                <b>{holdV == null ? "Due" : f1(hold, holdV) + (isCompare ? " · " + change(hold, baseV(hold), reV(hold)) : "")}</b>
              </span>
              <div style={{ position: "relative", height: 24, borderBottom: "2px solid var(--ink)" }}>
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <span key={i} style={{ position: "absolute", bottom: -2, left: (i / 6) * 100 + "%", width: 1, height: 8, background: "var(--ink)" }} />
                ))}
                {isCompare && holdB != null && <span style={{ position: "absolute", bottom: 4, left: pctOf(hold, holdB), transform: "translateX(-50%)", width: 14, height: 14, border: "2px solid var(--ink)", borderRadius: "50%", background: "#fff" }} />}
                {holdV != null && <span style={{ position: "absolute", bottom: 4, left: pctOf(hold, holdV), transform: "translateX(-50%)", width: 16, height: 16, background: "var(--blue)", transition: "left .45s" }} />}
              </div>
              <span style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--grey-600)" }}>
                <span>0 s</span>
                <span>{f1(hold, hold.max / 2)}</span>
                <span>{f1(hold, hold.max)}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (sys === "recovery") {
    const useRe = isCompare || (mode === "re" && !!target);
    const snapN = useRe && target ? target : base;
    const nights = snapN.nights.map((n) => ({ bed: n.bed, dur: n.dur, day: weekday(n.date) }));
    const avg = nights.length ? (nights.reduce((a, n) => a + n.dur, 0) / nights.length).toFixed(1) : null;
    const rhr = data.defs.find((m) => m.key === "rhr");
    const rhrNow = rhr ? pick(rhr, bv(rhr)) : null;
    const rhrBase = rhr ? pick(rhr, baseV(rhr)) : null;
    visual = (
      <div className={s.rec}>
        <div style={{ padding: "clamp(16px,2vw,22px)", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <span style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 6 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em" }}>7 nights before {useRe ? "reassessment" : "baseline"}</span>
            <ListTag tag="Self reported" />
          </span>
          {nights.length ? <NightStrip nights={nights} /> : <span style={{ font: "400 14px/1.4 var(--font-sans)", color: "var(--grey-700)" }}>No sleep log for this week.</span>}
          {avg && <span style={{ fontSize: 10, color: "var(--grey-600)" }}>Each bar runs from bedtime to wake time. Average {avg} h.</span>}
        </div>
        {rhr && (
          <div className={s.recSide} style={{ padding: "clamp(16px,2vw,22px)", display: "flex", flexDirection: "column", gap: 10, background: "var(--grey-50)" }}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em" }}>Resting heart rate</span>
              <span style={{ fontSize: 9, textTransform: "uppercase", padding: "2px 6px", background: "var(--ink)", color: "#fff" }}>Measured</span>
            </span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 56, lineHeight: 0.9 }}>{rhrNow == null ? "·" : n1(rhrNow)}</span>
              <span style={{ fontSize: 13 }}>bpm</span>
            </span>
            {isCompare && rhrBase != null && (
              <span style={{ fontSize: 12 }}>
                Baseline {n1(rhrBase)} bpm · {change(rhr, baseV(rhr), reV(rhr))}
              </span>
            )}
            <span style={{ fontSize: 11, color: "var(--grey-700)" }}>Seated, 5 minutes, at the start of your assessment.</span>
            <span style={{ fontSize: 11, color: "var(--grey-600)" }}>HRV was not measured in session, so we do not show it.</span>
          </div>
        )}
      </div>
    );
  }

  if (sys === "performance") {
    visual = (
      <div style={{ border: "2px solid var(--ink)", display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--grey-200)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 6, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>
          <span>Tests chosen for you by {coach}</span>
          <span style={{ color: "var(--grey-600)" }}>Each on its own scale</span>
        </div>
        {sysList.map((m) => {
          const raw = bv(m),
            v = pick(m, raw),
            b0 = pick(m, baseV(m)),
            stv = isCompare ? st(m) : null;
          const txt =
            v == null
              ? mode === "re" ? dueLabel : "Not tested at baseline"
              : isCompare && b0 != null
                ? f1(m, b0) + " → " + f1(m, v) + " · " + change(m, baseV(m), raw)
                : m.sides
                  ? (vt(m, raw) ?? "")
                  : f1(m, v);
          const mk = stv === "down" ? "var(--grey-600)" : stv === "same" ? "var(--ink)" : "var(--blue)";
          return (
            <Link key={m.key} href={href({ m: m.key })} scroll={false} className={s.rowBtn} style={{ borderBottom: "1px solid var(--grey-200)", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10, background: sel?.key === m.key ? "var(--ice)" : "#fff" }}>
              <span style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11, textTransform: "uppercase" }}>
                <span>
                  {m.name}
                  {m.sides ? " · right side" : ""}
                </span>
                <b style={{ textAlign: "right" }}>{txt}</b>
              </span>
              <div style={{ position: "relative", height: 22, borderBottom: "2px solid var(--ink)" }}>
                {[0, 25, 50, 75, 100].map((x) => (
                  <span key={x} style={{ position: "absolute", bottom: -2, left: x + "%", width: 1, height: 7, background: "var(--ink)" }} />
                ))}
                {isCompare && b0 != null && <span style={{ position: "absolute", bottom: 4, left: pctOf(m, b0), transform: "translateX(-50%)", width: 13, height: 13, border: "2px solid var(--ink)", borderRadius: "50%", background: "#fff" }} />}
                {v != null && <span style={{ position: "absolute", bottom: 4, left: pctOf(m, v), transform: "translateX(-50%)", width: 15, height: 15, background: mk, transition: "left .45s" }} />}
              </div>
              <span style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--grey-600)" }}>
                <span>{f1(m, m.min ?? 0)}</span>
                <span>{m.dir === "lower" ? "Lower is better" : "Higher is better"}</span>
                <span>{f1(m, m.max)}</span>
              </span>
            </Link>
          );
        })}
      </div>
    );
  }

  const sysNote = notes?.sys[sys];
  const compareBlock = isCompare && (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", border: "2px solid var(--ink)" }}>
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6, boxShadow: "inset -1px 0 0 var(--grey-200)" }}>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--grey-600)" }}>{sysName(sys)} · counts only</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 0.95, textTransform: "uppercase" }}>{counts(sysList.map(st))}</span>
      </div>
      {sysNote && (
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6, background: "var(--grey-50)" }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em" }}>
            {sysNote.coach} on {sysName(sys)}
          </span>
          <span style={{ font: "400 15px/1.45 var(--font-sans)" }}>“{sysNote.text}”</span>
        </div>
      )}
    </div>
  );

  // ── Detail ──
  let detail: React.ReactNode = null;
  if (sel) {
    const v = valFor(sel);
    const cells: { k: string; v: string }[] = [];
    if (isCompare) {
      const b0 = baseV(sel);
      cells.push({ k: "Baseline", v: vt(sel, b0, base.values[sel.key]?.text) ?? "Not tested" }, { k: hasHist && histN >= 2 ? `Reassessment ${histN}` : "Reassessment", v: vt(sel, reV(sel), target?.values[sel.key]?.text) ?? "Not tested" }, { k: "Change", v: change(sel, b0, reV(sel)) || "New" });
    } else if (v == null) cells.push({ k: mode === "re" ? "Reassessment" : "Baseline", v: mode === "re" ? dueLabel : "Not tested" });
    else if (typeof v === "object") cells.push({ k: "Left", v: f1(sel, v.L) }, { k: "Right", v: f1(sel, v.R) }, { k: "Difference", v: v.L != null && v.R != null ? n1(Math.abs(v.L - v.R)) + sel.unit : "·" });
    else cells.push({ k: sel.unit.trim() && !sel.cats ? "Value" : "Result", v: vt(sel, v, textFor(sel)) ?? "·" });
    const dirLine = sel.criteria || (sel.dir === "lower" ? "Lower is better" : "Higher is better") + (sel.sides ? " · Both sides measured" : "");
    const ins = data.insights[sel.key];
    const stv = isCompare ? st(sel) : null;
    detail = (
      <div className={s.detail}>
        <div style={{ border: "2px solid var(--ink)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--grey-200)", display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--grey-600)" }}>
                {sysName(sys)} · Measure {pad2(selIdx)} of {sysList.length}
              </span>
              <DetailTag tag={tagOf(sel)} />
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 0.92, textTransform: "uppercase" }}>{sel.name}</span>
            <span style={{ fontSize: 11, color: "var(--grey-700)" }}>{howOf(sel)}</span>
            {stv === "nc" && <span style={{ fontSize: 11, color: "var(--grey-700)" }}>{statusUI("nc").label}: {base.values[sel.key]?.method ?? "baseline method"}, then {target?.values[sel.key]?.method ?? "a different method"}.</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))" }}>
            {cells.map((c) => (
              <div key={c.k} style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 3, boxShadow: "inset -1px 0 0 var(--grey-200)" }}>
                <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>{c.k}</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>{c.v}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 18px", borderTop: "1px solid var(--grey-200)", fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>{dirLine}</div>
        </div>

        {ins && ins.observations.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>What we observed · {ins.observations.length}</span>
            {ins.observations.map((o, i) => (
              <div key={i} style={{ border: "2px solid var(--ink)", background: "#fff", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "20px 20px 16px", display: "grid", gridTemplateColumns: "36px minmax(0,1fr)", gap: 12 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, color: "var(--blue)" }}>{pad2(i)}</span>
                  <span style={{ font: "600 clamp(17px,1.4vw,19px)/1.35 var(--font-sans)", letterSpacing: "-.01em", textWrap: "pretty" }}>{o.observed}</span>
                </div>
                {o.why && (
                  <div style={{ margin: "0 20px 20px 68px", paddingTop: 12, borderTop: "1px solid var(--grey-200)", display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--grey-600)" }}>Why it matters</span>
                    <span style={{ font: "400 15px/1.5 var(--font-sans)", color: "var(--grey-700)", textWrap: "pretty" }}>{o.why}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {ins?.workOn && (
          <div style={{ background: "var(--ice)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em" }}>What we would work on</span>
            <span style={{ font: "600 17px/1.35 var(--font-sans)" }}>{ins.workOn}</span>
            {ins.related && <span className={s.link}>Related: {ins.related} →</span>}
          </div>
        )}

        <div style={{ border: "2px solid var(--ink)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--grey-200)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>Evidence</div>
          {ins?.evidence.map((e) => (
            <Link key={e.id} href={`/documents?file=${e.id}`} className={s.rowBtn} style={{ borderBottom: "1px solid var(--grey-200)", padding: "12px 18px", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ font: "600 14px var(--font-sans)" }}>{e.name}</span>
                <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>
                  {e.source} · {e.date}
                </span>
              </span>
              <span style={{ fontSize: 12 }}>→</span>
            </Link>
          ))}
          {!ins?.evidence.length && <span style={{ padding: "12px 18px", font: "400 14px/1.4 var(--font-sans)", color: "var(--grey-700)" }}>Measured in session. No file attached.</span>}
        </div>
      </div>
    );
  }

  // ── Compare closing ──
  let closing: React.ReactNode = null;
  if (isCompare && target) {
    const rep = await getReport(data.client.id, target.reportId);
    const work = rep?.sections.workOn ?? [];
    const pathTitle = rep?.sections.pathTitle ?? (rep?.recommendedPath === "GROUP_TRAINING" ? "Group Training." : "Personal Training.");
    closing = (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 16 }}>
        <div style={{ border: "2px solid var(--ink)", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--blue)" }}>What we would work on next</span>
          {work.map((t, i) => (
            <span key={i} style={{ font: "600 16px/1.4 var(--font-sans)", display: "grid", gridTemplateColumns: "28px 1fr" }}>
              <span style={{ font: "400 12px var(--font-mono)", color: "var(--blue)" }}>{pad2(i)}</span>
              {t}
            </span>
          ))}
        </div>
        <div style={{ background: "var(--ink)", color: "#fff", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ice)" }}>Your recommended path</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 0.9, textTransform: "uppercase" }}>{pathTitle}</span>
          {rep?.pathReason && <span style={{ font: "400 15px/1.45 var(--font-sans)", color: "var(--grey-300)" }}>{rep.pathReason}</span>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Button variant="white" size="sm" href={`/reports/${target.reportId}/print`}>
              DOWNLOAD PDF
            </Button>
            <Button variant="outline-light" size="sm" href={`https://wa.me/919820041700?text=${encodeURIComponent(`Hi ${coach}, a question about my Compare.`)}`}>
              TALK TO {coach.toUpperCase()}
            </Button>
          </div>
          {rep?.releasedAt && <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-300)" }}>Saved to Documents · {dLong(rep.releasedAt)}</span>}
        </div>
      </div>
    );
  }

  const prevSys = si > 0 ? href({ sys: sysIds[si - 1] }) : null;
  const nextSys = si < sysIds.length - 1 ? href({ sys: sysIds[si + 1] }) : null;

  return (
    <div className={s.root}>
      {header}
      {hasHist && isCompare && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--grey-600)" }}>Compare baseline with</span>
          {res.map((_, i) => (
            <Pill key={i} href={href({ hist: i + 1 })} active={histN === i + 1} style={{ whiteSpace: "nowrap", flex: "none" }}>
              Reassessment {i + 1}
            </Pill>
          ))}
        </div>
      )}
      {compareSummary}
      {tabs}
      <SystemSwipe prev={prevSys} next={nextSys} tabsId="assessment-systems">
        <div className={s.body}>
          {list}
          <div className={s.centre}>
            {visual}
            {compareBlock}
          </div>
          {detail}
        </div>
      </SystemSwipe>
      {closing}
    </div>
  );
}
