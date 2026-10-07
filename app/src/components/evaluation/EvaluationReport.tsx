import type { ReactNode } from "react";
import { BodyMap } from "@/components/shared/BodyMap";
import { EVALUATION, REPORT, formatValue, isAnswered, overallScore, paramId, sectionScore, type EvalParam, type EvalSection, type EvaluationData, type ParamValue } from "@/config/evaluation";
import s from "./report.module.css";

export type ReportMedia = Record<string, { src: string | null; kind: "PHOTO" | "VIDEO"; label: string; view: string }>;

const FIG: Record<string, "front" | "back" | "left" | "right"> = { front: "front", back: "back", side: "left", left: "left", right: "right" };

/** A photo or video, or (sample data without a file) a ruled placeholder with the body outline for that view. */
export function MediaFace({ m, className, controls = false }: { m: { src: string | null; kind: "PHOTO" | "VIDEO"; label: string; view: string }; className?: string; controls?: boolean }) {
  if (m.src && m.kind === "VIDEO") return <video className={className} src={m.src} muted={!controls} playsInline preload="metadata" controls={controls} aria-label={m.label} />;
  // eslint-disable-next-line @next/next/no-img-element
  if (m.src) return <img className={className} src={m.src} alt={m.label} loading="lazy" />;
  const fig = FIG[m.view];
  return (
    <span className={className} role="img" aria-label={`${m.label} (sample, no file)`} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--grey-50)", overflow: "hidden" }}>
      {fig ? (
        <span style={{ position: "relative", height: "86%", aspectRatio: "400/720" }}>
          <BodyMap view={fig} ariaLabel={m.label} />
        </span>
      ) : (
        <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--grey-600)", padding: 4, textAlign: "center" }}>{m.kind === "VIDEO" ? "▶ " : ""}{m.label}</span>
      )}
    </span>
  );
}

const pct = (x: number | null) => (x === null ? null : Math.round(x * 100));

function Evidence({ ids, media }: { ids?: string[]; media: ReportMedia }) {
  const items = (ids ?? []).map((id) => ({ id, m: media[id] })).filter((x) => x.m);
  if (!items.length) return null;
  return (
    <div className={s.thumbs}>
      {items.map(({ id, m }) => (
        <MediaFace key={id} m={m} className={s.thumb} controls={m.kind === "VIDEO"} />
      ))}
    </div>
  );
}

function Areas({ groups }: { groups: string[] }) {
  return (
    <div className={s.figs}>
      {(["front", "back"] as const).map((v) => (
        <div key={v} className={s.fig}>
          <BodyMap view={v} selected={groups} ariaLabel={`Body ${v}`} />
        </div>
      ))}
    </div>
  );
}

function Value({ p, x }: { p: EvalParam; x?: ParamValue }) {
  const answered = isAnswered(p, x);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <span className={s.value + (answered ? "" : " " + s.muted)}>{formatValue(p, x)}</span>
      {p.type === "bodymap" && answered && <Areas groups={x!.v as string[]} />}
    </div>
  );
}

/**
 * The client facing report, built from the coach's evaluation and the layout in src/config/evaluation.ts.
 * `internal` also shows parameters marked `report: false` (coach and head coach only).
 */
export function EvaluationReport({ data, media, head, internal = false }: { data: EvaluationData; media: ReportMedia; head: { kicker: ReactNode; title: ReactNode }; internal?: boolean }) {
  const shown = (p: EvalParam) => internal || p.report !== false;
  const label = (p: EvalParam) => p.reportLabel ?? p.label;
  const priorities = EVALUATION.flatMap((sec) => sec.params.filter(shown).map((p) => ({ sec, p, x: data.values[paramId(sec, p)] }))).filter((r) => r.x?.priority);
  const overall = pct(overallScore(data));
  const scored = EVALUATION.map((sec) => ({ sec, v: pct(sectionScore(sec, data)) })).filter((r) => r.v !== null);

  return (
    <article className={s.wrap}>
      <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className={s.kicker}>{head.kicker}</span>
        <h1 className={s.title}>{head.title}</h1>
      </header>

      {REPORT.showScores && overall !== null && (
        <section className={s.box} aria-label="Scores">
          <div className={s.scores}>
            <div className={s.overall}>
              <span className={s.kicker}>Overall</span>
              <span className={s.big}>{overall}</span>
              <span className={s.kicker}>out of 100</span>
            </div>
            <div className={s.bars}>
              {scored.map(({ sec, v }) => (
                <div key={sec.key} className={s.bar}>
                  <span className={s.barTop}>
                    <span>{sec.reportTitle ?? sec.title}</span>
                    <b>{v}</b>
                  </span>
                  <div className={s.track}>
                    <div className={s.fill} style={{ width: `${v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {REPORT.summary.map((f) =>
        data.summary[f.key]?.trim() ? (
          <section key={f.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h2 className={s.h2}>{f.label}</h2>
            <p className={s.para}>{data.summary[f.key]}</p>
          </section>
        ) : null,
      )}

      {priorities.length > 0 && (
        <section className={s.box}>
          <div className={s.boxHead}>
            <h2 className={s.h2}>Priorities</h2>
            <span className={s.kicker}>{priorities.length} to work on first</span>
          </div>
          {priorities.map(({ sec, p, x }, i) => (
            <div key={paramId(sec, p)} className={s.prio}>
              <span className={s.n}>{i + 1}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                <span className={s.kicker}>{sec.reportTitle ?? sec.title}</span>
                <b className={s.label}>{label(p)}</b>
                <Value p={p} x={x} />
                {x?.note && <p className={s.note}>{x.note}</p>}
                <Evidence ids={x?.media} media={media} />
              </div>
            </div>
          ))}
        </section>
      )}

      {EVALUATION.map((sec) => <Section key={sec.key} sec={sec} data={data} media={media} shown={shown} label={label} />)}

      {REPORT.paths.length > 0 && data.path && (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 className={s.h2}>Recommended next step</h2>
          <div className={s.path}>
            {REPORT.paths.map((p) => (
              <span key={p} className={s.pathOpt + (p === data.path ? " " + s.pathOn : "")}>
                {p}
              </span>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function Section({ sec, data, media, shown, label }: { sec: EvalSection; data: EvaluationData; media: ReportMedia; shown: (p: EvalParam) => boolean; label: (p: EvalParam) => string }) {
  const params = sec.params.filter(shown).filter((p) => isAnswered(p, data.values[paramId(sec, p)]) || data.values[paramId(sec, p)]?.note);
  if (!params.length) return null;
  const v = pct(sectionScore(sec, data));
  return (
    <section className={s.box}>
      <div className={s.boxHead}>
        <h2 className={s.h2}>{sec.reportTitle ?? sec.title}</h2>
        {REPORT.showScores && v !== null && <span className={s.kicker}>Score {v}</span>}
      </div>
      {params.map((p) => {
        const x = data.values[paramId(sec, p)];
        return (
          <div key={p.key} className={s.row}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <span className={s.label}>{label(p)}</span>
              {x?.priority && <span className={s.flag}>Priority</span>}
              {p.report === false && <span className={s.flag}>Internal · not shown to the client</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
              <Value p={p} x={x} />
              {x?.note && <p className={s.note}>{x.note}</p>}
              <Evidence ids={x?.media} media={media} />
            </div>
          </div>
        );
      })}
    </section>
  );
}
