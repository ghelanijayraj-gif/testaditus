"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ds";
import { useToast } from "@/components/ui/Toast";
import { confirmSession, confirmSessions, loadConfirmList } from "@/server/client/sessions";
import type { ListModel } from "@/server/client/shell/core";
import { Overlay } from "./Overlay";
import l from "./layers.module.css";

/** 05 "To confirm" list drawer: the sessions the top action asked about, kept stable while confirming. */
export function ConfirmList({ ids, onClose, onOpen }: { ids: string[]; onClose: () => void; onOpen: (id: string) => void }) {
  const [m, setM] = useState<ListModel | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const key = ids.join(",");
  const load = useCallback(() => {
    loadConfirmList(key.split(",")).then(setM, () => setM({ items: [] }));
  }, [key]);
  useEffect(load, [load]);

  const run = (fn: () => Promise<{ toast?: string; error?: string }>) =>
    start(async () => {
      const r = await fn();
      toast(r.error ?? r.toast ?? "");
      router.refresh();
      load();
    });

  const open = m?.items.filter((i) => i.pending) ?? [];
  return (
    <Overlay kind="drawer" label="To confirm" onClose={onClose}>
      {!m ? (
        <div className={l.loading}>Loading</div>
      ) : (
        <>
          <div className={l.listHead}>
            <b>{open.length ? `${open.length} ${open.length === 1 ? "session" : "sessions"} to confirm.` : "All confirmed."}</b>
            <span style={{ fontSize: 11, color: "var(--grey-700)" }}>Confirm each one, or all at once.</span>
          </div>
          {m.items.map((it) => (
            <div key={it.id} className={l.listRow}>
              <button type="button" className={l.rowBtn} onClick={() => onOpen(it.id)}>
                <span style={{ font: "600 16px var(--font-sans)" }}>{it.title}</span>
                <span style={{ fontSize: 11, textTransform: "uppercase" }}>{it.when}</span>
                <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>{it.meta} · Details →</span>
              </button>
              {it.pending ? (
                <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => confirmSession(it.id))}>
                  CONFIRM
                </Button>
              ) : (
                <span style={{ fontSize: 11, textTransform: "uppercase" }}>✓ {it.statusLabel}</span>
              )}
            </div>
          ))}
          <div className={l.footOne}>
            <Button variant={open.length ? "blue" : "outline"} size="md" full disabled={!open.length || pending} onClick={() => run(() => confirmSessions(open.map((i) => i.id)))}>
              {open.length ? "CONFIRM ALL" : "✓ ALL CONFIRMED"}
            </Button>
          </div>
        </>
      )}
    </Overlay>
  );
}
