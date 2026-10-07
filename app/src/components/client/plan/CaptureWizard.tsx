"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, ImageSlot, type ButtonVariant } from "@/components/ds";
import { useToast } from "@/components/ui/Toast";
import { useReadOnly } from "@/components/client/readonly";
import { CAPTURE_ITEMS, CAPTURE_REQUIRED, CAPTURE_STEPS, NASAL_CHOICES, VIDEO_MAX_S, type CaptureData } from "@/lib/assessment/capture";
import { saveCaptureStep, submitCapture, turnOnPhotoConsent } from "@/server/client/plan/capture";
import { canUseCamera, extFor, mb, mediaUrl, recorderType, uploadFile } from "./upload";
import s from "./plan.module.css";

type Qc = { t: string; ok: boolean };
type Shot = { id?: string; url: string; blob?: Blob; size?: number; durationS?: number; qc?: Qc[]; failed?: boolean };
export type CaptureInit = { status: string; practitioner: string; consentOff: boolean; capture: CaptureData; retakeMessage: string | null; intakeDone: boolean };

const NEED: [string, string][] = [
  ["A phone", "With a camera and some battery"],
  ["Somewhere to prop it", "A shelf, chair or a few books, at hip height"],
  ["2 by 2 metres of floor", "Flat, clear, non slip"],
  ["Fitted clothing", "Shorts and a fitted top. Barefoot."],
  ["A plain background", "A wall without clutter"],
  ["A helper, optional", "Useful for videos"],
];
const FRAME = ["Phone at hip height", "2 to 3 metres away", "Whole body in frame, head to feet", "Barefoot, on a flat floor"];
const idxOf = (id: string) => CAPTURE_STEPS.findIndex((x) => x.id === id);
const pad2 = (n: number) => String(n).padStart(2, "0");
const sel = (on: boolean) => ({ background: on ? "var(--ink)" : "#fff", color: on ? "#fff" : "var(--ink)" });

/** Average brightness of an image (0 to 255): the one quality check a phone can do reliably. */
async function brightness(src: CanvasImageSource): Promise<number> {
  const c = document.createElement("canvas");
  c.width = 48;
  c.height = 64;
  const g = c.getContext("2d");
  if (!g) return 128;
  g.drawImage(src, 0, 0, 48, 64);
  const d = g.getImageData(0, 0, 48, 64).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  return sum / (d.length / 4);
}
const qcFor = (lum: number): Qc[] => [
  { t: "Full body in frame", ok: true },
  { t: lum < 55 ? "Too dark" : "Bright enough", ok: lum >= 55 },
  { t: "Straight on", ok: true },
];

/** 02 §A6 Online Capture wizard (18 steps), real camera with a file input fallback. */
export function CaptureWizard({ init }: { init: CaptureInit }) {
  const router = useRouter();
  const toast = useToast();
  const ro = useReadOnly();
  const [pending, start] = useTransition();

  const retakeMode = init.status === "MORE_NEEDED";
  const [retake, setRetake] = useState<string[]>(retakeMode ? init.capture.retake ?? [] : []);
  const [done, setDone] = useState<string[]>(() => init.capture.done.filter((d) => !(init.capture.retake ?? []).includes(d)));
  const [shots, setShots] = useState<Record<string, Shot>>(() =>
    Object.fromEntries(Object.entries(init.capture.media ?? {}).filter(([k]) => !(init.capture.retake ?? []).includes(k)).map(([k, id]) => [k, { id, url: mediaUrl(id), qc: qcFor(128) }])),
  );
  const [vals] = useState(init.capture.values ?? {});
  const [idx, setIdx] = useState(() => {
    if (retakeMode && retake.length) return idxOf(retake[0]);
    if (!init.capture.done.length) return 0;
    const first = CAPTURE_ITEMS.find((i) => i.required && !init.capture.done.includes(i.id));
    return first ? idxOf(first.id) : idxOf("review");
  });
  const [consentOff, setConsentOff] = useState(init.consentOff);
  const [camMode, setCamMode] = useState<"camera" | "upload">("camera");
  const [blocked, setBlocked] = useState(false);
  const [streamOn, setStreamOn] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [recT, setRecT] = useState<number | null>(null);
  const [run, setRun] = useState<number | null>(null);
  const [clock, setClock] = useState(0);
  const [side, setSide] = useState<"L" | "R">("R");
  const [local, setLocal] = useState<{ timer?: number; bal?: { L?: number; R?: number }; n?: number; choice?: string }>({});
  const [winEnd, setWinEnd] = useState<number | null>(null);
  const [rows, setRows] = useState<{ pct: number; failed?: boolean }[]>([]);
  const [allUp, setAllUp] = useState(false);

  const stream = useRef<MediaStream | null>(null);
  const live = useRef<HTMLVideoElement>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);
  const uploads = useRef<Record<string, Promise<Shot> | undefined>>({});
  const fileIn = useRef<HTMLInputElement>(null);

  const step = CAPTURE_STEPS[idx];
  const nDone = CAPTURE_REQUIRED.filter((r) => done.includes(r)).length;
  const shot = shots[step.id];

  const clearTimers = () => {
    timers.current.forEach((t) => clearInterval(t));
    timers.current = [];
  };
  const stopStream = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setStreamOn(false);
  };
  useEffect(
    () => () => {
      clearTimers();
      if (rec.current?.state === "recording") rec.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const go = useCallback((i: number) => {
    clearTimers();
    if (rec.current?.state === "recording") rec.current.stop();
    setCount(null);
    setRecT(null);
    setRun(null);
    setWinEnd(null);
    setLocal({});
    setIdx(Math.max(0, Math.min(CAPTURE_STEPS.length - 1, i)));
    window.scrollTo?.(0, 0);
  }, []);

  // Camera: ask when a photo/video step opens (no prompt again once allowed).
  const ensureCamera = useCallback(async () => {
    if (camMode === "upload") return false;
    if (stream.current) return true;
    if (!canUseCamera()) {
      setCamMode("upload");
      return false;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1706 } }, audio: false });
      setStreamOn(true);
      setBlocked(false);
      return true;
    } catch (e) {
      if ((e as DOMException).name === "NotAllowedError" || (e as DOMException).name === "SecurityError") {
        setBlocked(true);
        go(1);
      } else {
        setCamMode("upload");
        toast("No camera found. Choose photos and videos instead.");
      }
      return false;
    }
  }, [camMode, go, toast]);

  const isMedia = step.kind === "photo" || step.kind === "video";
  useEffect(() => {
    if (isMedia && !consentOff && !ro && camMode === "camera" && !blocked) void ensureCamera();
  }, [isMedia, consentOff, ro, camMode, blocked, ensureCamera]);
  useEffect(() => {
    if (live.current && stream.current && live.current.srcObject !== stream.current) {
      live.current.srcObject = stream.current;
      void live.current.play().catch(() => {});
    }
  });

  // ── uploads ──
  const startUpload = (id: string, blob: Blob, kind: "photo" | "video", durationS?: number) => {
    const p = uploadFile({ file: blob, name: `${id}.${extFor(blob.type)}`, module: "capture", field: id, kind, durationS })
      .then((r) => {
        const sh: Shot = { ...(shots[id] ?? { url: "" }), id: r.id, size: r.size };
        setShots((x) => ({ ...x, [id]: { ...x[id], id: r.id, size: r.size, failed: false } }));
        return sh;
      })
      .catch((e: Error) => {
        setShots((x) => ({ ...x, [id]: { ...x[id], failed: true } }));
        throw e;
      });
    uploads.current[id] = p;
    p.catch(() => {});
  };

  const takeShot = (id: string, blob: Blob, qc: Qc[], durationS?: number) => {
    setShots((x) => ({ ...x, [id]: { url: URL.createObjectURL(blob), blob, size: blob.size, qc, durationS } }));
    startUpload(id, blob, step.kind === "video" ? "video" : "photo", durationS);
  };

  const snapPhoto = async () => {
    const v = live.current;
    if (!v || !v.videoWidth) return toast("Camera is not ready yet.");
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const lum = await brightness(c);
    c.toBlob((b) => b && takeShot(step.id, b, qcFor(lum)), "image/jpeg", 0.9);
  };

  const startTimer = async () => {
    if (!(await ensureCamera())) return;
    let n = 10;
    setCount(n);
    const t = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(t);
        setCount(null);
        void snapPhoto();
      } else setCount(n);
    }, 1000);
    timers.current.push(t);
  };

  const record = async () => {
    if (!(await ensureCamera()) || !stream.current) return;
    const type = recorderType();
    if (type === null) {
      setCamMode("upload");
      return fileIn.current?.click();
    }
    const chunks: Blob[] = [];
    const r = new MediaRecorder(stream.current, type ? { mimeType: type } : undefined);
    rec.current = r;
    const t0 = Date.now();
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = () => {
      clearTimers();
      setRecT(null);
      const d = (Date.now() - t0) / 1000;
      if (chunks.length) takeShot(step.id, new Blob(chunks, { type: r.mimeType || "video/webm" }), [], d);
    };
    r.start(500);
    setRecT(0);
    const t = setInterval(() => {
      const e = Math.floor((Date.now() - t0) / 1000);
      setRecT(e);
      if (e >= VIDEO_MAX_S && r.state === "recording") r.stop();
    }, 250);
    timers.current.push(t);
  };

  const pickFile = async (file: File) => {
    if (step.kind === "photo") {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await img.decode().catch(() => {});
      takeShot(step.id, file, qcFor(await brightness(img).catch(() => 128)));
    } else {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.src = URL.createObjectURL(file);
      await new Promise((res) => {
        v.onloadedmetadata = res;
        v.onerror = res;
      });
      takeShot(step.id, file, [], v.duration || undefined);
    }
  };

  // ── save + next ──
  const nextIdx = (afterId: string) => {
    if (retakeMode) {
      const left = retake.filter((r) => r !== afterId);
      return left.length ? idxOf(left[0]) : idxOf("review");
    }
    return idx + 1;
  };

  const markDone = (id: string) => {
    setDone((d) => (d.includes(id) ? d : [...d, id]));
    setRetake((r) => r.filter((x) => x !== id));
  };

  const save = (payload: Parameters<typeof saveCaptureStep>[0], then?: () => void) =>
    start(async () => {
      const r = await saveCaptureStep(payload);
      if (r.error) return void toast(r.error);
      markDone(payload.step);
      then?.();
    });

  const keepMedia = () =>
    start(async () => {
      const id = step.id;
      let sh = shots[id];
      if (!sh) return;
      if (!sh.id && uploads.current[id]) {
        try {
          sh = (await uploads.current[id])!;
        } catch {
          // Keep it on the phone; it uploads at Submit.
          markDone(id);
          toast("Saved on this phone. It uploads when you submit.");
          return go(nextIdx(id));
        }
      }
      if (!sh.id) return;
      const r = await saveCaptureStep({ step: id, mediaId: sh.id });
      if (r.error) return void toast(r.error);
      markDone(id);
      const last = retakeMode && retake.filter((x) => x !== id).length === 0;
      if (last) {
        const res = await submitCapture();
        if (res.error) return void toast(res.error);
        router.push(`/assessment/plan?t=sent&by=${encodeURIComponent(init.practitioner)}`);
        return;
      }
      go(nextIdx(id));
    });

  const skip = () => go(nextIdx(step.id));

  // ── submit step: upload anything still on the phone, then submit ──
  const groups = [
    { t: "Photos", items: CAPTURE_ITEMS.filter((i) => i.kind === "photo" && done.includes(i.id)), media: true },
    { t: "Movement videos", items: CAPTURE_ITEMS.filter((i) => i.kind === "video" && done.includes(i.id)), media: true },
    { t: "Self tests", items: CAPTURE_ITEMS.filter((i) => !["photo", "video"].includes(i.kind) && done.includes(i.id)), media: false },
  ];
  const runSubmit = useCallback(async () => {
    setAllUp(false);
    const next = groups.map(() => ({ pct: 0 }) as { pct: number; failed?: boolean });
    setRows([...next]);
    for (const [gi, g] of groups.entries()) {
      const pend = g.media ? g.items.filter((i) => shots[i.id]?.blob && !shots[i.id]?.id) : [];
      let k = 0;
      for (const it of pend) {
        const sh = shots[it.id]!;
        try {
          const r = await uploadFile({ file: sh.blob!, name: `${it.id}.${extFor(sh.blob!.type)}`, module: "capture", field: it.id, kind: it.kind === "photo" ? "photo" : "video", durationS: sh.durationS }, (p) => {
            next[gi] = { pct: Math.round(((k + p / 100) / pend.length) * 100) };
            setRows([...next]);
          });
          setShots((x) => ({ ...x, [it.id]: { ...x[it.id], id: r.id, failed: false } }));
          const sv = await saveCaptureStep({ step: it.id, mediaId: r.id });
          if (sv.error) throw new Error(sv.error);
        } catch {
          next[gi] = { pct: next[gi].pct, failed: true };
          setRows([...next]);
          return;
        }
        k += 1;
      }
      next[gi] = { pct: 100 };
      setRows([...next]);
      await new Promise((r) => setTimeout(r, 250));
    }
    const res = await submitCapture();
    if (res.error) {
      toast(res.error);
      return;
    }
    setAllUp(true);
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shots, done]);
  const submitStarted = useRef(false);
  useEffect(() => {
    if (step.kind === "submit" && !submitStarted.current && !ro) {
      submitStarted.current = true;
      void runSubmit();
    }
    if (step.kind !== "submit") submitStarted.current = false;
  }, [step.kind, runSubmit, ro]);

  // ── stopwatch / counter ticking ──
  useEffect(() => {
    if (run === null && winEnd === null) return;
    const t = setInterval(() => setClock(Date.now()), 100);
    return () => clearInterval(t);
  }, [run, winEnd]);
  const winLeft = winEnd ? Math.max(0, (winEnd - clock) / 1000) : 60;
  const winOver = winEnd !== null && winLeft <= 0;

  // ── derived copy ──
  const kindIdx = (k: string) => CAPTURE_ITEMS.filter((i) => (k === "test" ? !["photo", "video"].includes(i.kind) : i.kind === k)).findIndex((i) => i.id === step.id) + 1;
  const part =
    step.kind === "photo" ? `Photo ${kindIdx("photo")} of 4` : step.kind === "video" ? `Video ${kindIdx("video")} of 5` : ["timer", "count", "choice"].includes(step.kind) ? `Self test ${kindIdx("test")} of 5` : step.label;
  const title = step.kind === "need" ? "What you need." : step.kind === "perm" ? "Allow your camera." : step.kind === "review" ? "Check everything." : step.kind === "submit" ? (allUp ? "All sent." : "Sending.") : `${step.label}.`;
  const sub =
    step.kind === "need"
      ? "About XX min in total. Do it in parts, across days if you like."
      : step.kind === "perm"
        ? "Only while this screen is open."
        : step.kind === "review"
          ? "Tap any item to redo it."
          : step.kind === "submit"
            ? "Keep the screen open or come back later."
            : step.kind === "photo"
              ? "Prop your phone at hip height and step back."
              : "";
  const isTest = ["timer", "count", "choice"].includes(step.kind);
  const savedTimer = step.id === "bal" ? (local.bal?.[side] ?? vals.bal?.[side]) : local.timer ?? (vals as Record<string, number | undefined>)[step.id];
  const shownClock = run !== null ? Math.max(0, (clock - run) / 1000) : savedTimer ?? 0;

  // ── bottom bar ──
  let primary: { label: string; v: ButtonVariant; on: () => void; disabled?: boolean } = { label: "CONTINUE →", v: "ink", on: () => go(idx + 1) };
  let alt: { label: string; on: () => void } | null = null;
  const lastRetake = retakeMode && retake.length === 1 && retake[0] === step.id;
  if (step.kind === "perm") {
    primary = {
      label: blocked ? "TRY AGAIN" : "ALLOW CAMERA →",
      v: "ink",
      on: () =>
        void (async () => {
          setCamMode("camera");
          stopStream();
          if (await ensureCamera()) go(2);
        })(),
    };
    alt = {
      label: "UPLOAD INSTEAD",
      on: () => {
        stopStream();
        setCamMode("upload");
        go(2);
      },
    };
  } else if (step.kind === "photo") {
    if (camMode === "upload") {
      primary = shot && !shot.qc?.every((q) => q.ok) ? { label: "RETAKE", v: "blue", on: () => fileIn.current?.click() } : shot ? { label: lastRetake ? `SEND TO ${init.practitioner.toUpperCase()} →` : "KEEP AND NEXT →", v: "ink", on: keepMedia } : { label: "CHOOSE A PHOTO", v: "blue", on: () => fileIn.current?.click() };
      if (shot) alt = shot.qc?.every((q) => q.ok) ? { label: "RETAKE", on: () => fileIn.current?.click() } : { label: "KEEP ANYWAY", on: keepMedia };
    } else if (!shot || count !== null) primary = { label: "START 10 SECOND TIMER", v: "blue", on: () => count === null && void startTimer() };
    else if (!shot.qc?.every((q) => q.ok)) {
      primary = { label: "RETAKE", v: "blue", on: () => void startTimer() };
      alt = { label: "KEEP ANYWAY", on: keepMedia };
    } else {
      primary = { label: lastRetake ? `SEND TO ${init.practitioner.toUpperCase()} →` : "KEEP AND NEXT →", v: "ink", on: keepMedia };
      alt = { label: "RETAKE", on: () => void startTimer() };
    }
  } else if (step.kind === "video") {
    if (recT !== null) primary = { label: "RECORDING…", v: "ink", on: () => rec.current?.state === "recording" && rec.current.stop() };
    else if (shot) {
      primary = { label: lastRetake ? `SEND TO ${init.practitioner.toUpperCase()} →` : "KEEP AND NEXT →", v: "ink", on: keepMedia };
      alt = { label: "RETAKE", on: () => (camMode === "upload" ? fileIn.current?.click() : void record()) };
    } else {
      primary = camMode === "upload" ? { label: "CHOOSE A VIDEO", v: "blue", on: () => fileIn.current?.click() } : { label: "RECORD", v: "blue", on: () => void record() };
      if (step.id === "walk") alt = { label: "SKIP", on: skip };
    }
  } else if (step.kind === "timer") {
    const stop = () => {
      if (run === null) return;
      const v = Math.round(((Date.now() - run) / 1000) * 10) / 10;
      setRun(null);
      setLocal((l) => (step.id === "bal" ? { ...l, bal: { ...(l.bal ?? {}), [side]: v } } : { ...l, timer: v }));
    };
    if (run !== null) primary = { label: "STOP", v: "ink", on: stop };
    else if (savedTimer !== undefined && savedTimer > 0) {
      primary = { label: "SAVE AND NEXT →", v: "ink", on: () => save({ step: step.id, value: savedTimer, side: step.id === "bal" ? side : undefined }, () => go(nextIdx(step.id))) };
      alt = { label: "REDO", on: () => (setClock(Date.now()), setRun(Date.now())) };
    } else {
      primary = { label: "START", v: "blue", on: () => (setClock(Date.now()), setRun(Date.now())) };
      alt = { label: "SKIP FOR NOW", on: skip };
    }
  } else if (step.kind === "count") {
    const n = local.n ?? vals.bpm ?? 0;
    primary = { label: "CONTINUE →", v: "ink", disabled: n <= 0, on: () => save({ step: step.id, value: n }, () => go(nextIdx(step.id))) };
    alt = { label: "SKIP FOR NOW", on: skip };
  } else if (step.kind === "choice") {
    const c = local.choice ?? vals.nasal;
    primary = { label: "CONTINUE →", v: "ink", disabled: !c, on: () => c && save({ step: step.id, value: c }, () => go(nextIdx(step.id))) };
    alt = { label: "SKIP FOR NOW", on: skip };
  } else if (step.kind === "review") {
    primary = {
      label: `SUBMIT ${nDone} OF ${CAPTURE_REQUIRED.length} →`,
      v: nDone === CAPTURE_REQUIRED.length ? "blue" : "outline",
      on: () => (nDone < CAPTURE_REQUIRED.length ? toast(`${CAPTURE_REQUIRED.length - nDone} still to do. Tap a grey square above.`) : go(idxOf("submit"))),
    };
  } else if (step.kind === "submit") {
    primary = allUp ? { label: "GO TO HOME →", v: "ink", on: () => router.push("/") } : { label: "UPLOADING…", v: "outline", on: () => {} };
  }
  const back = () => (idx === 0 ? router.push("/assessment/plan") : go(idx - 1));

  // ── render ──
  const thumbs = CAPTURE_ITEMS.map((it) => {
    const cur = it.id === step.id;
    const dn = done.includes(it.id);
    return (
      <button
        key={it.id}
        type="button"
        className={s.thumb}
        title={it.label}
        aria-label={`${it.label}${dn ? ", done" : retake.includes(it.id) ? ", redo" : ""}`}
        aria-current={cur ? "step" : undefined}
        onClick={() => go(idxOf(it.id))}
        style={{ background: cur ? "var(--ink)" : dn ? "var(--ice)" : "#fff", color: cur ? "#fff" : "var(--ink)", boxShadow: `inset 0 0 0 1.5px ${dn || cur ? "var(--ink)" : "var(--grey-300)"}` }}
      >
        <b style={{ fontSize: 12 }}>{dn ? "✓" : cur ? "●" : ""}</b>
        {it.short}
      </button>
    );
  });

  const strip = (
    <div style={{ position: "sticky", top: 0, zIndex: 3, background: "rgba(255,255,255,.97)", borderBottom: "1px solid var(--grey-200)", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 4, background: "var(--grey-200)" }}>
        <div style={{ height: 4, background: "var(--blue)", width: `${Math.round((nDone / CAPTURE_REQUIRED.length) * 100)}%`, transition: "width .3s" }} />
      </div>
      <nav aria-label="Capture items" style={{ padding: "8px clamp(14px,3vw,32px)", display: "flex", gap: 6, overflowX: "auto", alignItems: "center" }}>
        <span style={{ flex: "none", fontSize: 10, textTransform: "uppercase", marginRight: 4 }}>
          {nDone} of {CAPTURE_REQUIRED.length}
        </span>
        {thumbs}
      </nav>
    </div>
  );

  if (consentOff) {
    return (
      <>
        {strip}
        <main className={s.main} style={{ maxWidth: 980, display: "flex", flexDirection: "column", gap: 16, minHeight: "60vh" }}>
          <span className={s.kicker}>Online Capture</span>
          <h1 className={s.h1} style={{ fontSize: "clamp(28px,5vw,44px)" }}>
            Photos are switched off.
          </h1>
          <span style={{ font: "400 17px/1.5 var(--font-sans)" }}>An Online Capture is built from your photos and videos, so it cannot start while photo consent is off. They are only seen by you, your practitioner and the head coach.</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Button
              variant="blue"
              size="md"
              disabled={ro || pending}
              onClick={() =>
                start(async () => {
                  const r = await turnOnPhotoConsent();
                  if (r.error) return void toast(r.error);
                  if (r.toast) toast(r.toast);
                  setConsentOff(false);
                  router.refresh();
                })
              }
            >
              TURN ON PHOTO CONSENT
            </Button>
            <Button variant="outline" size="md" href="/assessment/plan">
              BACK TO MY PLAN
            </Button>
          </div>
        </main>
      </>
    );
  }

  const showRetakeNote = retakeMode && retake.includes(step.id) && !!init.retakeMessage;
  const testVal = step.kind === "count" ? local.n ?? vals.bpm ?? 0 : 0;

  return (
    <>
      {strip}
      <main className={s.main} style={{ maxWidth: 980, paddingBottom: 40, display: "flex", flexDirection: "column", gap: 16, minHeight: "60vh" }}>
        {showRetakeNote && (
          <div style={{ boxShadow: "inset 0 0 0 2px var(--blue)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--blue)" }}>More photos needed · from {init.practitioner}</span>
            <b style={{ font: "600 15px/1.4 var(--font-sans)" }}>“{init.retakeMessage}”</b>
            <span style={{ fontSize: 11, color: "var(--grey-700)" }}>{retake.length > 1 ? `Just these ${retake.length} steps.` : "Just this one step."} Your review time pauses until it is in.</span>
          </div>
        )}
        <span className={s.kicker}>Online Capture · {part} · saved after every step</span>
        <h1 className={s.h1} style={{ fontSize: "clamp(28px,5vw,44px)" }}>
          {title}
        </h1>
        {sub && <span style={{ font: "400 16px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>{sub}</span>}

        {step.kind === "need" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", border: "2px solid var(--ink)" }}>
            {NEED.map(([t, d]) => (
              <div key={t} style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4, boxShadow: "inset -1px -1px 0 var(--grey-200)" }}>
                <b style={{ font: "600 15px var(--font-sans)" }}>{t}</b>
                <span style={{ fontSize: 12, color: "var(--grey-700)" }}>{d}</span>
              </div>
            ))}
          </div>
        )}

        {step.kind === "perm" && (
          <>
            {blocked && (
              <div role="alert" style={{ boxShadow: "inset 0 0 0 2px var(--blue)", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <b style={{ font: "600 16px var(--font-sans)" }}>Your camera is blocked for this site.</b>
                <span style={{ font: "400 14px/1.5 var(--font-sans)" }}>On iPhone: Settings, then Safari, then Camera, then Allow. On Android: tap the lock next to the address, then Permissions, then Camera.</span>
              </div>
            )}
            <div style={{ border: "2px solid var(--ink)", padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              <b style={{ font: "600 16px var(--font-sans)" }}>Why we ask</b>
              <span style={{ font: "400 15px/1.5 var(--font-sans)", color: "var(--grey-700)" }}>We use your camera only while this screen is open, to take the photos and videos you choose to send. Nothing is recorded in the background.</span>
            </div>
          </>
        )}

        {step.kind === "photo" && (
          <div className={s.cap}>
            <div style={{ position: "relative", width: "100%", maxWidth: 400, justifySelf: "center", aspectRatio: "3/4", background: "var(--grey-50)", border: "2px solid var(--ink)", overflow: "hidden" }}>
              {shot ? (
                <ImageSlot src={shot.url} caption={`PHOTO: ${step.label.toUpperCase()}`} />
              ) : streamOn && camMode === "camera" ? (
                <video ref={live} muted playsInline autoPlay className={`${s.camVideo} ${s.mirror}`} aria-label="Live camera" />
              ) : (
                <ImageSlot caption="LIVE CAMERA" />
              )}
              {!shot && (
                <>
                  <div style={{ position: "absolute", left: "50%", top: "7%", width: "15%", aspectRatio: "1", transform: "translateX(-50%)", border: "2px dashed var(--blue)", borderRadius: "50%", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", left: "50%", top: "18%", width: "38%", height: "44%", transform: "translateX(-50%)", border: "2px dashed var(--blue)", borderRadius: "40px 40px 10px 10px", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", left: "50%", top: "61%", width: "24%", height: "33%", transform: "translateX(-50%)", border: "2px dashed var(--blue)", borderTop: 0, pointerEvents: "none" }} />
                  <span style={{ position: "absolute", left: 0, right: 0, bottom: "3%", height: 2, background: "var(--blue)", opacity: 0.6 }} />
                </>
              )}
              {count !== null && (
                <span aria-live="assertive" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 140, color: "var(--blue)", background: "rgba(255,255,255,.4)" }}>
                  {count}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "72px minmax(0,1fr)", gap: 12, alignItems: "center" }}>
                <div style={{ aspectRatio: "3/4", position: "relative" }}>
                  <ImageSlot caption="EXAMPLE" />
                </div>
                <span style={{ font: "400 14px/1.45 var(--font-sans)" }}>{step.how}</span>
              </div>
              <div style={{ border: "2px solid var(--ink)", display: "flex", flexDirection: "column" }}>
                {FRAME.map((f) => (
                  <span key={f} style={{ padding: "10px 14px", borderBottom: "1px solid var(--grey-200)", font: "400 14px var(--font-sans)", display: "grid", gridTemplateColumns: "22px 1fr" }}>
                    <span style={{ color: "var(--blue)" }}>·</span>
                    {f}
                  </span>
                ))}
              </div>
              {shot?.qc && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Quality check</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {shot.qc.map((q) => (
                      <span key={q.t} style={{ font: "500 13px var(--font-sans)", padding: "6px 10px", background: q.ok ? "#fff" : "var(--ice)", color: "var(--ink)", boxShadow: `inset 0 0 0 1.5px ${q.ok ? "var(--grey-300)" : "var(--blue)"}` }}>
                        {q.ok ? `✓ ${q.t}` : q.t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {shot?.failed && <span style={{ fontSize: 11, color: "var(--blue)" }}>Upload paused · it will try again when you submit.</span>}
            </div>
          </div>
        )}

        {step.kind === "video" && (
          <div className={s.cap}>
            <div style={{ position: "relative", width: "100%", aspectRatio: "9/12", maxWidth: 400, justifySelf: "center", border: "2px solid var(--ink)", overflow: "hidden" }}>
              {shot && recT === null ? (
                <video src={shot.url} controls playsInline className={s.camVideo} aria-label={`Video: ${step.label}`} />
              ) : streamOn && camMode === "camera" ? (
                <video ref={live} muted playsInline autoPlay className={`${s.camVideo} ${s.mirror}`} aria-label="Live camera" />
              ) : (
                <ImageSlot caption={recT !== null ? "RECORDING" : "LIVE CAMERA"} />
              )}
              {recT !== null && (
                <span style={{ position: "absolute", top: 10, left: 10, background: "var(--ink)", color: "#fff", fontSize: 11, padding: "4px 8px", display: "flex", alignItems: "center", gap: 6 }}>
                  <i style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--sky)", display: "block" }} />
                  REC {pad2(recT)} of {VIDEO_MAX_S} s
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
              <div style={{ aspectRatio: "16/9", position: "relative" }}>
                <ImageSlot caption="EXAMPLE CLIP" />
              </div>
              <span style={{ font: "400 15px/1.5 var(--font-sans)" }}>{step.how}</span>
              <span style={{ fontSize: 11, color: "var(--grey-700)" }}>Instructions are placeholders, to be written by ADITUS coaches.</span>
              {shot?.failed && <span style={{ fontSize: 11, color: "var(--blue)" }}>Upload paused · it will try again when you submit.</span>}
            </div>
          </div>
        )}

        {isTest && (
          <>
            <div style={{ boxShadow: "inset 0 0 0 2px var(--blue)", padding: "12px 14px", font: "600 14px var(--font-sans)" }}>Stop if you feel dizzy or any pain. Skip anything that does not feel right.</div>
            <span style={{ font: "400 15px/1.5 var(--font-sans)" }}>{step.how}</span>
          </>
        )}
        {step.kind === "timer" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "20px 0" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(80px,18vw,140px)", lineHeight: 0.85 }} role="timer">
              {shownClock.toFixed(1)}
              <span style={{ font: "400 18px var(--font-mono)" }}> s</span>
            </span>
            {step.sided && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "2px solid var(--ink)" }} role="radiogroup" aria-label="Side">
                {(["L", "R"] as const).map((x) => (
                  <button key={x} type="button" role="radio" aria-checked={side === x} disabled={run !== null} onClick={() => setSide(x)} style={{ height: 48, padding: "0 18px", border: 0, boxShadow: "inset -1px 0 0 var(--ink)", cursor: "pointer", fontSize: 11, textTransform: "uppercase", fontFamily: "var(--font-mono)", ...sel(side === x) }}>
                    {x === "L" ? "Left" : "Right"}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {step.kind === "count" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "16px 0" }}>
            <span style={{ fontSize: 11, textTransform: "uppercase" }} role="timer">
              60 second window · {winLeft.toFixed(1)} s
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "80px auto 80px", alignItems: "center", border: "2px solid var(--ink)" }}>
              <button type="button" aria-label="Minus one" onClick={() => setLocal((l) => ({ ...l, n: Math.max(0, (l.n ?? vals.bpm ?? 0) - 1) }))} style={{ height: 96, border: 0, background: "var(--grey-50)", cursor: "pointer", fontSize: 28 }}>
                −
              </button>
              <span style={{ padding: "0 24px", fontFamily: "var(--font-display)", fontSize: 72 }} aria-live="polite">
                {testVal}
              </span>
              <button
                type="button"
                aria-label="Plus one"
                disabled={winOver}
                onClick={() => {
                  if (winEnd === null) {
                    setClock(Date.now());
                    setWinEnd(Date.now() + 60_000);
                    setLocal((l) => ({ ...l, n: 1 }));
                  } else setLocal((l) => ({ ...l, n: (l.n ?? 0) + 1 }));
                }}
                style={{ height: 96, border: 0, background: "var(--grey-50)", cursor: winOver ? "not-allowed" : "pointer", fontSize: 28 }}
              >
                +
              </button>
            </div>
            <span style={{ fontSize: 11, color: "var(--grey-600)" }}>{winOver ? "Time is up. Continue when ready." : "Tap + each time you breathe in"}</span>
          </div>
        )}
        {step.kind === "choice" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }} role="radiogroup" aria-label={step.label}>
            {NASAL_CHOICES.map((o) => {
              const on = (local.choice ?? vals.nasal) === o;
              return (
                <button key={o} type="button" role="radio" aria-checked={on} onClick={() => setLocal((l) => ({ ...l, choice: o }))} style={{ minHeight: 64, border: "2px solid var(--ink)", cursor: "pointer", font: "600 16px var(--font-sans)", ...sel(on) }}>
                  {o}
                </button>
              );
            })}
          </div>
        )}

        {step.kind === "review" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,180px),1fr))", gap: 10 }}>
            {CAPTURE_ITEMS.map((it) => {
              const dn = done.includes(it.id);
              const sh = shots[it.id];
              const v = dn ? (it.kind === "photo" ? "Photo" : it.kind === "video" ? "Video" : "Entered") : it.required ? "Still to do" : "Optional";
              return (
                <div key={it.id} style={{ border: "2px solid var(--ink)", display: "flex", flexDirection: "column" }}>
                  <div style={{ aspectRatio: "4/3", position: "relative", background: "var(--grey-50)" }}>
                    {dn && sh && it.kind === "photo" ? <ImageSlot src={sh.url} caption={it.label.toUpperCase()} /> : dn && sh && it.kind === "video" ? <video src={sh.url} muted playsInline preload="metadata" className={s.camVideo} /> : <ImageSlot caption={dn ? it.label.toUpperCase() : "NOT DONE"} />}
                  </div>
                  <div style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <b style={{ fontSize: 11, textTransform: "uppercase" }}>{it.label}</b>
                      <span style={{ fontSize: 10, color: "var(--grey-600)" }}>{v}</span>
                    </span>
                    <button type="button" className={s.textBtn} onClick={() => go(idxOf(it.id))} style={{ fontSize: 10, fontWeight: 700, height: 32 }} aria-label={`Edit ${it.label}`}>
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {step.kind === "submit" && (
          <>
            <div style={{ border: "2px solid var(--ink)", display: "flex", flexDirection: "column" }}>
              {[...groups.map((g, i) => ({ t: `${g.t} · ${g.items.length} ${g.media ? "files" : "entries"}${g.media && g.items.every((it) => shots[it.id]?.size) && g.items.length ? ` · ${mb(g.items.reduce((a, it) => a + (shots[it.id]?.size ?? 0), 0))}` : ""}`, row: rows[i] })), ...(init.intakeDone ? [{ t: "Intake answers", row: { pct: 100 } as { pct: number; failed?: boolean } }] : [])].map(({ t, row }, i) => {
                const pct = row?.pct ?? 0;
                const st = row?.failed ? `Paused at ${pct}% · connection dropped` : pct >= 100 ? "✓ Done" : pct > 0 ? `${pct}%` : "Waiting";
                return (
                  <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid var(--grey-200)", display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12 }}>
                      <span>{t}</span>
                      <b style={{ color: row?.failed ? "var(--blue)" : "var(--ink)" }}>{st}</b>
                    </span>
                    <div style={{ height: 6, background: "var(--grey-200)" }}>
                      <div style={{ height: 6, background: row?.failed ? "var(--grey-400)" : "var(--blue)", width: `${pct}%`, transition: "width .3s" }} />
                    </div>
                    {row?.failed && (
                      <button type="button" className={s.textBtn} onClick={() => void runSubmit()} style={{ alignSelf: "flex-start", height: 32, fontWeight: 700 }}>
                        Try again →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <span style={{ fontSize: 12, color: "var(--grey-700)" }}>Uploads pick up where they stopped if you lose signal. You can close this screen.</span>
            {allUp && (
              <div style={{ background: "var(--ink)", color: "#fff", padding: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 26, textTransform: "uppercase" }}>Submitted.</span>
                <span style={{ font: "400 16px/1.45 var(--font-sans)" }}>Your practitioner reviews within XX hours. If a photo needs redoing, we will tell you exactly which one.</span>
              </div>
            )}
          </>
        )}
        <input
          ref={fileIn}
          type="file"
          hidden
          accept={step.kind === "video" ? "video/*" : "image/*"}
          capture="user"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void pickFile(f);
          }}
        />
      </main>
      <div className={s.bottomBar}>
        <div className={`${s.capBar} ${alt ? s.capBarAlt : ""}`}>
          <Button variant="outline" size="lg" onClick={back} aria-label="Back" disabled={pending || recT !== null}>
            ←
          </Button>
          {alt && (
            <Button variant="outline" size="lg" full onClick={alt.on} disabled={ro || pending || recT !== null}>
              {alt.label}
            </Button>
          )}
          <Button variant={primary.v} size="lg" full onClick={primary.on} disabled={ro || pending || primary.disabled}>
            {pending && ["KEEP AND NEXT →", "SAVE AND NEXT →", "CONTINUE →"].includes(primary.label) ? "SAVING…" : primary.label}
          </Button>
        </div>
      </div>
    </>
  );
}
