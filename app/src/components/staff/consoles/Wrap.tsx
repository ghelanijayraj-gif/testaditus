"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ds";
import { headEdit, saveWrap, submitForReview, type WrapPayload } from "@/server/consoles/actions";
import type { WrapCandidate, WrapData } from "@/server/consoles/data";
import { PATHS, SECTIONS } from "./lib";
import { Check, useFlash, useRun } from "./ui";
import s from "./consoles.module.css";

type Props = { mode: "prac"; assessmentId: string; first: string; wrap: WrapData } | { mode: "head"; reportId: string; first: string; wrap: WrapData };

/**
 * 10.7 Wrap up: 3 to 5 priorities in the finding structure, the fixed sections, the
 * practitioner's note and the recommended path. The practitioner's draft autosaves; the
 * head coach uses the same editor inline (Edit) and saves explicitly.
 */
export function Wrap(props: Props) {
  const { first, wrap, mode } = props;
  const flash = useFlash();
  const { run, pending } = useRun();
  const [cands, setCands] = useState<WrapCandidate[]>(wrap.candidates);
  const [sections, setSections] = useState<Record<string, string>>(wrap.sections);
  const [note, setNote] = useState(wrap.note);
  const [path, setPath] = useState(wrap.path);
  const [reason, setReason] = useState(wrap.reason);
  const [starting, setStarting] = useState(wrap.startingPoint);
  const [status, setStatus] = useState(wrap.status);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [adding, setAdding] = useState<string | null>(null);
  const [addText, setAddText] = useState("");
  const dirty = useRef(false);

  const picked = cands.filter((c) => c.picked);
  const locked = mode === "prac" && (status === "PENDING_APPROVAL" || status === "RELEASED");
  const payload = useMemo<WrapPayload>(
    () => ({ candidates: cands.map(({ key, name, picked, observed, why, workOn, related }) => ({ key, name, picked, observed, why, workOn, related })), sections, note, path, reason, ...(mode === "head" ? { startingPoint: starting } : {}) }),
    [cands, sections, note, path, reason, starting, mode],
  );

  // Practitioner autosave (debounced).
  useEffect(() => {
    if (mode !== "prac" || !dirty.current || locked) return;
    setSaved("saving");
    const t = setTimeout(async () => {
      try {
        const r = await saveWrap(props.assessmentId, payload);
        setSaved(r?.error ? "error" : "saved");
        if (r?.error) flash(r.error);
      } catch {
        setSaved("error");
      }
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  const touch = () => (dirty.current = true);
  const upd = (key: string, patch: Partial<WrapCandidate>) => {
    touch();
    setCands((cs) => cs.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  };
  const toggle = (c: WrapCandidate) => {
    if (!c.picked && picked.length >= 5) return flash("Five priorities at most. Unpick one first.");
    // Newly picked priorities go to the end of the numbered list.
    touch();
    setCands((cs) => {
      const rest = cs.filter((x) => x.key !== c.key);
      const on = rest.filter((x) => x.picked);
      const off = rest.filter((x) => !x.picked);
      return c.picked ? [...on, { ...c, picked: false }, ...off] : [...on, { ...c, picked: true }, ...off];
    });
  };
  const addCandidate = (key: string) => {
    const a = wrap.addable.find((x) => x.key === key);
    if (!a) return;
    touch();
    setCands((cs) => {
      const on = cs.filter((x) => x.picked);
      const off = cs.filter((x) => !x.picked);
      const c: WrapCandidate = { key, name: a.name, value: "", picked: on.length < 5, order: 99, observed: "", why: "", workOn: "", related: [] };
      return [...on, ...(c.picked ? [c] : []), ...off, ...(c.picked ? [] : [c])];
    });
  };

  const valid = picked.length >= 3 && picked.length <= 5;
  const submitted = status === "PENDING_APPROVAL";
  const submit = () =>
    run(() => submitForReview((props as { assessmentId: string }).assessmentId, payload), {
      onOk: () => setStatus("PENDING_APPROVAL"),
    });

  const ta = (value: string, onChange: (v: string) => void, ph: string, min = 56, label?: string) => (
    <textarea className={s.textarea} style={{ minHeight: min }} value={value} placeholder={ph} disabled={locked} aria-label={label} onChange={(e) => onChange(e.target.value)} />
  );

  return (
    <>
      {wrap.returned && status === "RETURNED" && (
        <div className={s.flag} style={{ padding: 16, gap: 6 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--blue)" }}>Returned by the head coach · {wrap.returned.when}</span>
          <span style={{ font: "600 15px/1.45 var(--font-sans)" }}>“{wrap.returned.body}”</span>
        </div>
      )}
      <div className={s.briefCols}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>Priorities · pick 3 to 5 · {picked.length} chosen</span>
          {cands.length === 0 && (
            <div className={s.flag}>
              <span className={s.kBlue}>No priorities yet</span>
              <span>Flag measures as priority in the console, or add one below.</span>
            </div>
          )}
          {cands.map((c) => {
            const n = c.picked ? picked.indexOf(c) + 1 : 0;
            return (
              <div key={c.key} className={s.box}>
                <button type="button" onClick={() => !locked && toggle(c)} aria-pressed={c.picked} disabled={locked} style={{ textAlign: "left", border: 0, cursor: locked ? "default" : "pointer", padding: "12px 16px", display: "grid", gridTemplateColumns: "24px minmax(0,1fr) auto", gap: 10, alignItems: "center", background: c.picked ? "var(--ice)" : "#fff", color: "var(--ink)" }}>
                  <Check on={c.picked} />
                  <b style={{ font: "600 16px var(--font-sans)" }}>
                    {n ? <span style={{ font: "700 10px var(--font-mono)", color: "var(--blue)", marginRight: 8 }}>{String(n).padStart(2, "0")}</span> : null}
                    {c.name}
                  </b>
                  <span style={{ fontSize: 10, textTransform: "uppercase" }}>{c.value}</span>
                </button>
                {c.picked && (
                  <>
                    {(
                      [
                        ["observed", "What we observed", "What did you see, in plain words?"],
                        ["why", "Why it matters", `Why does this matter for ${first}, day to day?`],
                        ["workOn", "What we would work on", "One line. Strengthening, opening, loading..."],
                      ] as const
                    ).map(([f, k, ph]) => (
                      <label key={f} style={{ padding: "10px 16px", borderTop: "1px solid var(--grey-200)", display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>{k}</span>
                        {ta(c[f], (v) => upd(c.key, { [f]: v }), ph)}
                      </label>
                    ))}
                    <div style={{ padding: "10px 16px", borderTop: "1px solid var(--grey-200)", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>Related</span>
                      {c.related.map((l) => (
                        <span key={l} className={s.chip} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          {l}
                          {!locked && (
                            <button type="button" aria-label={`Remove ${l}`} onClick={() => upd(c.key, { related: c.related.filter((x) => x !== l) })} style={{ border: 0, background: "none", padding: 0, cursor: "pointer", fontSize: 11 }}>
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                      {!locked &&
                        (adding === c.key ? (
                          <input
                            autoFocus
                            value={addText}
                            placeholder="Library item, then Enter"
                            aria-label="Related library item"
                            onChange={(e) => setAddText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && addText.trim()) {
                                upd(c.key, { related: [...c.related, addText.trim()] });
                                setAddText("");
                                setAdding(null);
                              }
                              if (e.key === "Escape") setAdding(null);
                            }}
                            onBlur={() => setAdding(null)}
                            style={{ height: 28, border: "1.5px solid var(--grey-300)", padding: "0 8px", font: "400 13px var(--font-sans)" }}
                          />
                        ) : (
                          <button type="button" onClick={() => setAdding(c.key)} style={{ border: 0, background: "none", padding: 0, cursor: "pointer", fontSize: 10, textTransform: "uppercase", color: "var(--blue)" }}>
                            + Add
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {!locked && wrap.addable.length > 0 && (
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className={s.kicker}>Add a priority from the measures</span>
              <select value="" onChange={(e) => addCandidate(e.target.value)} style={{ height: 44, border: "1.5px solid var(--ink)", background: "#fff", padding: "0 8px", font: "400 14px var(--font-sans)", borderRadius: 0, maxWidth: 420 }}>
                <option value="">Choose a measure</option>
                {wrap.addable
                  .filter((a) => !cands.some((c) => c.key === a.key))
                  .map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
        </div>

        <div className={s.sticky}>
          {mode === "head" && (
            <label className={s.box} style={{ padding: "14px 16px", gap: 8 }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Your starting point · as {first} reads it</span>
              {ta(starting, (v) => (touch(), setStarting(v)), "Big Picture in plain words, to the client", 70)}
            </label>
          )}
          <div className={s.box}>
            <div style={{ padding: "12px 16px", borderBottom: "2px solid var(--ink)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>Assessment sections</div>
            {SECTIONS.map((sc) => (
              <label key={sc.key} style={{ padding: "10px 16px", borderBottom: "1px solid var(--grey-200)", display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ display: "flex", justifyContent: "space-between", fontSize: 10, textTransform: "uppercase" }}>
                  <b>{sc.label}</b>
                  <span style={{ color: "var(--grey-600)" }}>{sections[sc.key]?.trim() ? "Written" : "To write"}</span>
                </span>
                {ta(sections[sc.key] ?? "", (v) => (touch(), setSections((x) => ({ ...x, [sc.key]: v }))), "Plain words, two or three lines", 48)}
              </label>
            ))}
          </div>
          <label className={s.box} style={{ padding: "14px 16px", gap: 8 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Your note to {first}, in your own voice</span>
            {ta(note, (v) => (touch(), setNote(v)), "", 70)}
          </label>
          <div className={s.box} style={{ padding: "14px 16px", gap: 10 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Recommended path</span>
            <div className={s.seg} style={{ gridTemplateColumns: "repeat(3,1fr)" }} role="group" aria-label="Recommended path">
              {PATHS.map((o) => (
                <button key={o.key} type="button" disabled={locked} aria-pressed={path === o.key} className={path === o.key ? s.on : ""} onClick={() => (touch(), setPath(o.key))} style={{ minHeight: 48, padding: "0 6px", fontSize: 10, textTransform: "uppercase" }}>
                  {o.label}
                </button>
              ))}
            </div>
            <input className={s.input} value={reason} disabled={locked} placeholder="One line on why this path" aria-label="Reason for the recommended path" onChange={(e) => (touch(), setReason(e.target.value))} />
          </div>
          {mode === "prac" ? (
            <>
              {status === "RELEASED" ? (
                <Button variant="ink" size="lg" full disabled>
                  ✓ RELEASED
                </Button>
              ) : submitted ? (
                <Button variant="ink" size="lg" full disabled>
                  ✓ SUBMITTED FOR REVIEW
                </Button>
              ) : valid ? (
                <Button variant="blue" size="lg" full onClick={submit} disabled={pending}>
                  {status === "RETURNED" ? "RESUBMIT FOR REVIEW →" : "SUBMIT FOR REVIEW →"}
                </Button>
              ) : (
                <Button variant="outline" size="lg" full disabled>
                  PICK 3 TO 5 PRIORITIES
                </Button>
              )}
              <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }} role="status">
                {submitted ? "The head coach has it. Editing is locked until it is returned." : saved === "saving" ? "Saving draft…" : saved === "saved" ? "Draft saved · just now" : saved === "error" ? "Not saved. Check the connection." : "Draft autosaves as you write"}
              </span>
            </>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button variant="blue" size="md" disabled={pending || picked.length < 1} onClick={() => run(() => headEdit(props.reportId, payload))}>
                SAVE EDITS
              </Button>
              <Button variant="outline" size="md" href={`/staff/review/${props.reportId}`}>
                CANCEL
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
