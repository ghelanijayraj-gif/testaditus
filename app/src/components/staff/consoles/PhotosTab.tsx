"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageSlot } from "@/components/ds";
import { Camera } from "./Camera";
import { useFlash } from "./ui";
import s from "./consoles.module.css";

type Photo = { view: string; label: string; id: string | null; src: string | null; meta: string | null };

/** 10.6 Posture photos: front, side, back, left, right with grid and plumb overlay; auto labelled; retake. */
export function PhotosTab({ assessmentId, first, consentOn, photos }: { assessmentId: string; first: string; consentOn: boolean; photos: Photo[] }) {
  const [cam, setCam] = useState<Photo | null>(null);
  const router = useRouter();
  const flash = useFlash();
  return (
    <>
      {!consentOn && <div className={s.flag} style={{ padding: 16 }}><span style={{ font: "600 15px/1.4 var(--font-sans)" }}>Photo and video capture is off. {first} did not consent. Use written observations for Front, Side and Back View.</span></div>}
      <div className={s.photoGrid}>
        {photos.map((p) => {
          const taken = !!p.id;
          return (
            <div key={p.view} className={s.box} style={{ opacity: consentOn ? 1 : 0.5 }}>
              <div style={{ position: "relative", aspectRatio: "3/4" }}>
                <ImageSlot caption={!consentOn ? "OFF · NO CONSENT" : taken ? `PHOTO: ${p.label.toUpperCase()}` : "TAP TO CAPTURE"} src={consentOn ? p.src ?? undefined : undefined} style={{ position: "absolute", inset: 0 }} />
                <div className={s.gridOverlay} />
                <div className={s.plumb} />
              </div>
              <div style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <b style={{ fontSize: 11, textTransform: "uppercase" }}>{p.label}</b>
                  <span style={{ fontSize: 9, color: "var(--grey-600)" }}>{taken && consentOn ? p.meta : "Not taken"}</span>
                </span>
                <button type="button" className={s.smallBtn} disabled={!consentOn} onClick={() => setCam(p)} aria-label={`${taken ? "Retake" : "Capture"} ${p.label} photo`}>
                  {taken ? "Retake" : "Capture"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {cam && (
        <Camera
          assessmentId={assessmentId}
          view={cam.view}
          label={cam.label}
          kind="PHOTO"
          onClose={() => setCam(null)}
          onDone={() => {
            flash(`${cam.label} photo saved.`);
            setCam(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
