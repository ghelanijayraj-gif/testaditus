"use client";

import { useState } from "react";
import type { HealthProvider } from "@prisma/client";
import { Button, OptionRow } from "@/components/ds";
import { useReadOnly } from "@/components/client/readonly";
import { connectSource, disconnectSource, toggleShare } from "@/server/client/records/actions";
import { Modal, Toggle, useRun } from "./ui";
import s from "./records.module.css";

type Source = { key: string; provider: HealthProvider; name: string; shares: string; status: string; tone: "on" | "error" | "off"; on: boolean; types: { t: string; shared: boolean }[] };

export function HealthSources({ sources, closed, coaches }: { sources: Source[]; closed: boolean; coaches: string }) {
  const ro = useReadOnly();
  const { run, pending } = useRun();
  const [consent, setConsent] = useState<Source | null>(null);
  const [agreed, setAgreed] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
      <b className={s.label}>Connected sources</b>
      <div className={s.card}>
        {sources.map((sr) => (
          <div key={sr.key} style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }} className={s.rowLine}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
              <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ font: "600 15px var(--font-sans)" }}>{sr.name}</span>
                <span style={{ fontSize: 10, textTransform: "uppercase", color: sr.tone === "on" ? "var(--ink)" : sr.tone === "error" ? "var(--blue)" : "var(--grey-600)" }}>{sr.status}</span>
              </span>
              <button
                type="button"
                disabled={ro || pending || (!sr.on && closed)}
                onClick={() => {
                  if (sr.on) run(() => disconnectSource(sr.provider));
                  else {
                    setAgreed(false);
                    setConsent(sr);
                  }
                }}
                style={{ height: 32, padding: "0 10px", border: "1.5px solid var(--ink)", background: sr.on ? "#fff" : "var(--ink)", color: sr.on ? "var(--ink)" : "#fff", cursor: "pointer", fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", opacity: !sr.on && closed ? 0.4 : 1 }}
              >
                {sr.on ? "Disconnect" : "Connect"}
              </button>
            </div>
            {sr.on && (
              <>
                <span style={{ fontSize: 11, color: "var(--grey-700)" }}>Shares: {sr.shares}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {sr.types.map((ty) => (
                    <button
                      key={ty.t}
                      type="button"
                      role="switch"
                      aria-checked={ty.shared}
                      disabled={ro || pending}
                      onClick={() => run(() => toggleShare(sr.provider, ty.t))}
                      style={{ border: 0, background: "none", padding: 0, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, textAlign: "left", fontFamily: "var(--font-mono)", color: "var(--ink)" }}
                    >
                      <span style={{ fontSize: 12 }}>
                        {ty.t} <span style={{ color: "var(--grey-600)" }}>· {ty.shared ? "Shared with coach" : "Only you"}</span>
                      </span>
                      <Toggle on={ty.shared} small />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <span style={{ fontSize: 11, lineHeight: 1.5, color: "var(--grey-600)" }}>Share with coach controls what {coaches} see. Data you do not share stays on your phone.</span>

      {consent && (
        <Modal title={`Connect ${consent.name}`} onClose={() => setConsent(null)}>
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6 }} className={s.rowLine}>
            <span style={{ font: "600 15px/1.4 var(--font-sans)" }}>ADITUS will read, not write.</span>
            <span style={{ font: "400 14px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>We read these from {consent.name} once a day. Your coach uses them to plan your sessions. We never diagnose and never show a health score.</span>
          </div>
          <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }} className={s.rowLine}>
            {consent.shares.split(", ").map((t) => (
              <span key={t} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{t.replace(/^./, (c) => c.toUpperCase())}</span>
                <span className={s.meta}>Read only</span>
              </span>
            ))}
          </div>
          <OptionRow multi label="I agree to sync this data with ADITUS" desc="You can turn this off or disconnect any time in Account." checked={agreed} onClick={() => setAgreed((a) => !a)} />
          <div style={{ padding: "16px 18px" }}>
            <Button
              variant={agreed ? "blue" : "outline"}
              size="md"
              full
              disabled={!agreed || pending || ro}
              onClick={() => {
                const p = consent.provider;
                run(() => connectSource(p), { onDone: () => setConsent(null) });
              }}
            >
              ALLOW AND CONNECT →
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
