"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Button, ImageSlot } from "@/components/ds";
import { finishReview, requestRetake, saveAnnotations, saveReviewMeasure } from "@/server/consoles/actions";
import type { Annotation, loadPhotoReview } from "@/server/consoles/data";
import { dateShort } from "@/lib/format";
import { RETAKE_REASONS, SCORE_CRITERIA, SQUAT_OBS, foldMeasures, fmtSelf, retakeMessage } from "./lib";
import { opId } from "./outbox";
import { useFlash, useRun } from "./ui";
import s from "./consoles.module.css";

type D = NonNullable<Awaited<ReturnType<typeof loadPhotoReview>>>;
type Tool = "plumb" | "level" | "angle" | "pin" | null;
const TOOLS: [Exclude<Tool, null>, string][] = [["plumb", "Plumb line"], ["level", "Level lines"], ["angle", "Angle"], ["pin", "Pin a note"]];
const FPS = 25;
const FRAMES = 240;
const SPEEDS = [["0.25×", 0.25], ["0.5×", 0.5], ["1×", 1]] as const;
const sel = (on: boolean) => ({ background: on ? "var(--ink)" : "#fff", color: on ? "#fff" : "var(--ink)" });

export function PhotoReview({ d }: { d: D }) {
  const flash = useFlash();
  const { run, pending } = useRun();
  const [tool, setTool] = useState<Tool>(null);
  const [anns, setAnns] = useState<Record<string, Annotation[]>>(() => Object.fromEntries(d.photos.map((p) => [p.id, p.annotations])));
  const [selP, setSelP] = useState(() => Math.max(0, d.photos.findIndex((p) => /right/i.test(p.label))));
  const [retake, setRetake] = useState(false);
  const [reason, setReason] = useState(RETAKE_REASONS[0][0]);
  const [msg, setMsg] = useState<string | null>(null);
  const deb = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const photo = d.photos[selP];
  const more = d.module?.status === "MORE_NEEDED";

  // Squat score, observations and flag (Observed measures).
  const sq = foldMeasures(d.squat).squat;
  const [score, setScore] = useState<number | null>(sq?.v ?? null);
  const [obs, setObs] = useState<string[]>(sq?.obs ?? []);
  const [flag, setFlag] = useState(!!sq?.flag);
  const save = (op: Parameters<typeof saveReviewMeasure>[1]) => saveReviewMeasure(d.client.id, op).then((r) => r?.error && flash(r.error), () => flash("Not saved. Check the connection."));

  const persist = (mediaId: string, list: Annotation[]) => {
    setAnns((a) => ({ ...a, [mediaId]: list }));
    clearTimeout(deb.current[mediaId]);
    deb.current[mediaId] = setTimeout(() => void saveAnnotations(mediaId, list).then((r) => r?.error && flash(r.error)), 500);
  };
  const pins = useMemo(
    () =>
      d.photos
        .flatMap((p, i) => (anns[p.id] ?? []).filter((a) => a.type === "PIN").map((a) => ({ ...a, photo: i, mediaId: p.id })))
        .sort((x, y) => (x.n ?? 0) - (y.n ?? 0)),
    [anns, d.photos],
  );
  const levelOf = (id: string) => (anns[id] ?? []).find((a) => a.type === "LEVEL")?.ys ?? [22, 50];
  const angleOf = (id: string) => (anns[id] ?? []).find((a) => a.type === "ANGLE")?.deg ?? 0;
  const upsertTool = (id: string, a: Annotation) => persist(id, [...(anns[id] ?? []).filter((x) => x.type !== a.type), a]);

  const click = (i: number) => (e: MouseEvent<HTMLDivElement>) => {
    setSelP(i);
    const p = d.photos[i];
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10;
    const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10;
    if (tool === "pin") {
      const n = (pins.at(-1)?.n ?? 0) + 1;
      persist(p.id, [...(anns[p.id] ?? []), { type: "PIN", n, x, y, note: "" }]);
    } else if (tool === "level") {
      // Tap sets the hip line; the shoulder line stays at 22%.
      upsertTool(p.id, { type: "LEVEL", ys: [levelOf(p.id)[0], y] });
    } else if (tool === "angle") {
      const w = r.width,
        h = r.height;
      const deg = Math.round((Math.atan2(((y - 46) / 100) * h, ((x - 30) / 100) * w) * 180) / Math.PI);
      upsertTool(p.id, { type: "ANGLE", deg: Math.max(-45, Math.min(45, deg)) });
    }
  };
  const pinNote = (mediaId: string, n: number, note: string) => persist(mediaId, (anns[mediaId] ?? []).map((a) => (a.type === "PIN" && a.n === n ? { ...a, note } : a)));

  const message = msg ?? (photo ? retakeMessage(photo.label, reason) : "");
  const retaken = (id: string) => d.retakes.some((r) => r.mediaId === id) || d.photos.find((p) => p.id === id)?.status === "RETAKE_REQUESTED";

  return (
    <>
      <div className={s.toolbar}>
        <span style={{ display: "flex", flexDirection: "column", gap: 1, marginRight: 8 }}>
          <b style={{ font: "600 15px var(--font-sans)" }}>{d.title}</b>
          <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>{d.finished ? `Review finished ${d.finished}` : d.dueLine}</span>
        </span>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }} role="group" aria-label="Tools">
          {TOOLS.map(([k, l]) => (
            <button key={k} type="button" className={s.tool} aria-pressed={tool === k} style={sel(tool === k)} onClick={() => setTool(tool === k ? null : k)}>
              {l}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <Button variant="outline" size="sm" disabled={!photo} onClick={() => setRetake((x) => !x)}>
            REQUEST RETAKE
          </Button>
          <Button variant="ink" size="sm" disabled={pending} onClick={() => run(() => finishReview(d.client.id, d.module?.key ?? "capture"))}>
            WRAP UP →
          </Button>
        </div>
      </div>
      <main className={s.rMain}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          {retake && photo && (
            <div className={s.box} style={{ padding: "14px 16px", gap: 10, background: "var(--grey-50)" }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Request retake · {photo.label}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {RETAKE_REASONS.map(([o]) => (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={reason === o}
                    onClick={() => {
                      setReason(o);
                      setMsg(null);
                    }}
                    style={{ minHeight: 40, padding: "0 12px", border: "1.5px solid var(--ink)", cursor: "pointer", font: "500 13px var(--font-sans)", ...sel(reason === o) }}
                  >
                    {o}
                  </button>
                ))}
              </div>
              <input className={s.input} value={message} onChange={(e) => setMsg(e.target.value)} aria-label="Message to the client" />
              <span style={{ fontSize: 11, color: "var(--grey-700)" }}>Sends {d.client.first} a WhatsApp with a link to just this step. Status becomes More photos needed and the due time pauses.</span>
              <div>
                <Button
                  variant="blue"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(() => requestRetake(d.client.id, { mediaId: photo.id, reason, message, moduleKey: d.module?.key ?? "capture" }), {
                      onOk: () => {
                        setRetake(false);
                        setMsg(null);
                      },
                    })
                  }
                >
                  SEND TO {d.client.first.toUpperCase()}
                </Button>
              </div>
            </div>
          )}

          {d.photos.length === 0 && <div className={s.flag}><span className={s.kBlue}>No photos</span><span>{d.client.first} has not sent photos for this step yet.</span></div>}
          <div className={s.photos4}>
            {d.photos.map((p, i) => {
              const [shY, hipY] = levelOf(p.id);
              const ang = angleOf(p.id);
              return (
                <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                  <div
                    onClick={click(i)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${p.label} photo${tool === "pin" ? ", tap to pin a note" : ""}`}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelP(i)}
                    style={{ position: "relative", aspectRatio: "3/5", border: `2px solid ${selP === i ? "var(--blue)" : "var(--ink)"}`, cursor: tool === "pin" || tool === "level" || tool === "angle" ? "crosshair" : "pointer", overflow: "hidden" }}
                  >
                    <ImageSlot caption={`PHOTO: ${p.label.toUpperCase()}`} src={p.src ?? undefined} style={{ position: "absolute", inset: 0 }} />
                    {tool === "plumb" && <span className={s.plumb} />}
                    {tool === "level" && (
                      <>
                        <span style={{ position: "absolute", left: 0, right: 0, top: `${shY}%`, height: 2, background: "var(--sky)", pointerEvents: "none" }} />
                        <span style={{ position: "absolute", left: 0, right: 0, top: `${hipY}%`, height: 2, background: "var(--sky)", pointerEvents: "none" }} />
                      </>
                    )}
                    {tool === "angle" && (
                      <>
                        <span style={{ position: "absolute", left: "30%", top: "46%", width: "40%", height: 2, background: "var(--navy)", transform: `rotate(${ang}deg)`, transformOrigin: "left", pointerEvents: "none" }} />
                        <span style={{ position: "absolute", left: "30%", top: "46%", width: "40%", height: 2, background: "var(--navy)", pointerEvents: "none" }} />
                        <span style={{ position: "absolute", left: "72%", top: "41%", fontSize: 10, fontWeight: 700, background: "#fff", padding: "1px 4px", pointerEvents: "none" }}>{Math.abs(ang)}°</span>
                      </>
                    )}
                    {pins
                      .filter((x) => x.photo === i)
                      .map((x) => (
                        <span key={x.n} className={s.pin} style={{ left: `${x.x}%`, top: `${x.y}%` }}>
                          {x.n}
                        </span>
                      ))}
                  </div>
                  <span style={{ display: "flex", justifyContent: "space-between", gap: 4, fontSize: 10, textTransform: "uppercase" }}>
                    <b>{p.label}</b>
                    <span style={{ color: "var(--grey-600)" }}>{retaken(p.id) ? "Retake asked" : dateShort(new Date(p.capturedAt))}</span>
                  </span>
                </div>
              );
            })}
          </div>
          {pins.length > 0 && (
            <div className={s.box}>
              {pins.map((x) => (
                <div key={x.n} style={{ padding: "8px 14px", borderBottom: "1px solid var(--grey-200)", display: "grid", gridTemplateColumns: "28px minmax(0,1fr) auto", gap: 8, alignItems: "center" }}>
                  <span className={s.pinDot}>{x.n}</span>
                  <input value={x.note ?? ""} onChange={(e) => pinNote(x.mediaId, x.n!, e.target.value)} placeholder={`Note for pin ${x.n} on ${d.photos[x.photo].label.toLowerCase()}`} aria-label={`Note for pin ${x.n}`} style={{ height: 36, border: 0, font: "400 14px var(--font-sans)", minWidth: 0 }} />
                  <button type="button" aria-label={`Remove pin ${x.n}`} onClick={() => persist(x.mediaId, (anns[x.mediaId] ?? []).filter((a) => !(a.type === "PIN" && a.n === x.n)))} style={{ border: 0, background: "none", cursor: "pointer", fontSize: 14 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <VideoBox videos={d.videos} />
        </div>

        <aside className={s.rAside}>
          {d.flags.map((f, i) => (
            <div key={i} className={s.flag} style={{ padding: "12px 14px", gap: 3 }}>
              <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--blue)" }}>Discuss before testing</span>
              <span style={{ font: "600 13px/1.4 var(--font-sans)" }}>{f}</span>
            </div>
          ))}
          <div className={s.box}>
            <div style={{ padding: "10px 14px", borderBottom: "2px solid var(--ink)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Self tests · Self reported</div>
            {d.selfTests.length === 0 && <div style={{ padding: "8px 14px", fontSize: 12, color: "var(--grey-600)" }}>No self tests sent</div>}
            {(() => {
              const st = foldMeasures(d.selfTests);
              return d.bank
                .filter((t) => st[t.key])
                .map((t) => (
                  <div key={t.key} style={{ padding: "8px 14px", borderBottom: "1px solid var(--grey-200)", display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                    <span>{t.name}</span>
                    <b>{fmtSelf(t, st[t.key])}</b>
                  </div>
                ));
            })()}
          </div>
          <div className={s.box}>
            <div style={{ padding: "10px 14px", borderBottom: "2px solid var(--ink)", display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Deep squat quality · Observed</span>
              <b style={{ fontSize: 11 }}>{score == null ? "Not scored" : `${score} of 3`}</b>
            </div>
            {SCORE_CRITERIA.map(([n, c]) => (
              <button
                key={n}
                type="button"
                aria-pressed={score === n}
                onClick={() => {
                  setScore(n);
                  void save({ id: opId(), kind: "value", testKey: "squat", side: "NONE", value: n });
                }}
                style={{ textAlign: "left", border: 0, borderBottom: "1px solid var(--grey-200)", cursor: "pointer", minHeight: 48, padding: "8px 14px", display: "grid", gridTemplateColumns: "28px 1fr", gap: 8, alignItems: "center", ...sel(score === n) }}
              >
                <b style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 18 }}>{n}</b>
                <span style={{ font: "400 12px/1.35 var(--font-sans)" }}>{c}</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Observations</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SQUAT_OBS.map((o) => {
                const on = obs.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      const next = on ? obs.filter((x) => x !== o) : [...obs, o];
                      setObs(next);
                      void save({ id: opId(), kind: "meta", testKey: "squat", observation: next });
                    }}
                    style={{ minHeight: 36, padding: "0 10px", border: "1.5px solid var(--ink)", cursor: "pointer", font: "500 12px var(--font-sans)", ...sel(on) }}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            aria-pressed={flag}
            onClick={() => {
              setFlag(!flag);
              void save({ id: opId(), kind: "meta", testKey: "squat", priority: !flag });
            }}
            style={{ minHeight: 48, padding: "0 14px", border: 0, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 11, textTransform: "uppercase", background: flag ? "var(--ice)" : "#fff", boxShadow: "inset 0 0 0 2px var(--blue)", color: "var(--ink)" }}
          >
            Flag squat as priority <b>{flag ? "ON" : "OFF"}</b>
          </button>
          {more && <span style={{ fontSize: 11, color: "var(--grey-700)" }}>Waiting on {d.client.first}’s retake. You can still review the rest.</span>}
        </aside>
      </main>
    </>
  );
}

type Vid = D["videos"][number];

/** Frame stepper: 240 frames at 25 fps, three speeds, balance left and right side by side. */
function VideoBox({ videos }: { videos: Vid[] }) {
  const [vid, setVid] = useState(0);
  const [frame, setFrame] = useState(96);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(0.25);
  const [lr, setLr] = useState(false);
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const cur = videos[vid];
  const isBal = !!cur && /balance/i.test(cur.label);
  const balL = videos.findIndex((v) => /balance/i.test(v.label) && /left/i.test(v.label));
  const balR = videos.findIndex((v) => /balance/i.test(v.label) && /right/i.test(v.label));
  const showLR = lr && isBal && balL >= 0 && balR >= 0;
  const panes = showLR ? [videos[balL], videos[balR]] : cur ? [cur] : [];
  const total = FRAMES;

  // Playback: real videos play at the chosen rate; placeholders tick at 25 fps × speed.
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setFrame((f) => (f >= total ? 1 : f + 1)), Math.round(1000 / (FPS * speed)));
    return () => clearInterval(iv);
  }, [playing, speed, total]);
  useEffect(() => {
    refs.current.forEach((el) => {
      if (!el) return;
      el.playbackRate = speed;
      const t = (frame - 1) / FPS;
      if (Math.abs(el.currentTime - t) > 0.5 / FPS) el.currentTime = Math.min(t, el.duration || t);
    });
  }, [frame, speed, panes.length]);

  if (!videos.length)
    return (
      <div className={s.box}>
        <div style={{ position: "relative", aspectRatio: "16/10", background: "var(--ink)" }}>
          <ImageSlot tone="dark" caption="NO VIDEOS IN THIS STEP" style={{ position: "absolute", inset: 0 }} />
        </div>
      </div>
    );

  return (
    <div className={s.box}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--grey-200)", display: "flex", gap: 6, overflowX: "auto" }} role="group" aria-label="Videos">
        {videos.map((v, i) => (
          <button key={v.id} type="button" aria-pressed={vid === i} onClick={() => setVid(i)} style={{ flex: "none", height: 34, padding: "0 10px", border: "1.5px solid var(--ink)", cursor: "pointer", fontSize: 10, textTransform: "uppercase", ...sel(vid === i) }}>
            {v.label}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: showLR ? "1fr 1fr" : "1fr", gap: 2, background: "var(--ink)" }}>
        {panes.map((v, i) => (
          <div key={v.id} style={{ position: "relative", aspectRatio: "16/10" }}>
            {v.src ? (
              <video ref={(el) => void (refs.current[i] = el)} src={v.src} muted playsInline preload="metadata" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <ImageSlot tone="dark" caption={showLR ? `${v.label.toUpperCase()} · FRAME ${frame}` : `VIDEO: ${v.label.toUpperCase()} · FRAME ${frame}`} style={{ position: "absolute", inset: 0 }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <button type="button" aria-label="Back one frame" onClick={() => setFrame((f) => Math.max(1, f - 1))} style={{ height: 40, width: 48, border: "1.5px solid var(--ink)", background: "#fff", cursor: "pointer", fontSize: 14 }}>
          ⟨
        </button>
        <button type="button" onClick={() => setPlaying((x) => !x)} style={{ height: 40, padding: "0 14px", border: 0, background: "var(--ink)", color: "#fff", cursor: "pointer", fontSize: 11, textTransform: "uppercase" }}>
          {playing ? "Pause" : "Play"}
        </button>
        <button type="button" aria-label="Forward one frame" onClick={() => setFrame((f) => Math.min(total, f + 1))} style={{ height: 40, width: 48, border: "1.5px solid var(--ink)", background: "#fff", cursor: "pointer", fontSize: 14 }}>
          ⟩
        </button>
        <span style={{ fontSize: 11, minWidth: 90 }}>
          Frame {frame} of {total}
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,auto)", border: "1.5px solid var(--ink)" }} role="group" aria-label="Speed">
          {SPEEDS.map(([l, v]) => (
            <button key={l} type="button" aria-pressed={speed === v} onClick={() => setSpeed(v)} style={{ height: 37, padding: "0 10px", border: 0, cursor: "pointer", fontSize: 10, ...sel(speed === v) }}>
              {l}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={showLR}
          onClick={() => {
            setLr(!lr);
            if (!isBal && balL >= 0) setVid(balL);
          }}
          style={{ marginLeft: "auto", height: 40, padding: "0 12px", border: "1.5px solid var(--ink)", cursor: "pointer", fontSize: 10, textTransform: "uppercase", ...sel(showLR) }}
        >
          Left and right side by side
        </button>
      </div>
    </div>
  );
}
