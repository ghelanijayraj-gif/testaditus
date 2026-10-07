"use client";

import { useState } from "react";
import { Button, ImageSlot } from "@/components/ds";
import { BodyMap, type BodySpot } from "@/components/shared/BodyMap";
import { FOCUS_GROUPS, FOCUS_POS } from "@/components/shared/bodyGeometry";
import { approveAndRelease, returnWithComment } from "@/server/consoles/actions";
import type { loadReview } from "@/server/consoles/data";
import { MeasureSummary } from "./MeasureSummary";
import { Wrap } from "./Wrap";
import { PATHS, SECTIONS, focusOf } from "./lib";
import { useRun } from "./ui";
import s from "./consoles.module.css";

type D = NonNullable<Awaited<ReturnType<typeof loadReview>>>;

const VIEWS = ["front", "side", "back", "left", "right"];

export function ReviewScreen({ d, canAct, edit, me }: { d: D; canAct: boolean; edit: boolean; me: string }) {
  const { run, pending } = useRun();
  const [returning, setReturning] = useState(false);
  const [comment, setComment] = useState("");
  const st = d.report.status;
  const released = st === "RELEASED";
  const waiting = st === "PENDING_APPROVAL";
  const lastReturn = d.comments.find((c) => c.action === "RETURNED");
  const line = released
    ? `${d.client.first} has an email and a WhatsApp: “Your report is ready.”`
    : st === "RETURNED"
      ? `Returned to ${d.author} ${lastReturn?.by === me ? "with your comment" : `by ${lastReturn?.by ?? "the head coach"}`}.`
      : waiting
        ? `Submitted ${d.report.submittedAt ?? ""} by ${d.author}`
        : "Draft · not submitted yet";

  // Report preview: body highlights from the priorities.
  const groups = [...new Set(d.findings.flatMap((f) => (f.bodyGroups.length ? f.bodyGroups : f.key && f.system === "MOVEMENT" ? FOCUS_GROUPS[focusOf(f.key)] ?? [] : [])))];
  const spots = (view: "front" | "back"): BodySpot[] =>
    d.findings
      .map((f, i) => {
        if (!f.key || f.system !== "MOVEMENT") return null;
        const xy = FOCUS_POS[focusOf(f.key)]?.[view];
        return xy ? { id: f.id + view, x: xy[0], y: xy[1], n: String(i + 1).padStart(2, "0") } : null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x);
  const starting = d.wrap.startingPoint || d.wrap.sections.bigPicture;
  const path = PATHS.find((p) => p.key === d.wrap.path);
  const photos = VIEWS.map((v) => {
    const m = [...d.media].reverse().find((x) => x.kind === "PHOTO" && x.view === v);
    return { label: v[0].toUpperCase() + v.slice(1), m };
  });
  const videos = d.media.filter((m) => m.kind === "VIDEO");

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {canAct ? (
          <>
            <Button variant={released ? "ink" : "blue"} size="md" disabled={!waiting || pending} onClick={() => run(() => approveAndRelease(d.report.id))}>
              {released ? "✓ RELEASED" : "APPROVE AND RELEASE"}
            </Button>
            <Button variant="outline" size="md" disabled={!waiting} onClick={() => setReturning((x) => !x)}>
              RETURN WITH COMMENT
            </Button>
            <Button variant="outline" size="md" disabled={released} href={edit ? `/staff/review/${d.report.id}` : `/staff/review/${d.report.id}?edit=1`}>
              {edit ? "CLOSE EDIT" : "EDIT"}
            </Button>
          </>
        ) : (
          <span className={s.chip}>Read only · the head coach approves</span>
        )}
        <span style={{ fontSize: 11, color: "var(--grey-700)" }}>{line}</span>
      </div>
      {returning && waiting && canAct && (
        <div className={s.box} style={{ padding: "14px 16px", gap: 8 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase" }}>Comment for {d.author}</span>
          <textarea className={s.textarea} style={{ minHeight: 70 }} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What needs fixing, in plain words. Name the priority or section." aria-label={`Comment for ${d.author}`} />
          <div>
            <Button variant="ink" size="sm" disabled={pending || comment.trim().length < 3} onClick={() => run(() => returnWithComment(d.report.id, comment), { onOk: () => setReturning(false) })}>
              SEND TO {d.author.toUpperCase()}
            </Button>
          </div>
        </div>
      )}

      {edit ? (
        <Wrap mode="head" reportId={d.report.id} first={d.client.first} wrap={d.wrap} />
      ) : (
        <div className={s.reviewCols}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            {d.flags.length > 0 && (
              <div className={s.flag} style={{ padding: "12px 16px", gap: 3 }}>
                <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--blue)" }}>Safety flag · discussed before testing</span>
                <span style={{ font: "600 14px var(--font-sans)" }}>
                  {[d.flags.join(" "), d.notes.length ? `${d.author} note: ${d.notes.slice(0, 2).join(" · ")}` : ""].filter(Boolean).join(" ")}
                </span>
              </div>
            )}
            <MeasureSummary bank={d.bank} testKeys={d.testKeys} measures={d.measures} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,120px),1fr))", gap: 8 }}>
              {photos.map((p) => (
                <div key={p.label} style={{ aspectRatio: "3/4", position: "relative" }}>
                  {p.m?.src ? (
                    <a href={p.m.src} target="_blank" rel="noopener" aria-label={`Open ${p.label} photo`} style={{ position: "absolute", inset: 0 }}>
                      <ImageSlot caption={p.label} src={p.m.src} style={{ position: "absolute", inset: 0 }} />
                    </a>
                  ) : (
                    <ImageSlot caption={p.m ? `PHOTO: ${p.m.label.toUpperCase()}` : `${p.label} · not taken`} style={{ position: "absolute", inset: 0 }} />
                  )}
                </div>
              ))}
            </div>
            {videos.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,160px),1fr))", gap: 8 }}>
                {videos.map((v) => (
                  <div key={v.id} style={{ aspectRatio: "16/10", position: "relative", background: "var(--ink)" }}>
                    {v.src ? <video src={v.src} controls muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ImageSlot tone="dark" caption={`VIDEO: ${v.label.toUpperCase()}`} style={{ position: "absolute", inset: 0 }} />}
                  </div>
                ))}
              </div>
            )}
            {d.comments.length > 0 && (
              <div className={s.box}>
                <div className={s.boxHead}>
                  <b>History</b>
                </div>
                {d.comments.map((c) => (
                  <div key={c.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--grey-200)", display: "flex", flexDirection: "column", gap: 3 }}>
                    <span className={s.kicker}>
                      {c.action === "RETURNED" ? "Returned" : c.action === "APPROVED" ? "Approved" : c.action === "EDITED" ? "Edited" : "Comment"} · {c.by} · {c.when}
                    </span>
                    {c.action === "RETURNED" && <span style={{ font: "400 14px/1.4 var(--font-sans)" }}>“{c.body}”</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <div className={s.box}>
              <div className={s.boxHead}>
                <b>Report preview</b>
                <span className={s.boxMeta}>As {d.client.first} will see it</span>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6, borderBottom: "1px solid var(--grey-200)" }}>
                <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--blue)" }}>Your starting point</span>
                <span style={{ font: "400 16px/1.45 var(--font-sans)" }}>{starting || "Not written yet."}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) minmax(0,1.3fr)" }}>
                {(["front", "back"] as const).map((v, i) => (
                  <div key={v} style={{ background: "var(--grey-50)", padding: 12, display: "flex", justifyContent: "center", boxShadow: i ? "inset 1px 0 0 var(--grey-200)" : undefined }}>
                    <div style={{ position: "relative", width: "100%", maxWidth: 130, aspectRatio: "400/720" }}>
                      <BodyMap view={v} selected={groups} spots={spots(v)} ariaLabel={`Body highlights, ${v} view`} />
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  {d.findings.map((f, i) => (
                    <div key={f.id} style={{ padding: "10px 12px", borderBottom: "1px solid var(--grey-200)", display: "grid", gridTemplateColumns: "26px 1fr", gap: "2px 8px" }}>
                      <span style={{ gridRow: "span 2", width: 22, height: 22, border: "2px solid var(--blue)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</span>
                      <b style={{ font: "600 13px var(--font-sans)" }}>{f.title}</b>
                      <span style={{ fontSize: 11, color: "var(--grey-700)" }}>{f.value || "·"}</span>
                    </div>
                  ))}
                  {d.findings.length === 0 && <span style={{ padding: "10px 12px", fontSize: 11, color: "var(--grey-600)" }}>No priorities yet</span>}
                </div>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid var(--grey-200)" }}>
                <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--blue)" }}>Recommended path</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 20, textTransform: "uppercase" }}>{path?.title ?? "Not chosen yet."}</span>
                {d.wrap.reason && <span style={{ font: "400 14px/1.4 var(--font-sans)", color: "var(--grey-700)" }}>{d.wrap.reason}</span>}
              </div>
            </div>

            <div className={s.box}>
              <div className={s.boxHead}>
                <b>Priorities and notes</b>
                <span className={s.boxMeta}>{d.findings.length} priorities</span>
              </div>
              {d.findings.map((f, i) => (
                <div key={f.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--grey-200)", display: "flex", flexDirection: "column", gap: 6 }}>
                  <b style={{ font: "600 15px var(--font-sans)" }}>
                    <span style={{ font: "700 10px var(--font-mono)", color: "var(--blue)", marginRight: 8 }}>Priority {i + 1}</span>
                    {f.title}
                  </b>
                  {(
                    [
                      ["What we observed", f.observed],
                      ["Why it matters", f.why],
                      ["What we would work on", f.workOn],
                    ] as const
                  ).map(([k, v]) => (
                    <span key={k} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span className={s.kicker}>{k}</span>
                      <span style={{ font: "400 14px/1.4 var(--font-sans)", color: v ? "var(--ink)" : "var(--grey-400)" }}>{v || "To write"}</span>
                    </span>
                  ))}
                  {f.related.length > 0 && (
                    <span style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                      <span className={s.kicker}>Related</span>
                      {f.related.map((r) => (
                        <span key={r} className={s.chip}>
                          {r}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              ))}
              {SECTIONS.map((sc) => (
                <div key={sc.key} style={{ padding: "10px 16px", borderBottom: "1px solid var(--grey-200)", display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ display: "flex", justifyContent: "space-between", fontSize: 10, textTransform: "uppercase" }}>
                    <b>{sc.label}</b>
                    <span style={{ color: "var(--grey-600)" }}>{d.wrap.sections[sc.key] ? "Written" : "To write"}</span>
                  </span>
                  {d.wrap.sections[sc.key] && <span style={{ font: "400 14px/1.4 var(--font-sans)" }}>{d.wrap.sections[sc.key]}</span>}
                </div>
              ))}
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
                <span className={s.kicker}>Note to {d.client.first}</span>
                <span style={{ font: "400 14px/1.45 var(--font-sans)", color: d.wrap.note ? "var(--ink)" : "var(--grey-400)" }}>{d.wrap.note || "Not written"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
