"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AditusMark, Button, OptionRow } from "@/components/ds";
import { BodyMap, groupLabel } from "@/components/shared/BodyMap";
import { Lock } from "@/components/ui/Lock";
import { AGREEMENT_STEP, DONE_STEP, INTAKE_SECTIONS, SAFETY_STEP, SECTION_COUNT, TOTAL_STEPS, TREATMENTS, WHEN_CHIPS, treatmentLabel } from "@/server/onboarding/intakeDefs";
import type { IntakeData, InjuryView } from "@/server/onboarding/intake";
import s from "./intake.module.css";

type R = { ok: boolean; error?: string; id?: string };
export type IntakeActions = {
  saveChips: (key: string, q: string, values: string[]) => Promise<R>;
  saveText: (key: string, text: string) => Promise<R>;
  goToStep: (from: number, to: number, mode: "continue" | "skip" | "back") => Promise<R>;
  toggleConcern: (region: string) => Promise<R>;
  updateConcern: (region: string, patch: { intensity?: number; when?: string[] }) => Promise<R>;
  saveInjury: (v: { id: string | null; description: string; occurredOn: string; side: "Left" | "Right" | "Both"; treatments: string[] }) => Promise<R>;
  reportUploadFailed: (name: string, percent: number) => Promise<R>;
  answerSafety: (key: string, answer: "yes" | "no", note?: string) => Promise<R>;
  setAgreement: (which: "agreed" | "photos", granted: boolean) => Promise<R>;
  completeIntake: () => Promise<R>;
};

type Draft = { key: string; id: string | null; description: string; occurredOn: string; side: "Left" | "Right" | "Both"; treatments: string[] };
type Upload = { state: "idle" | "uploading" | "fail" | "done"; name?: string; pct?: number; reason?: "type" | "net" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const month = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return y && m ? `${MONTHS[m - 1]} ${y}` : "";
};
const newDraft = (): Draft => ({ key: Math.random().toString(36).slice(2), id: null, description: "", occurredOn: "", side: "Right", treatments: [] });
const AGREE_LINES = [
  "Your practitioner leads every test and stops if anything hurts.",
  "You can skip any test, any time, without a reason.",
  "This is an assessment of how you move, breathe and recover. It is not a medical check.",
  "Your results are seen by you, your practitioner and the head coach only.",
  "You can ask us to delete your data from Account.",
];

export function IntakeFlow({ data, initialStep, actions }: { data: IntakeData; initialStep: number; actions: IntakeActions }) {
  const [step, setStep] = useState(initialStep);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState(data.answers);
  const [concerns, setConcerns] = useState(data.concerns);
  const [view, setView] = useState<"front" | "back">("front");
  const [injuries, setInjuries] = useState<InjuryView[]>(data.injuries);
  const [draft, setDraft] = useState<Draft>(newDraft);
  const [upload, setUpload] = useState<Upload>(data.failedUpload ? { state: "fail", name: data.failedUpload.name, pct: data.failedUpload.pct, reason: "net" } : { state: "idle" });
  const [safety, setSafety] = useState(data.safety);
  const [agreed, setAgreed] = useState(data.agreed);
  const [photos, setPhotos] = useState(data.photos);
  const [done, setDone] = useState(data.done);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pract = data.pract || "Your practitioner";

  // Autosave queue: answers are written in the order they were tapped.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const save = useCallback((fn: () => Promise<R>) => {
    const p = queue.current.then(fn).then(
      (r) => {
        if (r.ok) {
          setSaved(true);
          setError(null);
        } else if (r.error) setError(r.error);
        return r;
      },
      () => {
        setError("Not saved. Check your connection and try again.");
        return { ok: false } as R;
      },
    );
    queue.current = p;
    return p;
  }, []);

  // Debounced writes (text lines, injury draft, safety notes). Flushed before leaving a step.
  const timers = useRef<Record<string, { t: ReturnType<typeof setTimeout>; run: () => void }>>({});
  const later = (key: string, run: () => void, ms = 600) => {
    clearTimeout(timers.current[key]?.t);
    timers.current[key] = { t: setTimeout(() => { delete timers.current[key]; run(); }, ms), run };
  };
  const flush = () => {
    for (const [k, v] of Object.entries(timers.current)) {
      clearTimeout(v.t);
      delete timers.current[k];
      v.run();
    }
    return queue.current;
  };
  useEffect(() => () => { for (const v of Object.values(timers.current)) clearTimeout(v.t); }, []);

  useEffect(() => {
    const u = new URL(window.location.href);
    u.searchParams.set("step", String(step));
    window.history.replaceState(null, "", u.toString());
  }, [step]);

  const move = async (to: number, mode: "continue" | "skip" | "back") => {
    setBusy(true);
    await flush();
    const r = await save(() => actions.goToStep(step, to, mode));
    setBusy(false);
    if (!r.ok) return;
    setStep(to);
    window.scrollTo(0, 0);
  };

  const finish = async () => {
    setBusy(true);
    await flush();
    const r = await save(() => actions.completeIntake());
    setBusy(false);
    if (!r.ok) return;
    setDone(true);
    setStep(DONE_STEP);
    window.scrollTo(0, 0);
  };

  const sec = step < SECTION_COUNT ? INTAKE_SECTIONS[step] : null;
  const safetyDone = data.safetyItems.every((i) => safety.items[i.key]);
  const locked = (step === SAFETY_STEP && !safetyDone) || (step === AGREEMENT_STEP && !agreed);
  const n = step < SECTION_COUNT ? `${step + 1} of ${SECTION_COUNT}` : step === SAFETY_STEP ? "Safety check" : step === AGREEMENT_STEP ? "Agreement" : "Done";
  const title = sec ? sec.name + "." : step === SAFETY_STEP ? "A quick safety check." : step === AGREEMENT_STEP ? "Agreement and consent." : "Intake complete.";
  const sub = sec
    ? sec.sub
    : step === SAFETY_STEP
      ? "Yes or no. A yes just means your practitioner talks it through with you first."
      : step === AGREEMENT_STEP
        ? "Short and plain. Photos are a separate choice."
        : data.nextName
          ? `Next, ${data.nextName}.`
          : "Next, back to your plan.";

  /* ── Chip sections ── */
  const pick = (key: string, q: string, multi: boolean, o: string) => {
    const cur = answers[key]?.groups[q] ?? [];
    const next = multi ? (cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]) : [o];
    setAnswers({ ...answers, [key]: { ...answers[key], groups: { ...answers[key]?.groups, [q]: next } } });
    save(() => actions.saveChips(key, q, next));
  };
  const typeText = (key: string, text: string) => {
    setAnswers({ ...answers, [key]: { ...answers[key], text } });
    later("text:" + key, () => save(() => actions.saveText(key, text)));
  };

  /* ── Body map ── */
  const toggleRegion = (k: string) => {
    setConcerns(concerns.some((c) => c.region === k) ? concerns.filter((c) => c.region !== k) : [...concerns, { region: k, intensity: 3, when: [] }]);
    save(() => actions.toggleConcern(k));
  };
  const patchConcern = (k: string, p: { intensity?: number; when?: string[] }) => {
    setConcerns(concerns.map((c) => (c.region === k ? { ...c, ...p } : c)));
    save(() => actions.updateConcern(k, p));
  };

  /* ── Injuries ── */
  const draftRef = useRef(draft);
  draftRef.current = draft;
  // Each draft has a local key; its saved id is looked up when the queued save runs, so quick
  // edits before the first save finishes update one Injury instead of creating several.
  const idByKey = useRef<Record<string, string>>({});
  const persistDraft = async (d: Draft): Promise<string | null> => {
    if (!d.id && !idByKey.current[d.key] && !d.description.trim() && !d.occurredOn && !d.treatments.length) return null;
    const r = await save(() => actions.saveInjury({ id: d.id ?? idByKey.current[d.key] ?? null, description: d.description, occurredOn: d.occurredOn, side: d.side, treatments: d.treatments }));
    if (!r.ok || !r.id) return null;
    const id = r.id;
    idByKey.current[d.key] = id;
    const view: InjuryView = { id, description: d.description, occurredOn: d.occurredOn, side: d.side, treatments: d.treatments, doc: null };
    setInjuries((list) => (list.some((i) => i.id === id) ? list.map((i) => (i.id === id ? { ...view, doc: i.doc } : i)) : [...list, view]));
    setDraft((cur) => (cur.key === d.key && !cur.id ? { ...cur, id } : cur));
    return id;
  };
  const editDraft = (p: Partial<Draft>, debounce = true) => {
    const d = { ...draftRef.current, ...p };
    setDraft(d);
    if (debounce) later("injury", () => persistDraft({ ...draftRef.current }), 700);
    else persistDraft(d);
  };
  const editRow = (i: InjuryView) => {
    flush();
    setDraft({ key: i.id, id: i.id, description: i.description, occurredOn: i.occurredOn, side: i.side, treatments: i.treatments });
    setUpload(i.doc ? { state: "done", name: i.doc.name } : { state: "idle" });
  };
  const addAnother = () => {
    flush();
    setDraft(newDraft());
    setUpload({ state: "idle" });
  };
  const bound = injuries.find((i) => i.id === draft.id);
  const upView = upload.state === "idle" && bound?.doc ? { state: "done" as const, name: bound.doc.name } : upload;

  const sendFile = async (file: File) => {
    clearTimeout(timers.current.injury?.t);
    delete timers.current.injury;
    const cur = draftRef.current;
    const id = (await persistDraft({ ...cur, description: cur.description || "Scan or report" })) ?? cur.id;
    if (!id) return;
    if (!cur.description) setDraft((d) => (d.key === cur.key ? { ...d, description: "Scan or report" } : d));
    setUpload({ state: "uploading", name: file.name, pct: 0 });
    const fd = new FormData();
    fd.append("file", file);
    fd.append("injuryId", id);
    const xhr = new XMLHttpRequest();
    let pct = 0;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        pct = Math.round((e.loaded / e.total) * 100);
        setUpload({ state: "uploading", name: file.name, pct });
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const doc = JSON.parse(xhr.responseText) as { name: string };
        setUpload({ state: "done", name: doc.name });
        setInjuries((list) => list.map((i) => (i.id === id ? { ...i, doc: { name: doc.name } } : i)));
        setSaved(true);
      } else {
        setUpload({ state: "fail", name: file.name, pct: Math.min(pct, 99), reason: xhr.status === 415 ? "type" : "net" });
        if (xhr.status !== 415) save(() => actions.reportUploadFailed(file.name, Math.min(pct, 99)));
      }
    };
    xhr.onerror = () => {
      setUpload({ state: "fail", name: file.name, pct: Math.min(pct, 99), reason: "net" });
      save(() => actions.reportUploadFailed(file.name, Math.min(pct, 99)));
    };
    xhr.open("POST", "/intake/upload");
    xhr.send(fd);
  };

  /* ── Safety ── */
  const answer = (key: string, v: "yes" | "no") => {
    setSafety({ ...safety, items: { ...safety.items, [key]: v } });
    save(() => actions.answerSafety(key, v, safety.notes[key]));
  };
  const note = (key: string, text: string) => {
    setSafety({ ...safety, notes: { ...safety.notes, [key]: text } });
    later("note:" + key, () => save(() => actions.answerSafety(key, "yes", text)));
  };

  const nextLabel = step === DONE_STEP ? "BACK TO YOUR PLAN →" : step === AGREEMENT_STEP ? "FINISH INTAKE →" : "CONTINUE →";
  const variant = locked ? "outline" : step === DONE_STEP ? "blue" : "ink";
  const stages = data.stages.map((x, i) => (i === 0 && done ? { ...x, done: true } : x));
  const current = stages.findIndex((x) => !x.done);

  return (
    <div className={s.root}>
      <header className={s.head}>
        <div className={s.headRow}>
          <Link href="/" className={s.logo} aria-label="ADITUS Home">
            <AditusMark size={26} />
            <span className={s.logoWord}>ADITUS</span>
          </Link>
          <span className={s.saved} aria-live="polite">{saved ? "✓ Saved" : "Saves as you go"}</span>
        </div>
        <div className={s.track} role="progressbar" aria-label="Intake progress" aria-valuemin={0} aria-valuemax={TOTAL_STEPS} aria-valuenow={step + 1}>
          <div className={s.fill} style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} />
        </div>
      </header>

      <div className={s.body}>
        <main className={s.main}>
          <div className={s.topRow}>
            <span className={s.kicker}>Intake · {n}</span>
            <span className={s.who} title="Who can see this">
              <Lock size={10} />
              You, your practitioner, head coach
            </span>
          </div>
          <h1 className={s.h1}>{title}</h1>
          <span className={s.sub}>{sub}</span>

          {sec && !sec.kind && (
            <>
              {sec.groups.map((g) => (
                <div key={g.q} className={s.group} role="group" aria-label={g.q}>
                  <span className={s.q}>{g.q}</span>
                  <div className={s.chips}>
                    {g.options.map((o) => {
                      const on = (answers[sec.key]?.groups[g.q] ?? []).includes(o);
                      return (
                        <button key={o} type="button" aria-pressed={on} className={`${s.chip} ${on ? s.chipOn : ""}`} onClick={() => pick(sec.key, g.q, g.multi, o)}>
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {sec.text && (
                <label className={s.textLabel}>
                  <span className={s.textQ}>{sec.text.label.replace("Jayraj", data.pract || "your practitioner")}</span>
                  <input className={s.input} placeholder={sec.text.placeholder} value={answers[sec.key]?.text ?? ""} maxLength={500} onChange={(e) => typeText(sec.key, e.target.value)} />
                </label>
              )}
            </>
          )}

          {sec?.kind === "concerns" && (
            <div className={s.bodyGrid}>
              <div className={s.figPanel}>
                <span className={s.cap}>Tap where it bothers you · {view === "front" ? "Front" : "Back"}</span>
                <div className={s.fig}>
                  <BodyMap view={view} selected={concerns.map((c) => c.region)} onPick={toggleRegion} ariaLabel={`Body, ${view}. Tap where it bothers you.`} />
                </div>
                <button type="button" className={s.flip} onClick={() => setView(view === "front" ? "back" : "front")}>
                  Flip to {view === "front" ? "back" : "front"}
                </button>
              </div>
              <div className={s.marks}>
                {concerns.map((m) => (
                  <div key={m.region} className={s.mark}>
                    <span className={s.markHead}>
                      <b className={s.markName}>{groupLabel(m.region)}</b>
                      <button type="button" className={s.textBtn} onClick={() => toggleRegion(m.region)}>Remove</button>
                    </span>
                    <span className={s.scaleRow}>
                      <span>How much, 0 to 10</span>
                      <b>{m.intensity}</b>
                    </span>
                    <div className={s.scale} role="radiogroup" aria-label={`${groupLabel(m.region)}, how much, 0 to 10`}>
                      {Array.from({ length: 11 }, (_, k) => {
                        const fillOn = k >= 1 && k <= m.intensity;
                        const zero = k === 0 && m.intensity === 0;
                        return (
                          <button
                            key={k}
                            type="button"
                            role="radio"
                            aria-checked={m.intensity === k}
                            className={s.scaleBtn}
                            style={{ background: fillOn ? "var(--blue)" : zero ? "var(--ink)" : "var(--grey-200)", color: fillOn || zero ? "#fff" : "var(--ink)" }}
                            onClick={() => patchConcern(m.region, { intensity: k })}
                          >
                            {k}
                          </button>
                        );
                      })}
                    </div>
                    <span className={s.small11}>When does it show up</span>
                    <div className={s.chips} style={{ gap: 6 }}>
                      {WHEN_CHIPS.map((w) => {
                        const on = m.when.includes(w);
                        return (
                          <button key={w} type="button" aria-pressed={on} className={`${s.chip} ${s.chipSm} ${on ? s.chipOn : ""}`} onClick={() => patchConcern(m.region, { when: on ? m.when.filter((x) => x !== w) : [...m.when, w] })}>
                            {w}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {concerns.length === 0 && <span className={s.empty}>Nothing marked. That is a fine answer too.</span>}
              </div>
            </div>
          )}

          {sec?.kind === "injuries" && (
            <div className={s.ruled}>
              {injuries.map((i) => (
                <div key={i.id} className={`${s.injRow} ${i.id === draft.id ? s.injRowOn : ""}`}>
                  <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                    <b className={s.injName}>{i.description || "Not described yet"}</b>
                    <span className={s.injMeta}>{[month(i.occurredOn), i.side, i.treatments.map(treatmentLabel).join(", ")].filter(Boolean).join(" · ")}</span>
                  </span>
                  {i.id !== draft.id && (
                    <button type="button" className={s.edit} onClick={() => editRow(i)}>Edit</button>
                  )}
                </div>
              ))}
              <div className={s.form}>
                {draft.id ? (
                  <button type="button" className={`${s.addKicker} ${s.addBtn}`} onClick={addAnother}>+ Add another</button>
                ) : (
                  <span className={s.addKicker}>Add another</span>
                )}
                <input className={s.inputSm} placeholder="What happened, in a few words" aria-label="What happened, in a few words" value={draft.description} maxLength={200} onChange={(e) => editDraft({ description: e.target.value })} />
                <div className={s.formGrid}>
                  <input className={s.inputSm} type="month" aria-label="When" value={draft.occurredOn} max="2026-12" onChange={(e) => editDraft({ occurredOn: e.target.value })} />
                  <div className={s.seg} role="radiogroup" aria-label="Side">
                    {(["Left", "Right", "Both"] as const).map((o) => (
                      <button key={o} type="button" role="radio" aria-checked={draft.side === o} className={`${s.segBtn} ${draft.side === o ? s.segOn : ""}`} onClick={() => editDraft({ side: o }, false)}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={s.chips} style={{ gap: 6 }} role="group" aria-label="What was done">
                  {TREATMENTS.map(([k, label]) => {
                    const on = draft.treatments.includes(k);
                    return (
                      <button key={k} type="button" aria-pressed={on} className={`${s.chip} ${s.chipMd} ${on ? s.chipOn : ""}`} onClick={() => editDraft({ treatments: on ? draft.treatments.filter((x) => x !== k) : [...draft.treatments, k] }, false)}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <button type="button" className={s.up} onClick={() => fileRef.current?.click()} disabled={upView.state === "uploading"}>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <span className={s.upTitle}>
                      {upView.state === "done" ? `✓ ${upView.name} added` : upView.state === "fail" ? `${upView.name} did not upload` : upView.state === "uploading" ? upView.name : "Add a scan or report, optional"}
                    </span>
                    <span className={s.upLine} style={{ color: upView.state === "fail" ? "var(--blue)" : "var(--grey-600)" }}>
                      {upView.state === "done"
                        ? `${pract} will see it in your brief.`
                        : upView.state === "fail"
                          ? upView.reason === "type"
                            ? "PDF, JPG or PNG up to 25 MB. Your answers are saved. Try again."
                            : `The connection dropped at ${upView.pct ?? 0}%. Your answers are saved. Try again.`
                          : upView.state === "uploading"
                            ? `${upView.pct ?? 0}%`
                            : "PDF, JPG or PNG up to 25 MB"}
                    </span>
                  </span>
                  <span className={s.upCta}>{upView.state === "done" ? "Replace" : upView.state === "fail" ? "Try again" : upView.state === "uploading" ? "" : "Browse"}</span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) sendFile(f);
                  }}
                />
              </div>
            </div>
          )}

          {step === SAFETY_STEP && (
            <>
              <div className={s.ruled}>
                {data.safetyItems.map((it) => {
                  const v = safety.items[it.key];
                  return (
                    <div key={it.key} className={s.safeRow}>
                      <div className={s.safeTop}>
                        <span className={s.safeQ} id={"sq-" + it.key}>{it.q}</span>
                        <div className={s.yn} role="radiogroup" aria-labelledby={"sq-" + it.key}>
                          <button type="button" role="radio" aria-checked={v === "no"} className={`${s.ynBtn} ${v === "no" ? s.ynOn : ""}`} onClick={() => answer(it.key, "no")}>No</button>
                          <button type="button" role="radio" aria-checked={v === "yes"} className={`${s.ynBtn} ${s.ynYes} ${v === "yes" ? s.ynOn : ""}`} onClick={() => answer(it.key, "yes")}>Yes</button>
                        </div>
                      </div>
                      {v === "yes" && (
                        <span className={s.reveal}>
                          Your practitioner will talk this through with you before testing.
                          <input className={s.revealInput} placeholder="Add a line if you like" aria-label="Add a line if you like" value={safety.notes[it.key] ?? ""} maxLength={300} onChange={(e) => note(it.key, e.target.value)} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <span className={s.note}>This one cannot be skipped. A yes never stops you booking.</span>
            </>
          )}

          {step === AGREEMENT_STEP && (
            <>
              <div className={s.agree}>
                <span className={s.agreeKicker}>The assessment agreement, in plain words</span>
                {AGREE_LINES.map((x) => (
                  <span key={x} className={s.agreeLine}>
                    <span className={s.dot}>·</span>
                    {x}
                  </span>
                ))}
                <Link href="/intake/agreement" className={s.link}>Read the full agreement →</Link>
              </div>
              <div className={s.box2}>
                <OptionRow multi label="I agree to the assessment agreement" desc="Required to book." checked={agreed} onClick={() => { setAgreed(!agreed); save(() => actions.setAgreement("agreed", !agreed)); }} />
                <OptionRow
                  multi
                  label="Photos and videos during the assessment"
                  desc="Front, side and back photos and short videos of tests. Seen only by you, your practitioner and the head coach, to compare at reassessment. Optional."
                  checked={photos}
                  onClick={() => { setPhotos(!photos); save(() => actions.setAgreement("photos", !photos)); }}
                />
              </div>
            </>
          )}

          {step === DONE_STEP && (
            <>
              <div className={s.ice}>
                <span className={s.iceTitle}>✓ {pract} will read this before you meet.</span>
                <span className={s.iceLine}>You can change any answer until your assessment.</span>
              </div>
              <span className={s.agreeKicker}>Optional, before you book</span>
              <div className={s.extras}>
                {[
                  ["Add documents", `Blood tests, X rays, MRI or physio notes. ${pract} reads them before you meet.`, "Add documents", "/documents"],
                  ["Connect a health app", "Apple Health, Garmin, Oura and others. Read only.", "Connect", "/health"],
                ].map(([t, d, cta, href]) => (
                  <div key={t} className={s.extra}>
                    <b className={s.extraT}>{t}</b>
                    <span className={s.extraD}>{d}</span>
                    <Link href={href} className={s.link}>{cta} →</Link>
                  </div>
                ))}
              </div>
            </>
          )}

          {error && (
            <span className={s.err} role="alert">
              {error}
            </span>
          )}

          <div className={s.foot}>
            {step === DONE_STEP ? (
              <Button href="/assessment" variant="blue" size="lg" full>{nextLabel}</Button>
            ) : (
              <Button variant={variant} size="lg" full disabled={locked || busy} onClick={() => (step === AGREEMENT_STEP ? finish() : move(step + 1, "continue"))}>
                {nextLabel}
              </Button>
            )}
            {(step > 0 || step < SECTION_COUNT) && (
              <div className={s.footRow}>
                {step > 0 && (
                  <button type="button" className={s.footBtn} disabled={busy} onClick={() => move(step - 1, "back")}>← Back</button>
                )}
                {step < SECTION_COUNT && (
                  <button type="button" className={`${s.footBtn} ${s.skip}`} disabled={busy} onClick={() => move(step + 1, "skip")}>Skip for now</button>
                )}
              </div>
            )}
          </div>
        </main>

        <aside className={s.aside} aria-label="What comes next">
          <span className={s.agreeKicker}>What comes next</span>
          <div className={s.ruled}>
            {stages.map((x, i) => (
              <div key={x.t + i} className={s.asideRow} style={{ background: i === current ? "var(--ice)" : "#fff" }}>
                <span className={s.asideBox} style={{ background: x.done ? "var(--blue)" : "#fff" }}>{x.done ? "✓" : ""}</span>
                <span className={s.asideT}>{x.t}</span>
                <span className={s.asideD}>{x.d}</span>
              </div>
            ))}
          </div>
          <span className={s.asideFoot}>Everything saves as you go. Leave any time and pick up from Home.</span>
        </aside>
      </div>
    </div>
  );
}
