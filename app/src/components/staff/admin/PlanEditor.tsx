"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ds";
import { useToast } from "@/components/ui/Toast";
import type { EdView } from "@/server/staff/plan";
import { chipBtn, fieldLabel, input, squareBtn, textarea } from "./styles";
import a from "./admin.module.css";

type Act = { toast?: string; error?: string; redirect?: string } | void;
type Actions = {
  add: (i: { clientId: string; quick?: "photos" | "document" | "question" | "live" | "recommend"; family?: string; strong?: boolean; reason?: string }) => Promise<Act>;
  move: (id: string, dir: -1 | 1) => Promise<Act>;
  remove: (id: string) => Promise<Act>;
  update: (id: string, patch: { required?: boolean; paid?: boolean; replacesCapture?: boolean; dueAt?: string | null; note?: string | null }) => Promise<Act>;
  send: (planId: string) => Promise<Act>;
  reorder: (planId: string, ids: string[]) => Promise<Act>;
};

const REC_REASON = "We could not measure hip rotation online.";

/** 12 Assessment plan editor (`ED`): drafts stay invisible to the client until SEND TO CLIENT. */
export function PlanEditor({ clientId, ed, actions }: { clientId: string; ed: EdView; actions: Actions }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [libOpen, setLibOpen] = useState(false);
  const [recOpen, setRecOpen] = useState(false);
  const [strong, setStrong] = useState(false);
  const [reason, setReason] = useState(REC_REASON);
  const [editing, setEditing] = useState<string | null>(null);
  const [dueVal, setDueVal] = useState("");
  const [noteVal, setNoteVal] = useState("");
  const [drag, setDrag] = useState<{ from?: string; over?: string }>({});

  const run = (fn: () => Promise<Act>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r?.error) toast(r.error);
      else {
        if (r?.toast) toast(r.toast);
        after?.();
      }
      router.refresh();
    });

  const onDrop = (target: string) => {
    const from = drag.from;
    setDrag({});
    if (!from || from === target) return;
    const ids = ed.rows.map((r) => r.id).filter((id) => id !== from);
    ids.splice(ids.indexOf(target), 0, from);
    run(() => actions.reorder(ed.planId, ids));
  };

  return (
    <div className={a.edit} aria-busy={pending}>
      <div className={a.col}>
        {ed.ops && <span style={{ border: "1.5px solid var(--blue)", padding: "8px 12px", fontSize: 11 }}>Ops admin: you can add payment and booking modules only.</span>}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ed.quick.map((q) => (
            <button
              key={q.k}
              type="button"
              className={a.quick}
              disabled={q.off || pending}
              aria-expanded={q.k === "library" ? libOpen : q.k === "recommend" ? recOpen : undefined}
              onClick={() => {
                if (q.k === "library") setLibOpen((v) => !v);
                else if (q.k === "recommend") setRecOpen(true);
                else run(() => actions.add({ clientId, quick: q.k as "photos" }));
              }}
            >
              + {q.label}
            </button>
          ))}
        </div>

        {recOpen && (
          <div style={{ border: "2px solid var(--blue)", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <b style={{ font: "600 14px var(--font-sans)" }}>Recommend in person session</b>
            <label style={fieldLabel}>
              Reason shown to the client
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} style={{ ...textarea, border: "1px solid var(--grey-300)", minHeight: 56 }} />
            </label>
            <button type="button" onClick={() => setStrong((v) => !v)} aria-pressed={strong} style={{ alignSelf: "flex-start", border: 0, background: "none", padding: 0, cursor: "pointer", fontSize: 11, textTransform: "uppercase", display: "flex", gap: 6, alignItems: "center", fontFamily: "var(--font-mono)" }}>
              <span aria-hidden style={{ width: 12, height: 12, border: "1.5px solid var(--ink)", background: strong ? "var(--blue)" : "#fff", display: "inline-block" }} />
              Strongly recommend
            </button>
            <div style={{ display: "flex", gap: 6 }}>
              <Button variant="ink" size="sm" disabled={pending} onClick={() => run(() => actions.add({ clientId, quick: "recommend", strong, reason }), () => { setRecOpen(false); setStrong(false); setReason(REC_REASON); })}>
                ADD TO DRAFT
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRecOpen(false)}>
                CANCEL
              </Button>
            </div>
          </div>
        )}

        <div style={{ border: "2px solid var(--ink)", display: "flex", flexDirection: "column" }}>
          {ed.rows.map((m, i) => (
            <div
              key={m.id}
              className={a.mod}
              style={{ background: m.bg }}
              data-drag={drag.over === m.id && drag.from !== m.id ? "over" : undefined}
              onDragOver={(e) => {
                if (!drag.from) return;
                e.preventDefault();
                if (drag.over !== m.id) setDrag((d) => ({ ...d, over: m.id }));
              }}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(m.id);
              }}
            >
              <div className={a.modTop}>
                <span className={a.handle} title="Drag to reorder" draggable onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDrag({ from: m.id }); }} onDragEnd={() => setDrag({})} aria-hidden>
                  ⋮⋮
                </span>
                <b className={a.modName}>{m.name}</b>
                {m.tag && <span className={a.tag}>{m.tag}</span>}
                <span className={a.meta}>
                  {m.type} · {m.status}
                </span>
                <button type="button" style={squareBtn} aria-label={`Move ${m.name} up`} disabled={pending || i === 0} onClick={() => run(() => actions.move(m.id, -1))}>
                  ↑
                </button>
                <button type="button" style={squareBtn} aria-label={`Move ${m.name} down`} disabled={pending || i === ed.rows.length - 1} onClick={() => run(() => actions.move(m.id, 1))}>
                  ↓
                </button>
                <button type="button" style={{ ...squareBtn, opacity: m.locked || m.opsLocked ? 0.3 : 1, cursor: m.locked || m.opsLocked ? "not-allowed" : "pointer" }} aria-label={`Remove ${m.name}`} disabled={m.locked || m.opsLocked || pending} onClick={() => run(() => actions.remove(m.id))}>
                  ×
                </button>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <button type="button" style={chipBtn(m.required)} aria-pressed={m.required} disabled={pending || m.opsLocked} onClick={() => run(() => actions.update(m.id, { required: !m.required }))}>
                  {m.required ? "Required" : "Optional"}
                </button>
                <button type="button" style={{ ...chipBtn(false), background: m.paid ? "var(--ice)" : "#fff" }} aria-pressed={m.paid} disabled={pending} onClick={() => run(() => actions.update(m.id, { paid: !m.paid }))}>
                  {m.paid ? `Paid · ${m.priceLabel} · Shopify link` : "Included"}
                </button>
                {m.paid && m.paymentUrl && (
                  <a href={m.paymentUrl} target="_blank" rel="noreferrer" style={{ fontSize: 9, textTransform: "uppercase", color: "var(--blue)" }}>
                    Payment link →
                  </a>
                )}
                {m.isIP && (
                  <button type="button" style={chipBtn(m.replaces)} aria-pressed={m.replaces} disabled={pending} onClick={() => run(() => actions.update(m.id, { replacesCapture: !m.replaces }))}>
                    {m.replaces ? "Replaces Online Capture" : "Adds to Online Capture"}
                  </button>
                )}
                <button
                  type="button"
                  className={a.dueBtn}
                  title="Edit due date and note"
                  disabled={m.opsLocked}
                  aria-expanded={editing === m.id}
                  onClick={() => {
                    setEditing(editing === m.id ? null : m.id);
                    setDueVal(m.dueISO);
                    setNoteVal(m.note);
                  }}
                >
                  {m.due}
                </button>
              </div>
              {m.note && editing !== m.id && <span className={a.note}>Note to client: {m.note}</span>}
              {editing === m.id && (
                <form
                  style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0 2px" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(() => actions.update(m.id, { dueAt: dueVal || null, note: noteVal }), () => setEditing(null));
                  }}
                >
                  <label style={fieldLabel}>
                    Due date
                    <input type="date" value={dueVal} onChange={(e) => setDueVal(e.target.value)} style={{ ...input, maxWidth: 200 }} />
                  </label>
                  <label style={fieldLabel}>
                    Note to client
                    <textarea value={noteVal} onChange={(e) => setNoteVal(e.target.value)} style={textarea} />
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button variant="ink" size="sm" type="submit" disabled={pending}>
                      SAVE TO DRAFT
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
                      CANCEL
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ))}
          {ed.rows.length === 0 && <span style={{ padding: 12, fontSize: 11, color: "var(--grey-600)" }}>No modules in this plan.</span>}
        </div>

        {libOpen && (
          <div style={{ border: "1.5px solid var(--ink)", display: "flex", flexDirection: "column" }}>
            <span style={{ padding: "8px 12px", fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid var(--grey-200)" }}>Add from library · published only</span>
            {ed.lib.map((l) => (
              <button key={l.family} type="button" className={a.libRow} disabled={pending} onClick={() => run(() => actions.add({ clientId, family: l.family }), () => setLibOpen(false))}>
                <span style={{ font: "500 13px var(--font-sans)" }}>{l.name}</span>
                <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--grey-600)" }}>{l.type}</span>
              </button>
            ))}
            {ed.lib.length === 0 && <span style={{ padding: "8px 12px", fontSize: 11, color: "var(--grey-600)" }}>No published templates.</span>}
          </div>
        )}
      </div>

      <div className={a.side}>
        <div className={a.box}>
          <span className={a.boxHead}>
            <b>What {ed.first} will see</b>
            <span style={{ color: "var(--grey-600)" }}>{ed.draftL}</span>
          </span>
          {ed.diff.map((d, i) => (
            <div key={i} style={{ padding: "10px 12px", borderBottom: "1px solid var(--grey-200)", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--blue)" }}>{d.kind}</span>
              <b style={{ font: "600 14px var(--font-sans)" }}>{d.name}</b>
              <span style={{ font: "400 12px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>{d.line}</span>
            </div>
          ))}
          {ed.diff.length === 0 && <span style={{ padding: 12, fontSize: 11, color: "var(--grey-600)" }}>No unsent changes. The client sees the current plan.</span>}
          <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
            <Button variant="blue" size="sm" full disabled={pending} onClick={() => run(() => actions.send(ed.planId))}>
              SEND TO CLIENT
            </Button>
            <span style={{ fontSize: 10, color: "var(--grey-600)" }}>Sends WhatsApp and email: “{ed.staffName} added a step to your assessment.”</span>
          </div>
        </div>
        <div className={a.thinBox}>
          <span className={a.thinHead}>Version history</span>
          {ed.hist.map((h) => (
            <div key={h.v} style={{ padding: "8px 12px", borderBottom: "1px solid var(--grey-200)", display: "grid", gridTemplateColumns: "34px minmax(0,1fr)", gap: 8 }}>
              <b style={{ fontSize: 11 }}>{h.v}</b>
              <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ font: "500 12px var(--font-sans)" }}>{h.what}</span>
                <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--grey-600)" }}>{h.who}</span>
              </span>
            </div>
          ))}
          {ed.hist.length === 0 && <span style={{ padding: "8px 12px", fontSize: 11, color: "var(--grey-600)" }}>Not sent yet.</span>}
        </div>
      </div>
    </div>
  );
}
