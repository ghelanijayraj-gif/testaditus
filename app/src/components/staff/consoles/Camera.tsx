"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ds";
import s from "./consoles.module.css";

type Props = { assessmentId: string; view: string; label: string; kind: "PHOTO" | "VIDEO"; onClose: () => void; onDone: (r: { id: string; src: string }) => void };

/**
 * Capture with the tablet camera (getUserMedia) under a grid and plumb line overlay.
 * Photos are taken from the live view; videos are recorded with MediaRecorder (up to 20 s).
 * Falls back to the device's file picker / native camera when the camera API is not available.
 */
export function Camera({ assessmentId, view, label, kind, onClose, onDone }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [live, setLive] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(0);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("no camera api");
        const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } }, audio: false });
        if (off) return st.getTracks().forEach((t) => t.stop());
        stream.current = st;
        if (video.current) {
          video.current.srcObject = st;
          await video.current.play().catch(() => {});
        }
        setLive(true);
      } catch {
        setErr("Camera not available here. Use the device camera instead.");
      }
    })();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    window.addEventListener("keydown", esc);
    return () => {
      off = true;
      window.removeEventListener("keydown", esc);
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const iv = setInterval(() => setRecording((n) => (n >= 20 ? (stopRec(), n) : n + 1)), 1000);
    return () => clearInterval(iv);
  });

  async function upload(blob: Blob, type: string) {
    setBusy(true);
    const fd = new FormData();
    fd.set("assessmentId", assessmentId);
    fd.set("view", view);
    fd.set("label", label);
    fd.set("kind", kind);
    fd.set("file", new File([blob], `${view}${type.includes("webm") ? ".webm" : type.includes("mp4") ? ".mp4" : type.includes("png") ? ".png" : ".jpg"}`, { type }));
    try {
      const r = await fetch("/staff/media", { method: "POST", body: fd });
      const j = (await r.json()) as { id?: string; src?: string; error?: string };
      if (!r.ok || !j.id) throw new Error(j.error ?? "Upload failed");
      onDone({ id: j.id, src: j.src! });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
      setBusy(false);
    }
  }

  function snap() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    c.toBlob((b) => b && upload(b, "image/jpeg"), "image/jpeg", 0.88);
  }
  function startRec() {
    if (!stream.current || typeof MediaRecorder === "undefined") return setErr("Video recording is not available on this device.");
    chunks.current = [];
    const r = new MediaRecorder(stream.current);
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    r.onstop = () => upload(new Blob(chunks.current, { type: r.mimeType || "video/webm" }), r.mimeType || "video/webm");
    r.start();
    rec.current = r;
    setRecording(1);
  }
  function stopRec() {
    if (rec.current?.state === "recording") rec.current.stop();
    setRecording(0);
  }

  return (
    <div className={s.camWrap} role="dialog" aria-modal="true" aria-label={`Capture ${label}`}>
      <div className={s.camPanel}>
        <div className={s.boxHead}>
          <b>
            {kind === "VIDEO" ? "Video" : "Photo"} · {label}
          </b>
          <button type="button" onClick={onClose} className={s.smallBtn} aria-label="Close">
            Close ×
          </button>
        </div>
        <div style={{ position: "relative", aspectRatio: "3/4", background: "var(--ink)" }}>
          <video ref={video} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: live ? "block" : "none" }} />
          <div className={s.gridOverlay} />
          <div className={s.plumb} />
          {!live && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.7)", fontSize: 11, textAlign: "center", padding: 20 }}>{err ?? "Starting the camera…"}</span>}
        </div>
        <div style={{ padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {live && kind === "PHOTO" && (
            <Button variant="blue" size="md" onClick={snap} disabled={busy}>
              {busy ? "SAVING…" : "CAPTURE"}
            </Button>
          )}
          {live && kind === "VIDEO" && (
            <Button variant={recording ? "ink" : "blue"} size="md" onClick={recording ? stopRec : startRec} disabled={busy}>
              {busy ? "SAVING…" : recording ? `STOP · ${recording} S` : "RECORD"}
            </Button>
          )}
          {!live && (
            <label className={s.smallBtn} style={{ display: "inline-flex", alignItems: "center", height: 44 }}>
              Use the device camera
              <input type="file" accept={kind === "VIDEO" ? "video/*" : "image/*"} capture="environment" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], e.target.files[0].type || "image/jpeg")} />
            </label>
          )}
          <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>{err && live ? err : "Auto labelled and dated · grid and plumb line"}</span>
        </div>
      </div>
    </div>
  );
}
