"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ds";
import { useToast } from "@/components/ui/Toast";
import { rateSession, reportIssue } from "@/server/client/sessions";
import type { ShellModel } from "@/server/client/shell/model";
import { btnClass } from "./btn";
import s from "./shell.module.css";

/** 05 §1.6 Reach us panel: WhatsApp, rate last session, report pain or an issue. */
export function ReachUs({ m, onClose }: { m: ShellModel; onClose: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [score, setScore] = useState<number | null>(m.rate?.score ?? null);
  const [note, setNote] = useState(m.rate?.note ?? "");
  const [issue, setIssue] = useState(false);
  const [text, setText] = useState("");
  const [sessionId, setSessionId] = useState(m.issueSessions[0]?.id ?? "");
  const [pending, start] = useTransition();
  const panel = useRef<HTMLDivElement>(null);
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => clearTimeout(t.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText("+" + m.whatsapp.digits);
    } catch {
      /* clipboard blocked */
    }
    setCopied(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setCopied(false), 1600);
  };

  const rate = (n: number, withNote = note) => {
    if (!m.rate) return;
    setScore(n);
    const id = m.rate.sessionId;
    start(async () => {
      const r = await rateSession(id, n, withNote);
      toast(r.error ?? r.toast ?? "");
      router.refresh();
    });
  };

  const send = () =>
    start(async () => {
      const r = await reportIssue({ text, sessionId: sessionId || null });
      toast(r.error ?? r.toast ?? "");
      if (!r.error) {
        setText("");
        setIssue(false);
      }
    });

  const wa = `https://wa.me/${m.whatsapp.digits}?text=${encodeURIComponent(m.whatsapp.prefill)}`;

  return (
    <div className={s.reach} ref={panel} role="dialog" aria-label="Reach us">
      <div className={s.reachHead}>
        <span>Reach us</span>
        <button type="button" className={s.x} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className={s.reachBlock}>
        <a href={wa} target="_blank" rel="noreferrer" className={btnClass("blue", "md", true)}>
          MESSAGE ON WHATSAPP →
        </a>
        <span className={s.muted11}>Opens with: “{m.whatsapp.prefill}”</span>
        <div className={s.numRow}>
          {m.whatsapp.display}
          <button type="button" className={s.copy} onClick={copy}>
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      </div>
      {m.rate && (
        <div className={s.reachBlock}>
          <span className={s.rateLabel} id="rate-label">
            Rate your last session · {m.rate.label}
          </span>
          <div className={s.rates} role="radiogroup" aria-labelledby="rate-label">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={score === n} className={`${s.rate} ${score && n <= score ? s.rateOn : ""}`} onClick={() => rate(n)} disabled={pending}>
                {n}
              </button>
            ))}
          </div>
          <input
            className={s.field}
            placeholder="Add a note (optional)"
            aria-label="Add a note (optional)"
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && score) rate(score);
            }}
            onBlur={() => {
              if (score && note !== (m.rate?.note ?? "")) rate(score);
            }}
          />
        </div>
      )}
      {!issue ? (
        <button type="button" className={s.issueLink} onClick={() => setIssue(true)}>
          Report pain or an issue<span>→</span>
        </button>
      ) : (
        <div className={s.reachBlock} style={{ borderBottom: 0 }}>
          <label className={s.rateLabel} htmlFor="issue-text">
            Report pain or an issue
          </label>
          <textarea id="issue-text" className={s.area} value={text} onChange={(e) => setText(e.target.value)} placeholder="What hurts, or what happened?" maxLength={2000} />
          {m.issueSessions.length > 0 && (
            <>
              <label className={s.muted11} htmlFor="issue-session">
                Before which session
              </label>
              <select id="issue-session" className={s.field} value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
                {m.issueSessions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
                <option value="">Not about a session</option>
              </select>
            </>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 8 }}>
            <Button variant="outline" size="sm" onClick={() => setIssue(false)}>
              ← BACK
            </Button>
            <Button variant={text.trim().length >= 3 ? "ink" : "outline"} size="sm" full disabled={text.trim().length < 3 || pending} onClick={send}>
              SEND TO YOUR COACH →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
