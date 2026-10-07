"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ds";
import { BodyMap } from "@/components/shared/BodyMap";
import { useFlash, useRun } from "@/components/staff/consoles/ui";
import { EVALUATION, REPORT, areaLabel, isAnswered, paramId, progress, type EvalParam, type EvalSection, type EvaluationData, type ParamValue } from "@/config/evaluation";
import { saveEvaluation, submitEvaluation } from "@/server/evaluation/actions";
import type { EvalMedia, EvaluationScreenData } from "@/server/evaluation/data";
import { EvaluationReport, MediaFace, type ReportMedia } from "./EvaluationReport";
import s from "./evaluate.module.css";

const STATUS: Record<string, string> = { DRAFT: "Draft", PENDING_APPROVAL: "With head coach", RETURNED: "Returned to you", RELEASED: "Released to client" };

const matches = (sec: EvalSection | undefined, m: EvalMedia) => !sec?.media?.length || sec.media.some((v) => (v === "video" ? m.kind === "VIDEO" : m.kind === "PHOTO" && m.view === v));

export function EvaluateScreen({ d }: { d: EvaluationScreenData }) {
  const [data, setData] = useState<EvaluationData>(d.evaluation);
  const [tab, setTab] = useState(0);
  const [all, setAll] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const flash = useFlash();
  const { run, pending } = useRun();
  const ro = !d.canEdit;
  const sec = EVALUATION[tab] as EvalSection | undefined;
  const isSummary = tab === EVALUATION.length;

  // Debounced autosave of every change.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (ro) return;
    setSave("saving");
    const t = setTimeout(async () => {
      try {
        const r = await saveEvaluation(d.client.id, data);
        if (r.error) {
          setSave("error");
          flash(r.error);
        } else setSave("saved");
      } catch {
        setSave("error");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [data, d.client.id, ro, flash]);

  const media = useMemo(() => (all || isSummary ? d.media : d.media.filter((m) => matches(sec, m))), [all, isSummary, d.media, sec]);
  const shown = d.media.find((m) => m.id === viewing && media.includes(m)) ?? media[0] ?? null;
  const prog = progress(data);
  const priorities = Object.values(data.values).filter((v) => v.priority).length;
  const reportMedia: ReportMedia = Object.fromEntries(d.media.map((m) => [m.id, { src: m.src, kind: m.kind, label: m.label, view: m.view }]));
  const lastReturn = d.report?.status === "RETURNED" ? d.comments.find((c) => c.action === "RETURNED") : null;

  const set = (id: string, patch: Partial<ParamValue>) => setData((x) => ({ ...x, values: { ...x.values, [id]: { ...x.values[id], ...patch } } }));
  const doneIn = (sc: EvalSection) => sc.params.filter((p) => isAnswered(p, data.values[paramId(sc, p)])).length;

  return (
    <>
      <div className={s.bar}>
        <div className={s.status}>
          <span className={s.chip + (d.report?.status === "PENDING_APPROVAL" || d.report?.status === "RELEASED" ? " " + s.chipInk : d.report?.status === "RETURNED" ? " " + s.chipBlue : "")}>{STATUS[d.report?.status ?? "DRAFT"]}</span>
          <span>
            {prog.done} of {prog.total} answered
          </span>
          <span>
            {priorities} of {REPORT.maxPriorities} priorities
          </span>
          {!ro && <span aria-live="polite">{save === "saving" ? "Saving…" : save === "saved" ? "Saved" : save === "error" ? "Not saved" : ""}</span>}
          {ro && <span>View only</span>}
        </div>
        <div className={s.actions}>
          <Button variant="outline" size="sm" onClick={() => setPreview(true)}>
            PREVIEW REPORT
          </Button>
          {!ro && (
            <Button variant="blue" size="sm" disabled={pending || d.report?.status === "PENDING_APPROVAL"} onClick={() => run(() => submitEvaluation(d.client.id, data))}>
              SUBMIT FOR REVIEW
            </Button>
          )}
          {d.report && d.canApprove && d.report.status !== "DRAFT" && (
            <Button variant="ink" size="sm" href={`/staff/review/${d.report.id}`}>
              HEAD COACH REVIEW
            </Button>
          )}
        </div>
      </div>

      {lastReturn && (
        <div className={s.notice}>
          <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--blue)", fontFamily: "var(--font-mono)" }}>
            Returned by {lastReturn.by} · {lastReturn.when}
          </span>
          <span>{lastReturn.body}</span>
        </div>
      )}
      {d.flags.length > 0 && (
        <div className={s.notice}>
          <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--blue)", fontFamily: "var(--font-mono)" }}>Safety flags · staff only</span>
          {d.flags.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
      )}

      <div className={s.grid}>
        <aside className={s.media} aria-label="Photos and videos">
          <div className={s.vMeta}>
            <b>{shown ? shown.label : "No uploads"}</b>
            <span>{shown ? `${shown.kind === "VIDEO" ? "Video" : "Photo"} · ${shown.capturedAt}` : ""}</span>
          </div>
          <div className={s.viewer}>
            {!shown ? (
              <span className={s.vEmpty}>{d.media.length ? "Nothing for this section. Show all uploads below." : `${d.client.first} has not uploaded photos or videos yet.`}</span>
            ) : (
              <MediaFace key={shown.id} m={shown} controls className={s.face} />
            )}
          </div>
          {!isSummary && sec?.media?.length ? (
            <div className={s.mFilter}>
              <button type="button" className={s.mini + (!all ? " " + s.miniOn : "")} onClick={() => setAll(false)}>
                For this section
              </button>
              <button type="button" className={s.mini + (all ? " " + s.miniOn : "")} onClick={() => setAll(true)}>
                All uploads · {d.media.length}
              </button>
            </div>
          ) : null}
          <div className={s.strip}>
            {media.map((m) => (
              <button key={m.id} type="button" className={s.th + (shown?.id === m.id ? " " + s.thOn : "")} onClick={() => setViewing(m.id)} aria-label={m.label} aria-pressed={shown?.id === m.id}>
                <MediaFace m={m} className={s.face} />
                <span className={s.thTag}>{m.kind === "VIDEO" ? "▶ " : ""}{m.view}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className={s.col}>
          <nav className={s.tabs} aria-label="Evaluation sections">
            {EVALUATION.map((sc, i) => (
              <button key={sc.key} type="button" className={s.tab + (i === tab ? " " + s.tabOn : "")} onClick={() => setTab(i)} aria-current={i === tab ? "step" : undefined}>
                <span>{sc.title}</span>
                <span className={s.tabN}>
                  {doneIn(sc)} of {sc.params.length}
                </span>
              </button>
            ))}
            <button type="button" className={s.tab + (isSummary ? " " + s.tabOn : "")} onClick={() => setTab(EVALUATION.length)} aria-current={isSummary ? "step" : undefined}>
              <span>Summary and submit</span>
              <span className={s.tabN}>{REPORT.summary.filter((f) => data.summary[f.key]?.trim()).length} of {REPORT.summary.length} written</span>
            </button>
          </nav>

          {sec && !isSummary && (
            <>
              <div className={s.secHead}>
                <h2 className={s.h2}>{sec.title}</h2>
                {sec.intro && <span className={s.intro}>{sec.intro}</span>}
              </div>
              <fieldset disabled={ro} style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                {sec.params.map((p) => (
                  <ParamCard
                    key={p.key}
                    p={p}
                    x={data.values[paramId(sec, p)]}
                    onChange={(patch) => set(paramId(sec, p), patch)}
                    shown={shown}
                    mediaLabel={(id) => d.media.find((m) => m.id === id)?.label ?? "Upload"}
                    canPrioritise={priorities < REPORT.maxPriorities}
                  />
                ))}
              </fieldset>
              <div className={s.actions}>
                {tab > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setTab(tab - 1)}>
                    ← BACK
                  </Button>
                )}
                <Button variant="ink" size="sm" onClick={() => setTab(tab + 1)}>
                  {tab === EVALUATION.length - 1 ? "SUMMARY →" : "NEXT SECTION →"}
                </Button>
              </div>
            </>
          )}

          {isSummary && (
            <fieldset disabled={ro} style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
              <div className={s.secHead}>
                <h2 className={s.h2}>Summary and submit</h2>
                <span className={s.intro}>This becomes the top of {d.client.first}’s report. Preview it before you submit.</span>
              </div>
              {REPORT.summary.map((f, i) => (
                <label key={f.key} className={s.card}>
                  <span className={s.cardHead}>
                    <span className={s.pLabel}>
                      {f.label}
                      {i === 0 && <span className={s.req}>Required</span>}
                    </span>
                  </span>
                  <span className={s.input}>
                    <textarea className={s.text} rows={4} value={data.summary[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setData((x) => ({ ...x, summary: { ...x.summary, [f.key]: e.target.value } }))} />
                  </span>
                </label>
              ))}
              {REPORT.paths.length > 0 && (
                <div className={s.card}>
                  <span className={s.cardHead}>
                    <span className={s.pLabel}>Recommended next step</span>
                  </span>
                  <div className={s.input}>
                    <div className={s.opts}>
                      {REPORT.paths.map((p) => (
                        <button key={p} type="button" className={s.opt + (data.path === p ? " " + s.optOn : "")} aria-pressed={data.path === p} onClick={() => setData((x) => ({ ...x, path: x.path === p ? null : p }))}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className={s.card}>
                <span className={s.cardHead}>
                  <span className={s.pLabel}>Before you submit</span>
                </span>
                <div className={s.input}>
                  <span className={s.help}>
                    {prog.done} of {prog.total} parameters answered · {priorities} of {REPORT.maxPriorities} priorities marked.
                  </span>
                  {prog.missing.length > 0 ? (
                    <ul className={s.missing}>
                      {prog.missing.map((m) => (
                        <li key={m}>Required: {m}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className={s.help}>All required parameters are answered.</span>
                  )}
                </div>
              </div>
              {!ro && (
                <div className={s.actions}>
                  <Button variant="outline" size="sm" onClick={() => setPreview(true)}>
                    PREVIEW REPORT
                  </Button>
                  <Button variant="blue" size="sm" disabled={pending || d.report?.status === "PENDING_APPROVAL"} onClick={() => run(() => submitEvaluation(d.client.id, data))}>
                    SUBMIT FOR REVIEW
                  </Button>
                </div>
              )}
            </fieldset>
          )}
        </div>
      </div>

      {preview && (
        <div className={s.overlay} role="dialog" aria-modal="true" aria-label="Report preview" onClick={(e) => e.target === e.currentTarget && setPreview(false)}>
          <div className={s.sheet}>
            <div className={s.sheetBar}>
              <b>Preview · what {d.client.first} will see · internal items marked</b>
              <button type="button" onClick={() => setPreview(false)}>
                Close
              </button>
            </div>
            <div className={s.sheetBody}>
              <EvaluationReport data={data} media={reportMedia} internal head={{ kicker: `${REPORT.title}${d.author ? " · " + d.author : ""}`, title: d.client.name }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ParamCard({ p, x, onChange, shown, mediaLabel, canPrioritise }: { p: EvalParam; x?: ParamValue; onChange: (patch: Partial<ParamValue>) => void; shown: EvalMedia | null; mediaLabel: (id: string) => string; canPrioritise: boolean }) {
  const [noteOpen, setNoteOpen] = useState(!!x?.note);
  const [view, setView] = useState<"front" | "back">("front");
  const ev = x?.media ?? [];
  const opt = (on: boolean, multi = false) => s.opt + (multi ? " " + s.optMulti : "") + (on ? " " + s.optOn : "");
  const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? null : Number(v));

  let input: React.ReactNode = null;
  switch (p.type) {
    case "scale": {
      const max = p.max ?? 5;
      input = (
        <>
          <div className={s.opts} role="radiogroup" aria-label={p.label}>
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" role="radio" aria-checked={x?.v === n} className={opt(x?.v === n)} onClick={() => onChange({ v: x?.v === n ? null : n })}>
                {n}
              </button>
            ))}
          </div>
          {(p.low || p.high) && (
            <span className={s.ends}>
              <span>1 · {p.low}</span>
              <span>
                {max} · {p.high}
              </span>
            </span>
          )}
        </>
      );
      break;
    }
    case "grade":
    case "choice":
      input = (
        <div className={s.opts} role="radiogroup" aria-label={p.label}>
          {(p.options ?? []).map((o) => (
            <button key={o} type="button" role="radio" aria-checked={x?.v === o} className={opt(x?.v === o)} onClick={() => onChange({ v: x?.v === o ? null : o })}>
              {o}
            </button>
          ))}
        </div>
      );
      break;
    case "multi": {
      const cur = (x?.v as string[] | undefined) ?? [];
      input = (
        <div className={s.opts} aria-label={p.label}>
          {(p.options ?? []).map((o) => (
            <button key={o} type="button" aria-pressed={cur.includes(o)} className={opt(cur.includes(o), true)} onClick={() => onChange({ v: cur.includes(o) ? cur.filter((c) => c !== o) : [...cur, o] })}>
              {cur.includes(o) ? "✓ " : "+ "}
              {o}
            </button>
          ))}
        </div>
      );
      break;
    }
    case "number":
      input = p.sides ? (
        <div className={s.num}>
          {(["l", "r"] as const).map((k) => (
            <label key={k} className={s.numF}>
              {k === "l" ? "Left" : "Right"}
              <span>
                <input className={s.field} type="number" inputMode="decimal" step={p.step ?? "any"} min={p.min} value={x?.[k] ?? ""} onChange={(e) => onChange({ [k]: num(e.target.value) })} />
                {p.unit}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <label className={s.numF}>
          Value
          <span>
            <input className={s.field} type="number" inputMode="decimal" step={p.step ?? "any"} min={p.min} value={(x?.v as number | null | undefined) ?? ""} onChange={(e) => onChange({ v: num(e.target.value) })} />
            {p.unit}
          </span>
        </label>
      );
      break;
    case "yesno":
      input = (
        <div className={s.opts} role="radiogroup" aria-label={p.label}>
          {[true, false].map((b) => (
            <button key={String(b)} type="button" role="radio" aria-checked={x?.v === b} className={opt(x?.v === b)} onClick={() => onChange({ v: x?.v === b ? null : b })}>
              {b ? "Yes" : "No"}
            </button>
          ))}
        </div>
      );
      break;
    case "bodymap": {
      const cur = (x?.v as string[] | undefined) ?? [];
      input = (
        <>
          <div className={s.opts}>
            {(["front", "back"] as const).map((v) => (
              <button key={v} type="button" className={s.mini + (view === v ? " " + s.miniOn : "")} onClick={() => setView(v)}>
                {v}
              </button>
            ))}
          </div>
          <div className={s.figs}>
            <div className={s.fig} style={{ width: 160 }}>
              <BodyMap view={view} selected={cur} onPick={(g) => onChange({ v: cur.includes(g) ? cur.filter((c) => c !== g) : [...cur, g] })} ariaLabel={`Tap body areas, ${view}`} />
            </div>
          </div>
          <span className={s.areas}>{cur.length ? [...new Set(cur.map(areaLabel))].join(", ") : "Nothing selected. Tap the figure."}</span>
        </>
      );
      break;
    }
    case "text":
      input = <input className={s.text} value={(x?.v as string | undefined) ?? ""} placeholder={p.placeholder} onChange={(e) => onChange({ v: e.target.value })} />;
      break;
    case "longtext":
      input = <textarea className={s.text} rows={4} value={(x?.v as string | undefined) ?? ""} placeholder={p.placeholder} onChange={(e) => onChange({ v: e.target.value })} />;
      break;
  }

  return (
    <div className={s.card + (x?.priority ? " " + s.cardPrio : "")}>
      <div className={s.cardHead}>
        <span className={s.pLabel}>
          {p.label}
          {p.required && <span className={s.req}>Required</span>}
          {p.report === false && <span className={s.req} style={{ color: "var(--grey-600)" }}>Internal</span>}
        </span>
        {p.help && <span className={s.help}>{p.help}</span>}
      </div>
      <div className={s.input}>{input}</div>
      {noteOpen && (
        <div className={s.noteBox}>
          <textarea className={s.text} rows={2} value={x?.note ?? ""} placeholder="Note for the report" onChange={(e) => onChange({ note: e.target.value })} aria-label={`Note for ${p.label}`} />
        </div>
      )}
      <div className={s.foot}>
        <button type="button" className={s.mini + (noteOpen ? " " + s.miniOn : "")} onClick={() => setNoteOpen(!noteOpen)}>
          {noteOpen ? "Note" : "+ Note"}
        </button>
        <button type="button" className={s.mini} disabled={!shown || ev.includes(shown.id)} onClick={() => shown && onChange({ media: [...ev, shown.id] })} title="Attach the photo or video on screen as evidence">
          + Attach {shown?.kind === "VIDEO" ? "video" : "photo"} shown
        </button>
        {ev.map((id) => (
          <span key={id} className={s.ev}>
            {mediaLabel(id)}
            <button type="button" aria-label={`Remove ${mediaLabel(id)}`} onClick={() => onChange({ media: ev.filter((e) => e !== id) })}>
              ×
            </button>
          </span>
        ))}
        <button type="button" className={s.mini + (x?.priority ? " " + s.miniOn : "")} disabled={!x?.priority && !canPrioritise} onClick={() => onChange({ priority: !x?.priority })} title={!x?.priority && !canPrioritise ? `Up to ${REPORT.maxPriorities} priorities` : undefined}>
          {x?.priority ? "✓ Priority" : "+ Priority"}
        </button>
        <span className={s.done}>{isAnswered(p, x) ? "Answered" : "Not answered"}</span>
      </div>
    </div>
  );
}
