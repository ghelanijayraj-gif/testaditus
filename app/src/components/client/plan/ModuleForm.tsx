"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds";
import { Lock } from "@/components/ui/Lock";
import { useToast } from "@/components/ui/Toast";
import { useReadOnly } from "@/components/client/readonly";
import { saveModuleDraft, submitModule } from "@/server/client/plan/actions";
import { canUseCamera, extFor, mb, mediaUrl, recorderType, uploadFile } from "./upload";
import s from "./plan.module.css";

export type FieldDef = { key: string; label: string; type: string; meta?: string; options?: string[]; placeholder?: string; unit?: string; maxSeconds?: number };
type Media = { id: string; name: string; size: number; durationS?: number };
type Values = Record<string, unknown>;

/** 06 F. Custom module rendered from its template fields, with autosave and SUBMIT →. */
export function ModuleForm(p: {
  moduleKey: string;
  name: string;
  purpose: string;
  typeLabel: string;
  time: string;
  by: string | null;
  note: string | null;
  safety: string | null;
  instructions: string | null;
  fields: FieldDef[];
  initial: Values;
  savedAt: string | null;
  locked: boolean;
  practitioner: string;
}) {
  const ro = useReadOnly() || p.locked;
  const toast = useToast();
  const router = useRouter();
  const [values, setValues] = useState<Values>(p.initial);
  const [saved, setSaved] = useState(p.savedAt);
  const [busy, setBusy] = useState(0);
  const [pending, start] = useTransition();
  const first = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Autosave 800 ms after the last change.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (ro) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const r = await saveModuleDraft(p.moduleKey, values);
      if (r.savedAt) setSaved(r.savedAt);
      else if (r.error) toast(r.error);
    }, 800);
    return () => clearTimeout(timer.current);
  }, [values, p.moduleKey, ro, toast]);

  const set = (k: string, v: unknown) => setValues((x) => ({ ...x, [k]: v }));
  const track = (d: number) => setBusy((b) => b + d);
  const submit = () =>
    start(async () => {
      clearTimeout(timer.current);
      const r = await submitModule(p.moduleKey, values);
      if (r.error) toast(r.error);
      if (r.redirect) router.push(r.redirect);
    });

  return (
    <>
      <main className={s.main} style={{ maxWidth: 720, paddingBottom: 120, display: "flex", flexDirection: "column", gap: 16 }}>
        <Link href="/assessment/plan" className={s.textBtn} style={{ alignSelf: "flex-start" }}>
          ← Assessment plan
        </Link>
        <span style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>
          <span style={{ color: "var(--blue)" }}>
            {p.typeLabel} · {p.time}
          </span>
          <span style={{ color: "var(--grey-600)" }} aria-live="polite">
            {p.locked ? "Submitted" : busy ? "Uploading…" : saved ? `Saved · ${saved}` : "Saves as you go"}
          </span>
        </span>
        <h1 className={s.h1} style={{ fontSize: "clamp(28px,5vw,44px)" }}>
          {p.name}
        </h1>
        <span className={s.lead}>{p.purpose}</span>
        {p.note && (
          <div style={{ background: "var(--ice)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--navy)" }}>{p.by}</span>
            <span style={{ font: "400 15px/1.5 var(--font-sans)" }}>“{p.note}”</span>
          </div>
        )}
        {p.safety && <div style={{ border: "1.5px solid var(--blue)", padding: "12px 14px", font: "400 14px/1.5 var(--font-sans)" }}>{p.safety}</div>}
        {p.locked && <div style={{ background: "var(--grey-50)", padding: "12px 14px", font: "500 15px/1.5 var(--font-sans)", color: "var(--navy)" }}>Submitted. {p.practitioner} is reviewing it.</div>}
        {p.fields.length === 0 && <span style={{ font: "400 15px/1.5 var(--font-sans)" }}>{p.instructions ?? "Nothing to fill in here. The team will message you with the details."}</span>}
        {p.fields.map((f) => (
          <fieldset key={f.key} disabled={ro} style={{ margin: 0, border: "2px solid var(--ink)", padding: 16, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
            <legend style={{ display: "contents" }}>
              <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <b style={{ font: "600 16px var(--font-sans)" }}>{f.label}</b>
                <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>{f.meta}</span>
              </span>
            </legend>
            <FieldInput f={f} value={values[f.key]} onChange={(v) => set(f.key, v)} moduleKey={p.moduleKey} instructions={p.instructions} disabled={ro} track={track} />
          </fieldset>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, textTransform: "uppercase", color: "var(--grey-700)" }}>
          <Lock size={10} /> Seen only by you, {p.practitioner} and your head coach
        </span>
      </main>
      {!p.locked && p.fields.length > 0 && (
        <div className={s.bottomBar}>
          <div style={{ width: "100%", maxWidth: 720, display: "flex", gap: 8 }}>
            <Button variant="blue" size="lg" full onClick={submit} disabled={ro || pending || busy > 0}>
              {pending ? "SENDING…" : "SUBMIT →"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function Choice({ options, value, onChange, multi, disabled }: { options: string[]; value: unknown; onChange: (v: unknown) => void; multi?: boolean; disabled?: boolean }) {
  const arr = Array.isArray(value) ? (value as string[]) : [];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role={multi ? "group" : "radiogroup"}>
      {options.map((o) => {
        const on = multi ? arr.includes(o) : value === o;
        return (
          <button key={o} type="button" disabled={disabled} aria-pressed={on} className={s.sel} onClick={() => onChange(multi ? (on ? arr.filter((x) => x !== o) : [...arr, o]) : o)} style={{ minHeight: 44, padding: "0 14px", fontSize: 12 }}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

function FieldInput({ f, value, onChange, moduleKey, instructions, disabled, track }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void; moduleKey: string; instructions: string | null; disabled?: boolean; track: (d: number) => void }) {
  const id = `f_${f.key}`;
  switch (f.type) {
    case "VIDEO":
      return <VideoField f={f} value={value as Media | undefined} onChange={onChange} moduleKey={moduleKey} instructions={instructions} disabled={disabled} track={track} />;
    case "PHOTO":
      return <FileField f={f} value={value as Media | undefined} onChange={onChange} moduleKey={moduleKey} kind="photo" disabled={disabled} track={track} />;
    case "UPLOAD":
      return <FileField f={f} value={value as Media | undefined} onChange={onChange} moduleKey={moduleKey} kind="document" disabled={disabled} track={track} />;
    case "SINGLE_CHOICE":
      return <Choice options={f.options ?? []} value={value} onChange={onChange} disabled={disabled} />;
    case "MULTI_CHOICE":
      return <Choice options={f.options ?? []} value={value} onChange={onChange} multi disabled={disabled} />;
    case "YES_NO":
      return <Choice options={["Yes", "No"]} value={value} onChange={onChange} disabled={disabled} />;
    case "SCALE":
      return <Choice options={Array.from({ length: 11 }, (_, i) => String(i))} value={value === undefined ? undefined : String(value)} onChange={(v) => onChange(Number(v))} disabled={disabled} />;
    case "LONG_TEXT":
      return <textarea id={id} aria-label={f.label} className={s.input} rows={4} placeholder={f.placeholder} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} />;
    case "NUMBER_UNIT":
      return (
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input id={id} aria-label={f.label} className={s.input} style={{ maxWidth: 160 }} type="number" inputMode="decimal" value={(value as number | undefined) ?? ""} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} disabled={disabled} />
          <span style={{ fontSize: 12, textTransform: "uppercase" }}>{f.unit}</span>
        </span>
      );
    case "TIMER":
      return <TimerField value={value as number | undefined} onChange={onChange} disabled={disabled} />;
    case "COUNTER":
      return <CounterField value={(value as number | undefined) ?? 0} onChange={onChange} disabled={disabled} />;
    default:
      return <input id={id} aria-label={f.label} className={s.input} placeholder={f.placeholder} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} />;
  }
}

/** Upload (PDF/JPG/PNG ≤ 20 MB) or photo, with drag and drop and progress. */
function FileField({ f, value, onChange, moduleKey, kind, disabled, track }: { f: FieldDef; value?: Media; onChange: (v: unknown) => void; moduleKey: string; kind: "photo" | "document"; disabled?: boolean; track: (d: number) => void }) {
  const toast = useToast();
  const [pct, setPct] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const send = async (file: File) => {
    if (kind === "document" && file.size > 20 * 1024 * 1024) return toast("That file is over 20 MB.");
    setPct(0);
    track(1);
    try {
      const r = await uploadFile({ file, name: file.name, module: moduleKey, field: f.key, kind }, setPct);
      onChange({ id: r.id, name: r.name, size: r.size });
    } catch (e) {
      toast((e as Error).message === "connection dropped" ? "Upload paused · connection dropped. Try again." : (e as Error).message);
    } finally {
      setPct(null);
      track(-1);
    }
  };
  const has = !!value?.id;
  return (
    <label
      className={s.drop}
      style={{ background: has ? "var(--ice)" : over ? "var(--mist)" : "#fff", cursor: disabled ? "default" : "pointer" }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && !disabled) void send(file);
      }}
    >
      <input
        type="file"
        accept={kind === "photo" ? "image/*" : "application/pdf,image/jpeg,image/png"}
        {...(kind === "photo" ? { capture: "environment" as const } : {})}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
        aria-label={f.label}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void send(file);
          e.target.value = "";
        }}
      />
      {kind === "photo" && has && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl(value!.id)} alt="" style={{ maxHeight: 180, maxWidth: "100%", objectFit: "contain" }} />
      )}
      <b style={{ font: "600 15px var(--font-sans)" }}>{pct !== null ? `Uploading · ${pct}%` : has ? `✓ ${value!.name}` : kind === "photo" ? "Take a photo or tap to choose" : "Drop a file or tap to choose"}</b>
      <span style={{ fontSize: 11, color: "var(--grey-600)" }}>{has ? `${mb(value!.size)} · tap to replace` : kind === "photo" ? "JPG or PNG" : "PDF, JPG or PNG · up to 20 MB"}</span>
    </label>
  );
}

/** Video: records with the device camera (MediaRecorder), file input fallback. */
function VideoField({ f, value, onChange, moduleKey, instructions, disabled, track }: { f: FieldDef; value?: Media; onChange: (v: unknown) => void; moduleKey: string; instructions: string | null; disabled?: boolean; track: (d: number) => void }) {
  const toast = useToast();
  const max = f.maxSeconds ?? 20;
  const [state, setState] = useState<"idle" | "live" | "rec" | "up">("idle");
  const [secs, setSecs] = useState(0);
  const [pct, setPct] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const fileIn = useRef<HTMLInputElement>(null);
  const [a, b] = (instructions ?? "Phone on its side, 3 metres away, at hip height. Run past the phone twice.").split(/(?<=\.)\s+/);

  const stopAll = () => {
    clearInterval(tick.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(() => stopAll, []);

  const send = async (blob: Blob, durationS: number) => {
    setState("up");
    track(1);
    try {
      const r = await uploadFile({ file: blob, name: `${f.key}.${extFor(blob.type)}`, module: moduleKey, field: f.key, kind: "video", durationS }, setPct);
      onChange({ id: r.id, name: r.name, size: r.size, durationS: Math.round(durationS) });
    } catch (e) {
      toast((e as Error).message === "connection dropped" ? "Upload paused · connection dropped. Try again." : (e as Error).message);
    } finally {
      setState("idle");
      track(-1);
    }
  };

  const startCamera = async () => {
    const type = recorderType();
    if (!canUseCamera() || type === null) return fileIn.current?.click();
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      setState("live");
      requestAnimationFrame(() => {
        if (video.current && stream.current) {
          video.current.srcObject = stream.current;
          void video.current.play().catch(() => {});
        }
      });
      const chunks: Blob[] = [];
      const r = new MediaRecorder(stream.current, type ? { mimeType: type } : undefined);
      rec.current = r;
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const t0 = Date.now();
      r.onstop = () => {
        const d = (Date.now() - t0) / 1000;
        stopAll();
        void send(new Blob(chunks, { type: r.mimeType || "video/webm" }), d);
      };
      r.start(500);
      setSecs(0);
      setState("rec");
      tick.current = setInterval(() => {
        const e = Math.floor((Date.now() - t0) / 1000);
        setSecs(e);
        if (e >= max && r.state === "recording") r.stop();
      }, 250);
    } catch {
      stopAll();
      setState("idle");
      toast("Camera blocked. Choose a video instead.");
      fileIn.current?.click();
    }
  };

  const click = () => {
    if (disabled) return;
    if (state === "rec") return rec.current?.state === "recording" && rec.current.stop();
    if (state === "idle") void startCamera();
  };

  const has = !!value?.id;
  const mmss = (n: number) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
  const title = state === "rec" ? `RECORDING… ${mmss(secs)}` : state === "up" ? `UPLOADING · ${pct}%` : has ? `✓ ${mmss(value!.durationS ?? 0)} RECORDED` : "● RECORD";
  const sub = state === "rec" ? `${b ?? "Tap to stop"} · tap to stop` : has ? "Tap to retake" : a;

  return (
    <>
      <button type="button" onClick={click} disabled={disabled || state === "up"} aria-label={title} style={{ position: "relative", border: 0, cursor: "pointer", aspectRatio: "16/9", background: has && state === "idle" ? "var(--blue)" : "var(--ink)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, textTransform: "uppercase", overflow: "hidden", fontFamily: "var(--font-mono)" }}>
        {(state === "live" || state === "rec") && <video ref={video} muted playsInline className={s.camVideo} style={{ opacity: 0.55 }} />}
        <span style={{ position: "relative", fontFamily: "var(--font-display)", fontSize: 22 }}>{title}</span>
        <span style={{ position: "relative" }}>{sub}</span>
      </button>
      <button type="button" className={s.textBtn} style={{ alignSelf: "flex-start" }} onClick={() => fileIn.current?.click()} disabled={disabled || state !== "idle"}>
        Or choose a video file
      </button>
      <input
        ref={fileIn}
        type="file"
        accept="video/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const el = document.createElement("video");
          el.preload = "metadata";
          el.onloadedmetadata = () => void send(file, el.duration || 0);
          el.onerror = () => void send(file, 0);
          el.src = URL.createObjectURL(file);
        }}
      />
    </>
  );
}

function TimerField({ value, onChange, disabled }: { value?: number; onChange: (v: unknown) => void; disabled?: boolean }) {
  const [run, setRun] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (run === null) return;
    const i = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(i);
  }, [run]);
  const shown = run !== null ? Math.max(0, (now - run) / 1000) : value ?? 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <span style={{ fontFamily: "var(--font-display)", fontSize: 48, lineHeight: 0.9 }} aria-live="off">
        {shown.toFixed(1)}
        <span style={{ font: "400 14px var(--font-mono)" }}> s</span>
      </span>
      <Button
        variant={run !== null ? "ink" : "blue"}
        size="md"
        disabled={disabled}
        onClick={() => {
          if (run === null) {
            setNow(Date.now());
            setRun(Date.now());
          } else {
            onChange(Math.round(((Date.now() - run) / 1000) * 10) / 10);
            setRun(null);
          }
        }}
      >
        {run !== null ? "STOP" : value ? "REDO" : "START"}
      </Button>
    </div>
  );
}

function CounterField({ value, onChange, disabled }: { value: number; onChange: (v: unknown) => void; disabled?: boolean }) {
  const btn = { height: 64, border: 0, background: "var(--grey-50)", cursor: "pointer", fontSize: 24 } as const;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "64px auto 64px", alignItems: "center", border: "2px solid var(--ink)", alignSelf: "flex-start" }}>
      <button type="button" aria-label="Minus one" style={btn} disabled={disabled} onClick={() => onChange(Math.max(0, value - 1))}>
        −
      </button>
      <span style={{ padding: "0 20px", fontFamily: "var(--font-display)", fontSize: 44, textAlign: "center" }} aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label="Plus one" style={btn} disabled={disabled} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}
