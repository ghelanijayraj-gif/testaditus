"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, ImageSlot } from "@/components/ds";
import { BodyMap } from "@/components/shared/BodyMap";
import { joinLive, rejoinLive, reportConnectionLost, saveSetupCheck, testJoinLink, uploadDayPhoto } from "@/server/client/day/actions";
import type { LiveState } from "@/server/client/day/load";
import { DayChrome } from "./DayChrome";
import { useDayToast } from "./DayToast";
import { TellPanel } from "./DayActions";
import { LivePhaseList } from "./PhaseList";
import { heOr } from "./phases";
import s from "./day.module.css";

export type LiveStep = "setup" | "photos" | "call";
type View = "front" | "side" | "back";
const VIEWS: { key: View; label: string; body: "front" | "right" | "back"; tip: string }[] = [
  { key: "front", label: "Front", body: "front", tip: "Stand in the outline, arms relaxed, feet hip width." },
  { key: "side", label: "Side", body: "right", tip: "Turn to your right. Look straight ahead." },
  { key: "back", label: "Back", body: "back", tip: "Turn your back to the camera." },
];

type Props = {
  sessionId: string;
  step: LiveStep;
  /** In person session using the guided photo step only (no setup or call). */
  photosOnly?: boolean;
  backHref?: string;
  coach: string;
  kicker: string;
  startsLabel: string;
  joinUrl: string | null;
  photoConsent: boolean;
  photos: Partial<Record<View, string>>;
  linkTested: boolean;
  connection: string | null;
  clientLate: boolean;
  practitionerLate: boolean;
  initial: LiveState;
};

/** Camera + microphone for the setup check, guided photos and self view. */
function useCamera(on: boolean, sessionId: string) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cam, setCam] = useState<"checking" | "ok" | "off">("checking");
  const [mic, setMic] = useState<"checking" | "ok" | "off">("checking");
  const [tries, setTries] = useState(0);
  const saved = useRef(false);
  useEffect(() => {
    if (!on) return;
    let live: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCam("off");
        setMic("off");
        return;
      }
      let ms: MediaStream | null = null;
      try {
        ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } }, audio: true });
      } catch {
        try {
          ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        } catch {
          ms = null;
        }
      }
      if (cancelled) return ms?.getTracks().forEach((t) => t.stop());
      live = ms;
      const camOk = !!ms?.getVideoTracks().some((t) => t.readyState === "live");
      const micOk = !!ms?.getAudioTracks().some((t) => t.readyState === "live");
      setStream(ms);
      setCam(camOk ? "ok" : "off");
      setMic(micOk ? "ok" : "off");
      if (!saved.current) {
        saved.current = true;
        void saveSetupCheck(sessionId, camOk, micOk);
      }
    })();
    return () => {
      cancelled = true;
      live?.getTracks().forEach((t) => t.stop());
    };
  }, [on, tries, sessionId]);
  return { stream, cam, mic, retry: () => setTries((n) => n + 1) };
}

function Video({ stream, className }: { stream: MediaStream | null; className?: string }) {
  const ref = useCallback(
    (el: HTMLVideoElement | null) => {
      if (el && stream && el.srcObject !== stream) {
        el.srcObject = stream;
        void el.play().catch(() => {});
      }
    },
    [stream],
  );
  if (!stream) return null;
  return <video ref={ref} className={className ?? s.video} autoPlay muted playsInline aria-label="Your camera" />;
}

export function LiveFlow(p: Props) {
  const router = useRouter();
  const toast = useDayToast();
  const [step, setStepState] = useState<LiveStep>(p.photosOnly ? "photos" : p.step);
  const camOn = p.photosOnly ? p.photoConsent : step !== "photos" || p.photoConsent;
  const { stream, cam, mic, retry } = useCamera(camOn, p.sessionId);
  const [offline, setOffline] = useState(false);

  const setStep = (x: LiveStep) => {
    setStepState(x);
    try {
      window.history.replaceState(null, "", `?step=${x}`);
    } catch {}
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const off = () => setOffline(true);
    const on = () => setOffline(false);
    setOffline(navigator.onLine === false);
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => {
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
    };
  }, []);

  const headAction =
    !p.photosOnly && step !== "call" ? (
      <button type="button" className={`${s.headAct} ${s.headActBlue}`} onClick={() => setStep("call")}>
        Join session
      </button>
    ) : undefined;

  const banner =
    offline && step !== "call" ? (
      <div className={s.offline} role="alert">
        <span>Connection lost. Your answers so far are saved.</span>
        <button type="button" className={s.offlineBtn} onClick={() => window.location.reload()}>
          Reconnect
        </button>
      </div>
    ) : undefined;

  return (
    <DayChrome action={headAction} wide={step === "call"} banner={banner}>
      {p.clientLate && step !== "call" && (
        <div className={s.banner}>
          <span className={s.bannerText}>
            <b className={s.bannerTitle}>Your session started at {p.startsLabel}.</b>
            <span className={s.bannerSub}>{p.coach} is waiting for you. Skip the rest and join now.</span>
          </span>
          <Button variant="blue" size="md" onClick={() => setStep("call")}>
            JOIN NOW →
          </Button>
        </div>
      )}
      {step === "setup" && <Setup {...p} stream={stream} cam={cam} mic={mic} retry={retry} next={() => setStep("photos")} toast={toast} />}
      {step === "photos" && <Photos {...p} stream={stream} cam={cam} retry={retry} next={() => (p.photosOnly ? router.push(p.backHref ?? "/") : setStep("call"))} toast={toast} />}
      {step === "call" && <Call {...p} stream={stream} offline={offline} toast={toast} />}
    </DayChrome>
  );
}

/* ───────────────────────── setup ───────────────────────── */

function Setup(p: Props & { stream: MediaStream | null; cam: string; mic: string; retry: () => void; next: () => void; toast: (m: string) => void }) {
  const [tested, setTested] = useState(p.linkTested);
  const [conn, setConn] = useState(p.connection);
  const [pending, start] = useTransition();
  const st = (v: string, ok: string) => (v === "ok" ? { t: `✓ ${ok}`, muted: false } : v === "checking" ? { t: "Checking", muted: true } : { t: "Not working", muted: true });
  const checks = [
    { name: "Camera", ...st(p.cam, "Working") },
    { name: "Microphone", ...st(p.mic, "Working") },
    { name: "Connection", ...(tested ? { t: conn === "slow" ? "✓ Working, slow" : "✓ Strong", muted: false } : { t: "Not tested", muted: true }) },
  ];
  const test = () =>
    start(async () => {
      // Round trips to our own server stand in for the provider's network test.
      const times: number[] = [];
      for (let i = 0; i < 3; i++) {
        const t0 = performance.now();
        try {
          const r = await fetch(`/api/day/live/${p.sessionId}`, { cache: "no-store" });
          if (!r.ok) throw new Error();
          times.push(performance.now() - t0);
        } catch {
          return p.toast("The link test did not finish. Check your internet and try again.");
        }
      }
      const r = await testJoinLink(p.sessionId, times.reduce((a, b) => a + b, 0) / times.length);
      if (r.error) return p.toast(r.error);
      setTested(true);
      setConn(times.reduce((a, b) => a + b, 0) / times.length < 800 ? "strong" : "slow");
      if (r.toast) p.toast(r.toast);
    });
  const blocked = p.cam === "off";
  return (
    <>
      <span className={s.kicker}>{p.kicker}</span>
      <h1 className={`${s.h1} ${s.h1s}`}>Get set up.</h1>
      <div className={s.setupGrid}>
        <div className={s.cam}>
          {p.stream ? <Video stream={p.stream} /> : <ImageSlot caption={blocked ? "CAMERA IS OFF" : "CAMERA PREVIEW"} />}
          <div className={s.frameBox} />
          <span className={s.camTag}>Fit your whole body in the box</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <div className={s.checks}>
            {checks.map((c) => (
              <div key={c.name} className={s.check}>
                <span className={s.checkName}>{c.name}</span>
                <span className={`${s.checkSt} ${c.muted ? s.checkMuted : ""}`}>{c.t}</span>
              </div>
            ))}
          </div>
          {(p.cam === "off" || p.mic === "off") && (
            <div className={s.banner}>
              <span className={s.bannerBody}>Your browser has not shared the {p.cam === "off" ? "camera" : "microphone"}. Allow it in the address bar or your browser settings, then try again.</span>
              <Button variant="outline" size="sm" onClick={p.retry}>
                TRY AGAIN
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className={s.guide}>
        <span className={s.label}>Placement</span>
        {[
          "Phone or laptop on a flat surface, 2 to 3 metres away",
          "Your whole body in frame, head to feet",
          "About 2 by 2 metres of clear floor, placeholder",
          "Shorts and a fitted top so your knees and hips are visible",
          "A chair without arms, and a mat",
        ].map((g) => (
          <span key={g} className={s.guideLine}>
            <span className={s.dot}>·</span>
            {g}
          </span>
        ))}
      </div>
      <div className={s.two}>
        <Button variant="outline" size="md" full disabled={pending} onClick={test}>
          {tested ? "✓ LINK TESTED" : pending ? "TESTING" : "TEST JOIN LINK"}
        </Button>
        <Button variant="ink" size="md" full onClick={p.next}>
          NEXT: PHOTOS →
        </Button>
      </div>
    </>
  );
}

/* ───────────────────────── photos ───────────────────────── */

function Photos(p: Props & { stream: MediaStream | null; cam: string; retry: () => void; next: () => void; toast: (m: string) => void }) {
  const [shots, setShots] = useState<Partial<Record<View, string>>>(p.photos);
  const firstOpen = VIEWS.findIndex((v) => !p.photos[v.key]);
  const [idx, setIdx] = useState(firstOpen < 0 ? 3 : firstOpen);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const done = idx >= 3;
  const v = VIEWS[Math.min(idx, 2)];

  const capture = async () => {
    const el = videoRef.current;
    if (!el || !el.videoWidth) {
      p.toast("The camera is not ready yet. Try again.");
      return;
    }
    // Crop the centre of the frame to 3:4, mirror like the preview.
    const vw = el.videoWidth;
    const vh = el.videoHeight;
    const w = Math.min(vw, (vh * 3) / 4);
    const h = (w * 4) / 3;
    const c = document.createElement("canvas");
    c.width = Math.round(w);
    c.height = Math.round(h);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(el, (vw - w) / 2, (vh - h) / 2, w, h, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.88));
    if (!blob) return p.toast("That photo did not come through. Try again.");
    const fd = new FormData();
    fd.set("sessionId", p.sessionId);
    fd.set("view", v.key);
    fd.set("file", new File([blob], `${v.key}.jpg`, { type: "image/jpeg" }));
    setBusy(true);
    const r = await uploadDayPhoto(fd);
    setBusy(false);
    if (r.error || !r.mediaId) return p.toast(r.error ?? "That photo did not come through. Try again.");
    setShots((x) => ({ ...x, [v.key]: r.mediaId }));
    const nextOpen = VIEWS.findIndex((x, i) => i > idx && !shots[x.key]);
    setIdx(nextOpen < 0 ? 3 : nextOpen);
  };

  const shoot = () => {
    if (done || count || busy) return;
    setCount(3);
    timers.current = [
      setTimeout(() => setCount(2), 700),
      setTimeout(() => setCount(1), 1400),
      setTimeout(() => {
        setCount(0);
        void capture();
      }, 2100),
    ];
  };
  const retake = () => {
    if (count) return;
    if (done) setIdx(2);
    else setIdx(Math.max(0, idx - 1));
  };

  const shownId = done ? shots.back : undefined;
  const takenCount = VIEWS.filter((x) => shots[x.key]).length;

  return (
    <>
      <span className={s.kicker}>
        Photo {Math.min(idx + 1, 3)} of 3 · {v.label}
      </span>
      <h1 className={`${s.h1} ${s.h1s}`}>{done ? "All three done." : `${v.label} photo.`}</h1>
      {!p.photoConsent ? (
        <div className={s.banner} style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          <b className={s.bannerTitle}>Photos are off.</b>
          <span className={s.bannerBody}>You said no to photos and videos, so we skip this. {p.coach} writes down what {heOr(p.coach) === "He" ? "he" : "they"} see{heOr(p.coach) === "He" ? "s" : ""} instead. You can change it in Account.</span>
        </div>
      ) : (
        <>
          <div className={s.shotFrame}>
            {shownId ? (
              <ImageSlot src={`/api/day/media/${shownId}`} />
            ) : p.stream ? (
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && p.stream && el.srcObject !== p.stream) {
                    el.srcObject = p.stream;
                    void el.play().catch(() => {});
                  }
                }}
                className={s.video}
                autoPlay
                muted
                playsInline
                aria-label="Your camera"
              />
            ) : (
              <ImageSlot caption={p.cam === "off" ? "CAMERA IS OFF" : "CAMERA"} />
            )}
            {!shownId && (
              <div className={s.ghost}>
                <div className={s.ghostIn}>
                  <BodyMap view={v.body} ariaLabel={`${v.label} outline`} />
                </div>
              </div>
            )}
            {count > 0 && (
              <span className={s.count} aria-live="assertive">
                {count}
              </span>
            )}
          </div>
          <span className={s.tip}>{done ? `${takenCount} of 3 photos saved. Tap a photo below to take it again.` : p.cam === "off" ? "Your browser has not shared the camera. Allow it, then try again." : v.tip}</span>
          <div className={s.thumbs} aria-label="Your photos">
            {VIEWS.map((x, i) => (
              <button key={x.key} type="button" className={`${s.thumb} ${i === idx ? s.thumbOn : ""}`} onClick={() => !count && setIdx(i)} aria-label={`${x.label} photo${shots[x.key] ? ", taken" : ""}`}>
                <ImageSlot ratio="3/4" caption={shots[x.key] ? x.label.toUpperCase() : "NOT YET"} src={shots[x.key] ? `/api/day/media/${shots[x.key]}` : undefined} />
                <span className={s.thumbLabel}>{shots[x.key] ? `✓ ${x.label}` : x.label}</span>
              </button>
            ))}
          </div>
          <div className={s.two}>
            <Button variant="outline" size="md" full onClick={retake}>
              RETAKE
            </Button>
            {p.cam === "off" && !done ? (
              <Button variant="blue" size="md" full onClick={p.retry}>
                TRY AGAIN
              </Button>
            ) : (
              <Button variant="blue" size="md" full disabled={busy || count > 0} onClick={shoot}>
                {done ? "✓ DONE" : busy ? "SAVING" : "START 3 SECOND TIMER"}
              </Button>
            )}
          </div>
        </>
      )}
      <span className={s.seen}>Seen only by you, {p.coach} and the head coach</span>
      <Button variant="ink" size="lg" full onClick={p.next}>
        {p.photosOnly ? "BACK TO TODAY →" : "JOIN SESSION →"}
      </Button>
    </>
  );
}

/* ───────────────────────── live call ───────────────────────── */

function Call(p: Props & { stream: MediaStream | null; offline: boolean; toast: (m: string) => void }) {
  const router = useRouter();
  const [st, setSt] = useState<LiveState>(p.initial);
  const [fails, setFails] = useState(0);
  const [left, setLeft] = useState(false);
  const [tell, setTell] = useState(false);
  const [timerBase, setTimerBase] = useState(() => ({ id: p.initial.timer?.id, elapsed: p.initial.timer?.elapsed ?? 0, at: Date.now() }));
  const [, force] = useState(0);
  const wasLost = useRef(false);
  const lost = left || p.offline || fails >= 2;

  useEffect(() => {
    void joinLive(p.sessionId);
  }, [p.sessionId]);

  // Poll the session every 3 s: phases, counts, pushed cue and timer.
  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const r = await fetch(`/api/day/live/${p.sessionId}`, { cache: "no-store" });
        if (r.status === 401) return window.location.reload();
        if (!r.ok) throw new Error(String(r.status));
        const next = (await r.json()) as LiveState;
        if (stop) return;
        setFails(0);
        setSt(next);
        setTimerBase((b) => (next.timer && next.timer.id !== b.id ? { id: next.timer.id, elapsed: next.timer.elapsed, at: Date.now() } : b));
        if (next.finished) router.replace(`/live/${p.sessionId}`);
      } catch {
        if (!stop) setFails((n) => n + 1);
      }
    };
    const iv = setInterval(poll, 3000);
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, [p.sessionId, router]);

  // Tell the server about a drop once we are back; auto recover from network drops.
  useEffect(() => {
    if (lost && !left) wasLost.current = true;
    if (!lost && wasLost.current) {
      wasLost.current = false;
      void reportConnectionLost(p.sessionId).then(() => rejoinLive(p.sessionId));
      p.toast(`Back on. ${p.coach} can see you.`);
    }
  }, [lost, left, p]);

  // Timer: practitioner driven (LiveCue.timerSeconds), ticks locally between polls.
  useEffect(() => {
    if (!st.timer) return;
    const iv = setInterval(() => force((n) => n + 1), 100);
    return () => clearInterval(iv);
  }, [st.timer]);
  const clock = st.timer && timerBase.id === st.timer.id ? Math.min(st.timer.seconds, timerBase.elapsed + (Date.now() - timerBase.at) / 1000) : 0;

  const rejoin = async () => {
    setLeft(false);
    setFails(0);
    const r = await rejoinLive(p.sessionId);
    p.toast(r.error ?? r.toast ?? "");
  };

  const waiting = p.practitionerLate && !st.cue;

  return (
    <>
      {waiting && <div className={s.banner} style={{ font: "600 15px/1.4 var(--font-sans)", padding: "12px 16px" }}>{p.coach} is running 5 minutes late. Stay on this screen, {heOr(p.coach) === "He" ? "he" : p.coach} will join you here.</div>}
      <div className={s.liveGrid}>
        <div className={s.stageCol}>
          <div className={s.stage}>
            <ImageSlot tone="dark" caption={waiting ? `WAITING FOR ${p.coach.toUpperCase()}` : `VIDEO: ${p.coach.toUpperCase()}`} />
            <div className={s.self}>{p.stream ? <Video stream={p.stream} /> : <ImageSlot caption="YOU" />}</div>
            {st.cue && (
              <div className={s.instr} aria-live="polite">
                <span className={s.instrFrom}>From {p.coach}</span>
                <b className={s.instrText}>{st.cue.text}</b>
              </div>
            )}
            {lost && (
              <div className={s.lost} role="alert">
                <span className={s.lostTitle}>Connection lost.</span>
                <span className={s.lostLine}>Reconnecting. Your results so far are saved. {p.coach} will wait.</span>
                <div className={s.lostBtns}>
                  <Button variant="white" size="md" onClick={rejoin}>
                    REJOIN
                  </Button>
                  <Button variant="outline-light" size="md" href={`/calendar?session=${p.sessionId}`}>
                    RESCHEDULE
                  </Button>
                </div>
              </div>
            )}
          </div>
          {/* Video calling runs on a pluggable provider: the practitioner tile above is a placeholder,
              the call itself opens at Session.joinUrl (meet.aditus.in in dev). */}
          <div className={s.joinBox}>
            <span className={s.micro}>Your call link</span>
            {p.joinUrl ? (
              <a className={s.joinUrl} href={p.joinUrl} target="_blank" rel="noreferrer">
                {p.joinUrl.replace(/^https?:\/\//, "")}
              </a>
            ) : (
              <span className={s.joinUrl}>The team sends your link before the session.</span>
            )}
            <span className={s.bannerBody}>The call opens in a new tab. Keep this screen open beside it for the timer and {p.coach}&apos;s instructions.</span>
            {p.joinUrl && (
              <Button variant="blue" size="md" href={p.joinUrl} style={{ alignSelf: "flex-start" }}>
                OPEN CALL →
              </Button>
            )}
          </div>
        </div>
        <div className={s.side}>
          <div className={s.timer}>
            <span className={s.label} style={{ fontSize: 10 }}>
              {st.timer?.label ?? "Timed tests"}
            </span>
            <span className={s.clock} aria-live="off">
              {clock.toFixed(1)}
              <span className={s.clockUnit}> s</span>
            </span>
            <span className={s.timerNote}>{p.coach} starts and stops the timer.</span>
          </div>
          {st.phases.length > 0 && <LivePhaseList phases={st.phases} captured={st.captured} total={st.total} />}
          <span className={s.micro}>Online: rib tape and joint angles are observed on camera, not measured</span>
          <div className={s.two}>
            <Button variant="outline" size="sm" full onClick={() => setTell(!tell)} aria-expanded={tell} aria-controls="tell-panel">
              TELL {p.coach.toUpperCase()}
            </Button>
            <Button variant="outline" size="sm" full onClick={() => setLeft(true)}>
              LEAVE CALL
            </Button>
          </div>
          {tell && <TellPanel sessionId={p.sessionId} coach={p.coach} onSent={() => setTell(false)} />}
        </div>
      </div>
    </>
  );
}
