"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Button, OptionRow } from "@/components/ds";
import { useToast } from "@/components/ui/Toast";
import { btnClass } from "@/components/client/shell/btn";
import { cancelSession, confirmSession, loadSessionDrawer, requestReschedule } from "@/server/client/sessions";
import type { DrawerModel } from "@/server/client/shell/core";
import { Overlay } from "./Overlay";
import l from "./layers.module.css";

const REASONS = ["I am unwell", "Work came up", "Travelling", "Something else"];

export function SessionDrawer({ id, panel, setPanel, onClose }: { id: string; panel: string; setPanel: (p: "main" | "resched" | "cant") => void; onClose: () => void }) {
  const [d, setD] = useState<DrawerModel | null | undefined>(undefined);
  const [slot, setSlot] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const load = useCallback(() => {
    loadSessionDrawer(id).then(setD, () => setD(null));
  }, [id]);
  useEffect(() => {
    setD(undefined);
    load();
  }, [load]);
  useEffect(() => {
    setSlot(null);
    setReason(null);
  }, [panel]);

  const run = (fn: () => Promise<{ toast?: string; error?: string }>) =>
    start(async () => {
      const r = await fn();
      toast(r.error ?? r.toast ?? "");
      if (!r.error) setPanel("main");
      router.refresh();
      load();
    });

  if (d === undefined)
    return (
      <Overlay kind="drawer" label="Session" onClose={onClose}>
        <div className={l.loading}>Loading</div>
      </Overlay>
    );
  if (d === null)
    return (
      <Overlay kind="drawer" label="Session" onClose={onClose}>
        <div className={l.loading}>This session is not in your calendar.</div>
      </Overlay>
    );

  const stOn = d.status === "CONFIRMED" || d.status === "DONE";
  const view = panel === "resched" && d.canChange ? "resched" : panel === "cant" && d.canChange ? "cant" : "main";

  return (
    <Overlay kind="drawer" label="Session" onClose={onClose}>
      <div className={l.top}>
        <span className={l.typeRow}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className={l.sw} style={{ background: d.typeBg }} />
            <span className={l.small11}>{d.typeLabel}</span>
          </span>
          <span className={l.stChip} style={{ background: stOn ? "var(--ink)" : d.status === "SCHEDULED" ? "var(--ice)" : "#fff", color: stOn ? "#fff" : "var(--ink)" }}>
            {d.statusLabel}
          </span>
        </span>
        <span className={l.bigTitle}>{d.title}</span>
      </div>

      {view === "main" && (
        <>
          {d.canChange ? (
            <div className={l.actions}>
              {d.canConfirm && (
                <Button variant="blue" size="md" full disabled={pending} onClick={() => run(() => confirmSession(d.id))}>
                  CONFIRM
                </Button>
              )}
              {d.online && d.joinHref && (
                <a href={d.joinHref} className={btnClass("blue", "md", true)} {...(d.joinHref.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                  JOIN SESSION →
                </a>
              )}
              {d.isConfirmed && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "4px 0 6px" }}>
                    <span style={{ font: "600 16px var(--font-sans)" }}>✓ Confirmed</span>
                    <span style={{ fontSize: 11, color: "var(--grey-700)" }}>{d.waLine}</span>
                  </div>
                  <div className={l.two}>
                    <a href={d.googleUrl} target="_blank" rel="noreferrer" className={btnClass("outline", "sm", true)}>
                      GOOGLE CALENDAR
                    </a>
                    <a href={d.icsUrl} className={btnClass("outline", "sm", true)} download>
                      APPLE CALENDAR
                    </a>
                  </div>
                </>
              )}
              {!d.bookingClosed && (
                <div className={l.two}>
                  <Button variant="outline" size="sm" full onClick={() => setPanel("resched")}>
                    RESCHEDULE
                  </Button>
                  <Button variant="outline" size="sm" full onClick={() => setPanel("cant")}>
                    CAN&apos;T MAKE IT
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className={l.statusLine}>{d.statusLine}</div>
          )}
          {d.sections.map((sec) => (
            <div key={sec.title} className={l.sec}>
              <span className={l.secTitle}>{sec.title}</span>
              {sec.rows.map((r, i) => (
                <div key={i} className={l.kv}>
                  <span>{r.k}</span>
                  <span>{r.v}</span>
                </div>
              ))}
              {sec.text && <span className={l.text}>{sec.text}</span>}
              {sec.links?.map((lk) =>
                lk.href ? (
                  <a key={lk.label} href={lk.href} className={l.link} {...(lk.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                    {lk.label} →
                  </a>
                ) : (
                  <span key={lk.label} className={l.link}>
                    {lk.label}
                  </span>
                ),
              )}
            </div>
          ))}
        </>
      )}

      {view === "resched" && (
        <>
          <div className={l.rule}>
            <b>The rule</b>
            <span>At least 24 hours notice. Late changes may count as a used session.</span>
          </div>
          <div className={l.subhead}>Coach availability</div>
          <div role="radiogroup" aria-label="Coach availability">
            {d.slots.length === 0 && <div className={l.statusLine}>No free times in the next few weeks. Message us on WhatsApp.</div>}
            {d.slots.map((sl) => (
              <div key={sl.id} className={sl.blocked ? l.blocked : undefined} aria-disabled={sl.blocked || undefined}>
                <OptionRow label={sl.label} desc={sl.desc} checked={slot === sl.id} onClick={() => !sl.blocked && setSlot(sl.id)} />
              </div>
            ))}
          </div>
          <div className={l.foot}>
            <Button variant="outline" size="md" onClick={() => setPanel("main")}>
              ← BACK
            </Button>
            <Button variant={slot ? "blue" : "outline"} size="md" full disabled={!slot || pending} onClick={() => slot && run(() => requestReschedule(d.id, slot))}>
              SEND REQUEST →
            </Button>
          </div>
        </>
      )}

      {view === "cant" && (
        <>
          <div className={l.rule}>
            <b>Before you cancel</b>
            <span>{d.late ? "This is less than 24 hours away, so it may count as a used session." : "More than 24 hours to go, so this does not use a session."}</span>
          </div>
          <div className={l.subhead}>What happened?</div>
          <div role="radiogroup" aria-label="What happened?">
            {REASONS.map((r) => (
              <OptionRow key={r} label={r} checked={reason === r} onClick={() => setReason(r)} />
            ))}
          </div>
          <div className={l.foot}>
            <Button variant="outline" size="md" onClick={() => setPanel("main")}>
              ← BACK
            </Button>
            <Button variant={reason ? "ink" : "outline"} size="md" full disabled={!reason || pending} onClick={() => reason && run(() => cancelSession(d.id, reason))}>
              {`TELL ${d.coach.toUpperCase()}`}
            </Button>
          </div>
        </>
      )}
    </Overlay>
  );
}
