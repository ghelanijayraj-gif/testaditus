"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button, OptionRow } from "@/components/ds";
import { useToast } from "@/components/ui/Toast";
import { bookSession, loadBooking } from "@/server/client/sessions";
import type { BookingModel } from "@/server/client/shell/core";
import { Overlay } from "./Overlay";
import l from "./layers.module.css";

/** 05 booking modal: book a session (incl. first session) and book the reassessment inside the window. */
export function BookingModal({ kind, onClose }: { kind: "book" | "bookRe"; onClose: () => void }) {
  const [m, setM] = useState<BookingModel | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [sent, setSent] = useState<{ line: string; coach: string } | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  useEffect(() => {
    loadBooking(kind).then(setM, () => setM(null));
  }, [kind]);

  const title = m?.title ?? (kind === "bookRe" ? "Book your reassessment" : "Book a session");
  const send = () =>
    slot &&
    start(async () => {
      const r = await bookSession({ slotId: slot, kind });
      if (r.error) {
        toast(r.error);
        loadBooking(kind).then(setM);
        setSlot(null);
        return;
      }
      setSent({ line: r.line ?? "", coach: r.coach ?? m?.coach ?? "" });
      router.refresh();
    });

  return (
    <Overlay kind="modal" label={title} onClose={onClose}>
      {!m ? (
        <div className={l.loading}>Loading</div>
      ) : sent ? (
        <div className={l.sent}>
          <span style={{ font: "600 17px/1.4 var(--font-sans)" }}>{sent.line}</span>
          <span style={{ font: "400 14px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>{sent.coach} confirms on WhatsApp, usually within a few hours.</span>
          <Button variant="ink" size="md" full onClick={onClose}>
            DONE
          </Button>
        </div>
      ) : (
        <>
          {m.showRule && (
            <div className={l.rule}>
              <b style={{ fontSize: 12 }}>The rule</b>
              <span>At least 24 hours notice. Late changes may count as a used session.</span>
            </div>
          )}
          <div className={l.ctx}>
            <span>{m.ctxK}</span>
            <span>{m.ctxV}</span>
          </div>
          {m.closed ? (
            <div className={l.statusLine}>{m.closed}</div>
          ) : (
            <>
              <div className={l.subhead}>Available</div>
              <div role="radiogroup" aria-label="Available">
                {m.slots.length === 0 && <div className={l.statusLine}>No free times right now. Message us on WhatsApp.</div>}
                {m.slots.map((s) => (
                  <div key={s.id} className={s.blocked ? l.blocked : undefined} aria-disabled={s.blocked || undefined}>
                    <OptionRow label={s.label} desc={s.desc} checked={slot === s.id} onClick={() => !s.blocked && setSlot(s.id)} />
                  </div>
                ))}
              </div>
            </>
          )}
          <div className={l.footOne}>
            <Button variant={slot ? "blue" : "outline"} size="md" full disabled={!slot || pending || !!m.closed} onClick={send}>
              BOOK →
            </Button>
          </div>
        </>
      )}
    </Overlay>
  );
}
