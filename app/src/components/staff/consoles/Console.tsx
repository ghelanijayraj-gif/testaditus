"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ImageSlot } from "@/components/ds";
import { completeTesting, phaseForSystem, pushCue, saveMeasures, setTestKeys, type MeasureOp } from "@/server/consoles/actions";
import { useOutbox } from "./outbox";
import { Camera } from "./Camera";
import { groupLabel, OBS_TAGS, SCORE_CRITERIA, SKIPS, SYSTEMS, SYS_LABEL, foldMeasures, fmtV, hasValue, isLR, tagOf, type MeasureRow, type Phase, type TestDef, type TestState } from "./lib";
import { useFlash, useRun } from "./ui";
import s from "./consoles.module.css";

type Props = {
  a: { id: string; clientId: string; online: boolean; testKeys: string[]; phases: Phase[]; started: boolean; paused: boolean; clientMessage: string | null; moduleKey: string };
  client: { id: string; first: string; name: string };
  bank: TestDef[];
  measures: MeasureRow[];
  consentOn: boolean;
  flags: { item: string; note: string | null }[];
  savedAt: string | null;
  checkedIn: string | null;
  concern: string | null;
  initialTest: string | null;
};

const EMPTY: TestState = { flag: false, obs: [], note: "" };
const stepOf = (d: TestDef) => d.step ?? (d.unit === "cm" ? 0.1 : d.unit === "h" ? 0.5 : 1);
const maxOf = (d: TestDef) => d.max ?? (d.unit === "/10" ? 10 : d.unit === "/3" ? 3 : null);
const r1 = (v: number) => Math.round(v * 10) / 10;
const show = (v?: number) => (v == null ? "0" : Number.isInteger(v) ? String(v) : v.toFixed(1));
const sel = (on: boolean) => ({ background: on ? "var(--ink)" : "#fff", color: on ? "#fff" : "var(--ink)" });

/** 10.5 Console: session timeline, current test, live summary. Every entry autosaves through the tablet outbox. */
export function Console(p: Props) {
  const router = useRouter();
  const flash = useFlash();
  const { run: runAction, pending: finishing } = useRun();
  const [keys, setKeys] = useState(p.a.testKeys);
  const tests = useMemo(() => p.bank.filter((t) => keys.includes(t.key)), [p.bank, keys]);
  const [vals, setVals] = useState<Record<string, TestState>>(() => foldMeasures(p.measures));
  const [cur, setCur] = useState(() => Math.max(0, tests.findIndex((t) => t.key === p.initialTest)));
  const T = tests[Math.min(cur, tests.length - 1)];
  const st = (T && vals[T.key]) ?? EMPTY;
  const outbox = useOutbox(p.a.id, useCallback((ops: MeasureOp[]) => saveMeasures(p.a.id, ops), [p.a.id]));
  const [edited, setEdited] = useState(false);
  const [waiting, setWaiting] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [side, setSide] = useState<"L" | "R">("R");
  const [cam, setCam] = useState<null | "PHOTO" | "VIDEO">(null);
  const [cue, setCue] = useState("");
  const [listening, setListening] = useState(false);
  const deb = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastSys = useRef<string | null>(null);

  // Keep the current test in the URL (resume), and move the client's phase tracker with the system.
  useEffect(() => {
    if (!T) return;
    window.history.replaceState(null, "", `/staff/practitioner/${p.a.id}?tab=console&test=${T.key}`);
    if (lastSys.current !== T.system) {
      if (lastSys.current !== null || p.a.started) void phaseForSystem(p.a.id, T.system).catch(() => {});
      lastSys.current = T.system;
    }
    setCue(T.name + (isLR(T) ? `, ${side === "L" ? "left" : "right"} side` : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [T?.key]);
  useEffect(() => {
    if (timer == null) return;
    const iv = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(iv);
  }, [timer]);
  // Pick up client signals (pause, "Tell your practitioner") every 20 s.
  useEffect(() => {
    const iv = setInterval(() => navigator.onLine && router.refresh(), 20000);
    return () => clearInterval(iv);
  }, [router]);

  const set = (k: string, patch: Partial<TestState>) => setVals((v) => ({ ...v, [k]: { ...(v[k] ?? EMPTY), ...patch } }));
  const commit = (op: Omit<MeasureOp, "id">, debounceKey?: string) => {
    setEdited(true);
    if (!debounceKey) return outbox.enqueue(op);
    if (!deb.current[debounceKey]) setWaiting((n) => n + 1);
    clearTimeout(deb.current[debounceKey]);
    deb.current[debounceKey] = setTimeout(() => {
      delete deb.current[debounceKey];
      setWaiting((n) => n - 1);
      outbox.enqueue(op);
    }, 450);
  };
  const setValue = (k: string, sd: "L" | "R" | null, v: number | string) => {
    const patch: Partial<TestState> = { skipped: undefined };
    if (sd === "L") patch.L = v as number;
    else if (sd === "R") patch.R = v as number;
    else if (typeof v === "string") patch.t = v;
    else patch.v = v;
    set(k, patch);
    commit({ kind: "value", testKey: k, side: sd === "L" ? "LEFT" : sd === "R" ? "RIGHT" : "NONE", value: typeof v === "number" ? v : null, text: typeof v === "string" ? v : null }, `${k}:${sd ?? "N"}`);
  };
  const go = (i: number) => {
    setTimer(null);
    setCur(Math.max(0, Math.min(tests.length - 1, i)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = () => {
    if (cur >= tests.length - 1) return runAction(() => completeTesting(p.a.id));
    go(cur + 1);
  };

  if (!T)
    return (
      <div className={s.flag}>
        <span className={s.kBlue}>No tests selected</span>
        <span>Pick tests in the Brief, then start the assessment.</span>
      </div>
    );

  const online = p.a.online;
  const tag = tagOf(T, online);
  const lr = isLR(T) && T.inputType === "LR_PAIR";
  const sidedTimer = T.inputType === "STOPWATCH" && T.sided;
  const unit = T.unit;
  const elapsed = timer != null ? (now - timer) / 1000 : null;
  const clock = elapsed != null ? Math.max(0, elapsed).toFixed(1) : sidedTimer ? (side === "L" ? st.L : st.R)?.toFixed(1) ?? "0.0" : st.v?.toFixed(1) ?? "0.0";
  const sysIdx = SYSTEMS.findIndex((x) => x.key === T.system);
  const captured = tests.filter((t) => hasValue(vals[t.key]) || vals[t.key]?.skipped).length;
  const flagged = tests.filter((t) => vals[t.key]?.flag);

  const startStop = () => {
    if (timer == null) {
      setNow(Date.now());
      setTimer(Date.now());
      if (online) void pushCue(p.a.id, cue || T.name, { label: T.name + (sidedTimer ? ` · ${side === "L" ? "left" : "right"}` : ""), timer: "start" }).catch(() => {});
      return;
    }
    const secs = r1((Date.now() - timer) / 1000);
    setTimer(null);
    setValue(T.key, sidedTimer ? side : null, secs);
    if (online) void pushCue(p.a.id, `${T.name} · ${secs} s`, { label: T.name + (sidedTimer ? ` · ${side === "L" ? "left" : "right"}` : ""), timer: "stop", seconds: secs }).catch(() => {});
  };

  const dictate = () => {
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const SR = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!SR) return flash("Dictation is not available on this device. Use the keyboard’s microphone.");
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join(" ");
      const note = [st.note, text].filter(Boolean).join(" ");
      set(T.key, { note });
      commit({ kind: "meta", testKey: T.key, note }, `${T.key}:note`);
    };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  // Timeline
  const ph = (k: string) => p.a.phases.find((x) => x.key === k)?.state;
  const closing = ph("close") === "CURRENT" || ph("close") === "DONE";
  const sysCount = (sys: string) => {
    const ts = tests.filter((t) => t.system === sys);
    return `${ts.filter((t) => hasValue(vals[t.key])).length} of ${ts.length}`;
  };
  const concernShort = p.concern ? (p.concern.includes(":") ? groupLabel(p.concern) : p.concern).toLowerCase() : "";
  const timeline = [
    { key: "arrival", name: "Arrival", sub: p.checkedIn ? `${online ? "Joined" : "Checked in"} ${p.checkedIn}` : online ? "Not joined yet" : "Not checked in", done: !!p.checkedIn || p.a.started, now: false },
    { key: "talk", name: "Conversation", sub: concernShort ? `Goals and the ${concernShort}` : "Goals and concerns", done: p.a.started, now: false },
    ...SYSTEMS.map((x, i) => ({ key: x.key, name: x.label, sub: sysCount(x.key), now: !closing && i === sysIdx, done: closing || i < sysIdx || ph(x.label.toLowerCase()) === "DONE" })),
    { key: "exp", name: "Experience", sub: "Breath practice", done: ph("close") === "DONE", now: false },
    { key: "close", name: "Close", sub: "What happens next", done: ph("close") === "DONE", now: ph("close") === "CURRENT" },
  ];
  const pickPhase = (k: string) => {
    if (k === "close") return runAction(() => completeTesting(p.a.id));
    if (k === "talk" || k === "arrival") return router.push(`/staff/practitioner/${p.a.id}?tab=brief`);
    const i = tests.findIndex((t) => t.system === k);
    if (i >= 0) go(i);
  };

  const savedLine = !outbox.online ? "Saved on tablet, syncing when back online" : outbox.error ? outbox.error : edited ? (outbox.pending > 0 || waiting > 0 ? "Saving…" : "Saved · just now") : p.savedAt ? `Saved · ${p.savedAt}` : "Autosaves every entry";

  const addTest = (k: string) => {
    if (!k) return;
    const nextKeys = [...keys, k];
    setKeys(nextKeys);
    void setTestKeys(p.a.id, nextKeys).catch(() => {});
    const idx = p.bank.filter((t) => nextKeys.includes(t.key)).findIndex((t) => t.key === k);
    setTimeout(() => go(idx), 0);
  };

  return (
    <div className={s.consoleCols}>
      {/* Left: session timeline */}
      <aside className={s.timeline} aria-label="Session timeline">
        {timeline.map((x) => (
          <button key={x.key} type="button" onClick={() => pickPhase(x.key)} className={s.phase + (x.now ? " " + s.phaseNow : x.done ? " " + s.phaseDone : "")} aria-current={x.now ? "step" : undefined}>
            <span>
              {x.now ? "● " : x.done ? "✓ " : ""}
              {x.name}
            </span>
            <span>{x.sub}</span>
          </button>
        ))}
        <div className={s.tlWide} style={{ marginTop: 8 }}>
          {p.a.paused && (
            <div className={s.flag} style={{ padding: "10px 12px", gap: 3 }}>
              <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--blue)" }}>Paused</span>
              <span style={{ font: "600 13px/1.35 var(--font-sans)" }}>{p.client.first} paused the session.</span>
            </div>
          )}
          {p.a.clientMessage && (
            <div className={s.flag} style={{ padding: "10px 12px", gap: 3 }}>
              <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--blue)" }}>From {p.client.first}</span>
              <span style={{ font: "600 13px/1.35 var(--font-sans)" }}>{p.a.clientMessage}</span>
            </div>
          )}
          {p.flags.map((f, i) => (
            <div key={i} className={s.flag} style={{ padding: "10px 12px", gap: 3 }}>
              <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--blue)" }}>Discuss before testing</span>
              <span style={{ font: "600 13px/1.35 var(--font-sans)" }}>{f.item}</span>
            </div>
          ))}
          <button type="button" onClick={() => router.push(`/staff/practitioner/${p.a.id}?tab=brief`)} style={{ border: "1.5px solid var(--ink)", background: "#fff", cursor: "pointer", height: 40, fontSize: 10, textTransform: "uppercase" }}>
            Client brief
          </button>
        </div>
      </aside>

      {/* Centre: current test */}
      <section className={s.box} aria-label={T.name}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--grey-200)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
          <span className={s.kicker}>
            {SYS_LABEL[T.system]} · test {cur + 1} of {tests.length}
          </span>
          <span style={{ display: "flex", gap: 6 }}>
            <span style={{ fontSize: 9, textTransform: "uppercase", padding: "3px 6px", boxShadow: "inset 0 0 0 1.5px var(--ink)", ...sel(tag === "Measured") }}>{tag}</span>
            {T.direction !== "NONE" && <span style={{ fontSize: 9, textTransform: "uppercase", padding: "3px 6px", boxShadow: "inset 0 0 0 1px var(--grey-400)" }}>{T.direction === "HIGHER_BETTER" ? "Higher is better" : "Lower is better"}</span>}
          </span>
        </div>
        <div className={s.testCols}>
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,2.4vw,30px)", lineHeight: 0.92, textTransform: "uppercase" }}>{T.name}</span>
            <span style={{ font: "400 15px/1.5 var(--font-sans)", color: "var(--grey-700)" }}>{T.howTo}</span>
          </div>
          <div style={{ minHeight: 150, position: "relative" }}>
            <ImageSlot caption={`CLIP: ${T.name.toUpperCase()}`} style={{ position: "absolute", inset: 0 }} />
          </div>
        </div>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          {p.a.paused && (
            <div className={s.flag} style={{ padding: "10px 14px" }}>
              <span className={s.kBlue}>Paused</span>
              <span style={{ fontSize: 14 }}>Paused by {p.client.first}. Values are kept.</span>
            </div>
          )}
          {p.a.clientMessage && (
            <div className={s.flag} style={{ padding: "10px 14px" }}>
              <span className={s.kBlue}>{p.client.first} says</span>
              <span style={{ fontSize: 14 }}>{p.a.clientMessage}</span>
            </div>
          )}
          {st.skipped && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 11, textTransform: "uppercase", color: "var(--grey-700)" }}>
              Not tested · {SKIPS.find((x) => x.code === st.skipped)?.label ?? st.skipped}. Enter a value to test it after all.
            </div>
          )}

          {lr && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["L", "R"] as const).map((sd) => (
                  <div key={sd} className={s.box}>
                    <span style={{ padding: "8px 12px", fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid var(--grey-200)" }}>{sd === "L" ? "Left" : "Right"}</span>
                    <Stepper def={T} value={st[sd]} big={false} onChange={(v) => setValue(T.key, sd, v)} label={`${T.name}, ${sd === "L" ? "left" : "right"}`} />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 11, textTransform: "uppercase" }}>
                {st.L != null && st.R != null ? `Difference ${show(Math.abs(st.L - st.R))}${unit}${Math.abs(st.L - st.R) >= (T.flagDiff ?? 8) ? " · worth flagging" : ""}` : "Enter both sides"}
              </span>
            </>
          )}
          {(T.inputType === "NUMBER" || T.inputType === "SCALE_0_10") && (
            <div className={s.box} style={{ maxWidth: 360 }}>
              <Stepper def={T} value={st.v} big onChange={(v) => setValue(T.key, null, v)} label={T.name} />
            </div>
          )}
          {T.inputType === "STOPWATCH" && (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 56, lineHeight: 0.9, minWidth: 150 }} aria-live="off">
                  {clock}
                  <span style={{ font: "400 14px var(--font-mono)" }}> s</span>
                </span>
                <Button variant={timer == null ? "blue" : "ink"} size="lg" onClick={startStop}>
                  {timer == null ? "START" : "STOP"}
                </Button>
                {sidedTimer && (
                  <div className={s.seg} style={{ gridTemplateColumns: "1fr 1fr" }} role="group" aria-label="Side">
                    {(["L", "R"] as const).map((sd) => (
                      <button key={sd} type="button" onClick={() => setSide(sd)} aria-pressed={side === sd} className={side === sd ? s.on : ""} style={{ height: 54, padding: "0 14px", fontSize: 11, textTransform: "uppercase" }}>
                        {sd === "L" ? "Left" : "Right"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, color: "var(--grey-700)" }}>
                {online ? `The same timer shows large on ${p.client.first}’s screen.` : T.key === "balance" ? "Tap stop when the foot touches down." : "Tap stop at the end point."}
                {sidedTimer && (st.L != null || st.R != null) ? ` · L ${st.L ?? "·"} · R ${st.R ?? "·"} s` : ""}
              </span>
            </>
          )}
          {T.inputType === "SCORE_0_3" && (
            <div className={s.box}>
              {SCORE_CRITERIA.map(([n, c]) => (
                <button key={n} type="button" onClick={() => setValue(T.key, null, n)} aria-pressed={st.v === n} style={{ textAlign: "left", border: 0, borderBottom: "1px solid var(--grey-200)", cursor: "pointer", minHeight: 52, padding: "10px 14px", display: "grid", gridTemplateColumns: "40px 1fr", gap: 12, alignItems: "center", ...sel(st.v === n) }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>{n}</span>
                  <span style={{ font: "400 14px/1.4 var(--font-sans)" }}>{c}</span>
                </button>
              ))}
            </div>
          )}
          {T.inputType === "CHOICE" && T.choices.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {T.choices.map((o) => (
                <button key={o} type="button" onClick={() => setValue(T.key, null, o)} aria-pressed={st.t === o} style={{ minHeight: 52, padding: "0 18px", border: "2px solid var(--ink)", cursor: "pointer", font: "600 15px var(--font-sans)", ...sel(st.t === o) }}>
                  {o}
                </button>
              ))}
            </div>
          )}
          {T.inputType === "CHOICE" && T.choices.length === 0 && (
            <input key={T.key} className={s.input} style={{ height: 52, border: "2px solid var(--ink)", maxWidth: 420 }} defaultValue={st.t ?? ""} placeholder="For example 11:30 PM to 12:30 AM" aria-label={T.name} onBlur={(e) => e.target.value.trim() && setValue(T.key, null, e.target.value.trim())} />
          )}
          {T.inputType === "TIME" && <TimeInput key={T.key} value={st.v} onChange={(v) => setValue(T.key, null, v)} />}
          {T.inputType === "PHOTO" && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ font: "400 15px/1.4 var(--font-sans)" }}>Front, side, back, left and right are taken in Photos.</span>
              <Button variant="outline" size="md" href={`/staff/practitioner/${p.a.id}?tab=photos`}>
                OPEN PHOTOS →
              </Button>
            </div>
          )}

          {online && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>On {p.client.first}’s screen</span>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", border: "2px solid var(--ink)" }}>
                <input value={cue} onChange={(e) => setCue(e.target.value)} aria-label={`Instruction for ${p.client.first}`} style={{ height: 52, border: 0, padding: "0 14px", font: "400 15px var(--font-sans)", minWidth: 0 }} />
                <button type="button" onClick={() => runAction(() => pushCue(p.a.id, cue, { label: T.name }), { refresh: false })} style={{ height: 52, padding: "0 16px", border: 0, boxShadow: "inset 2px 0 0 var(--ink)", background: "#fff", cursor: "pointer", fontSize: 10, textTransform: "uppercase" }}>
                  Send to screen
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Observations</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {OBS_TAGS.map((o) => {
                const on = st.obs.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      const obs = on ? st.obs.filter((x) => x !== o) : [...st.obs, o];
                      set(T.key, { obs });
                      commit({ kind: "meta", testKey: T.key, observation: obs });
                    }}
                    className={s.toggleChip}
                    style={{ minHeight: 40, padding: "0 12px", font: "500 13px var(--font-sans)", ...sel(on) }}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", border: "2px solid var(--ink)" }}>
            <input
              value={st.note}
              onChange={(e) => {
                set(T.key, { note: e.target.value });
                commit({ kind: "meta", testKey: T.key, note: e.target.value }, `${T.key}:note`);
              }}
              placeholder="Note, optional"
              aria-label="Note, optional"
              style={{ height: 52, border: 0, padding: "0 14px", font: "400 15px var(--font-sans)", minWidth: 0 }}
            />
            <button type="button" onClick={dictate} aria-pressed={listening} style={{ height: 52, padding: "0 16px", border: 0, boxShadow: "inset 2px 0 0 var(--ink)", cursor: "pointer", fontSize: 10, textTransform: "uppercase", ...sel(listening) }}>
              {listening ? "Listening" : "Dictate"}
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Button variant="outline" size="md" disabled={!p.consentOn} onClick={() => setCam("PHOTO")}>
              PHOTO
            </Button>
            <Button variant="outline" size="md" disabled={!p.consentOn} onClick={() => setCam("VIDEO")}>
              VIDEO
            </Button>
            {!p.consentOn && <span style={{ fontSize: 11, color: "var(--grey-700)" }}>Off. {p.client.first} did not consent to photos and videos.</span>}
            <button
              type="button"
              aria-pressed={st.flag}
              onClick={() => {
                set(T.key, { flag: !st.flag });
                commit({ kind: "meta", testKey: T.key, priority: !st.flag });
              }}
              style={{ marginLeft: "auto", minHeight: 50, padding: "0 14px", border: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 11, textTransform: "uppercase", background: st.flag ? "var(--ice)" : "#fff", boxShadow: "inset 0 0 0 2px var(--blue)" }}
            >
              Flag as priority
              <span style={{ width: 40, height: 22, border: "2px solid var(--ink)", position: "relative", background: st.flag ? "var(--blue)" : "#fff" }}>
                <span style={{ position: "absolute", top: 2, left: st.flag ? 20 : 2, width: 14, height: 14, background: st.flag ? "#fff" : "var(--ink)" }} />
              </span>
            </button>
          </div>
        </div>
        <div className={s.footer}>
          <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-700)" }} role="status">
            {savedLine}
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SKIPS.map((sk) => (
              <button
                key={sk.code}
                type="button"
                className={s.skip}
                onClick={() => {
                  set(T.key, { skipped: sk.code, L: undefined, R: undefined, v: undefined, t: undefined });
                  commit({ kind: "skip", testKey: T.key, skipReason: sk.code });
                  next();
                }}
              >
                Skip · {sk.label}
              </button>
            ))}
            <Button variant="ink" size="md" onClick={next} disabled={finishing}>
              {cur >= tests.length - 1 ? "FINISH TESTING →" : "SAVE AND NEXT →"}
            </Button>
          </div>
        </div>
      </section>

      {/* Right: live summary */}
      <aside className={s.summary} aria-label="Captured">
        <div className={s.boxHead}>
          <b>Captured</b>
          <span style={{ fontSize: 10, textTransform: "uppercase" }}>
            {captured} of {tests.length}
          </span>
        </div>
        {SYSTEMS.map((g) => {
          const rows = tests.filter((t) => t.system === g.key);
          if (!rows.length) return null;
          return (
            <div key={g.key} style={{ padding: "10px 16px", borderBottom: "1px solid var(--grey-200)", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--blue)" }}>{g.label}</span>
              {rows.map((t) => {
                const v = vals[t.key];
                const i = tests.indexOf(t);
                return (
                  <button key={t.key} type="button" onClick={() => go(i)} aria-current={i === cur ? "true" : undefined} style={{ border: 0, background: "none", padding: 0, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11, textAlign: "left", color: hasValue(v) || v?.skipped ? "var(--ink)" : "var(--grey-400)", textDecoration: i === cur ? "underline" : "none", textUnderlineOffset: 3 }}>
                    <span>
                      {v?.flag ? "● " : ""}
                      {t.name}
                    </span>
                    <b style={{ whiteSpace: "nowrap" }}>{fmtV(t, v)}</b>
                  </button>
                );
              })}
            </div>
          );
        })}
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6, borderBottom: "1px solid var(--grey-200)" }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Flagged as priority</span>
          {flagged.length === 0 && <span style={{ fontSize: 11, color: "var(--grey-600)" }}>None yet</span>}
          {flagged.map((f) => (
            <span key={f.key} style={{ font: "600 13px var(--font-sans)", padding: "6px 8px", boxShadow: "inset 0 0 0 1.5px var(--blue)" }}>
              {f.name}
            </span>
          ))}
        </div>
        <label style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Add a test from the bank</span>
          <select value="" onChange={(e) => addTest(e.target.value)} style={{ height: 44, border: "1.5px solid var(--ink)", background: "#fff", padding: "0 8px", font: "400 14px var(--font-sans)", borderRadius: 0 }}>
            <option value="">Choose a test</option>
            {SYSTEMS.map((g) => (
              <optgroup key={g.key} label={g.label}>
                {p.bank
                  .filter((t) => t.system === g.key && !keys.includes(t.key))
                  .map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.name}
                      {online && t.availability === "IN_PERSON" ? " · in person only" : ""}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
      </aside>

      {cam && (
        <Camera
          assessmentId={p.a.id}
          view={T.key}
          label={T.name}
          kind={cam}
          onClose={() => setCam(null)}
          onDone={() => {
            setCam(null);
            flash(cam === "VIDEO" ? `Video saved to ${T.name}.` : `Photo saved to ${T.name}.`);
          }}
        />
      )}
    </div>
  );
}

type SpeechRec = { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; start: () => void };

/** − value + stepper with direct keypad entry (decimals per step, /10 scales clamped). */
function Stepper({ def, value, big, onChange, label }: { def: TestDef; value?: number; big: boolean; onChange: (v: number) => void; label: string }) {
  const step = stepOf(def);
  const max = maxOf(def);
  const min = def.min ?? 0;
  const clamp = (v: number) => r1(Math.max(min, max != null ? Math.min(max, v) : v));
  const [draft, setDraft] = useState<string | null>(null);
  const h = big ? 72 : 64;
  return (
    <div className={s.stepper} style={{ gridTemplateColumns: big ? "64px 1fr 64px" : "56px 1fr 56px" }}>
      <button type="button" aria-label={`Less, ${label}`} onClick={() => onChange(clamp((value ?? 0) - step))} style={{ height: h, fontSize: big ? 24 : 22 }}>
        −
      </button>
      <span className={s.stepVal} style={{ fontSize: big ? 40 : 34 }}>
        <input
          inputMode="decimal"
          aria-label={label}
          value={draft ?? show(value)}
          onFocus={(e) => {
            setDraft(value == null ? "" : show(value));
            e.target.select();
          }}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d.]/g, ""))}
          onBlur={() => {
            if (draft != null && draft !== "" && !Number.isNaN(Number(draft))) onChange(clamp(Number(draft)));
            setDraft(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          style={{ fontSize: big ? 40 : 34, width: `${Math.max(2, (draft ?? show(value)).length) + 0.6}ch`, maxWidth: "100%" }}
        />
        <span style={{ font: `400 ${big ? 14 : 13}px var(--font-mono)` }}>{def.unit}</span>
      </span>
      <button type="button" aria-label={`More, ${label}`} onClick={() => onChange(clamp((value ?? 0) + step))} style={{ height: h, fontSize: big ? 24 : 22 }}>
        +
      </button>
    </div>
  );
}

/** min:sec entry for the 1 km run (stored as seconds). */
function TimeInput({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  const [m, setM] = useState(value != null ? String(Math.floor(value / 60)) : "");
  const [sec, setSec] = useState(value != null ? String(Math.round(value % 60)).padStart(2, "0") : "");
  const save = () => {
    const mm = Number(m || 0),
      ss = Number(sec || 0);
    if ((m || sec) && !Number.isNaN(mm) && !Number.isNaN(ss)) onChange(mm * 60 + Math.min(59, ss));
  };
  const box = { height: 72, width: 96, border: 0, textAlign: "center" as const, fontFamily: "var(--font-display)", fontSize: 40 };
  return (
    <div className={s.box} style={{ flexDirection: "row", alignItems: "center", width: "fit-content" }}>
      <input inputMode="numeric" aria-label="Minutes" value={m} onChange={(e) => setM(e.target.value.replace(/\D/g, ""))} onBlur={save} style={box} />
      <span style={{ fontFamily: "var(--font-display)", fontSize: 40 }}>:</span>
      <input inputMode="numeric" aria-label="Seconds" value={sec} onChange={(e) => setSec(e.target.value.replace(/\D/g, "").slice(0, 2))} onBlur={save} style={box} />
      <span style={{ font: "400 14px var(--font-mono)", padding: "0 14px" }}>min:sec</span>
    </div>
  );
}
