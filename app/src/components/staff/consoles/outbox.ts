"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MeasureOp } from "@/server/consoles/actions";

export const NET_EVENT = "aditus:console-net";
export type NetState = { online: boolean; pending: number };

const key = (id: string) => `aditus.console.queue.${id}`;
function read(id: string): MeasureOp[] {
  try {
    return JSON.parse(localStorage.getItem(key(id)) ?? "[]") as MeasureOp[];
  } catch {
    return [];
  }
}
function write(id: string, q: MeasureOp[]) {
  try {
    if (q.length) localStorage.setItem(key(id), JSON.stringify(q));
    else localStorage.removeItem(key(id));
  } catch {
    /* storage blocked: the in memory queue still syncs */
  }
}
export const opId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/**
 * Offline first autosave: every entry goes into a localStorage queue on the tablet and is
 * flushed to the server in order; ops carry client ids so a replay is idempotent. While
 * offline (or while the server cannot be reached) the queue holds and the console shows
 * "Saved on tablet, syncing when back online".
 */
export function useOutbox(assessmentId: string, send: (ops: MeasureOp[]) => Promise<{ done?: string[]; error?: string }>) {
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(true);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mem = useRef<MeasureOp[]>([]);
  const busy = useRef(false);

  const emit = useCallback((on: boolean, n: number) => {
    setOnline(on);
    setPending(n);
    window.dispatchEvent(new CustomEvent<NetState>(NET_EVENT, { detail: { online: on, pending: n } }));
  }, []);

  const flush = useCallback(async () => {
    if (busy.current) return;
    const q = mem.current;
    if (!q.length) return emit(navigator.onLine, 0);
    if (!navigator.onLine) return emit(false, q.length);
    busy.current = true;
    const batch = q.slice(0, 50);
    try {
      const r = await send(batch);
      if (r?.error) {
        setError(r.error);
        // A rejected op (validation, no access) is dropped so it cannot block the queue.
        mem.current = mem.current.filter((o) => !batch.includes(o));
      } else {
        const done = new Set(r?.done ?? batch.map((o) => o.id));
        mem.current = mem.current.filter((o) => !done.has(o.id));
        setError(null);
        setJustSaved(true);
      }
      write(assessmentId, mem.current);
      emit(true, mem.current.length);
    } catch {
      emit(false, mem.current.length);
    } finally {
      busy.current = false;
    }
    if (mem.current.length && navigator.onLine) setTimeout(flush, 400);
  }, [assessmentId, emit, send]);

  const enqueue = useCallback(
    (op: Omit<MeasureOp, "id">) => {
      const full = { ...op, id: opId() } as MeasureOp;
      // Last write wins for the same test and side while still queued.
      const same = (o: MeasureOp) => o.testKey === full.testKey && o.kind === full.kind && (o.side ?? "NONE") === (full.side ?? "NONE") && full.kind !== "meta";
      mem.current = [...mem.current.filter((o) => !same(o)), full];
      write(assessmentId, mem.current);
      emit(navigator.onLine, mem.current.length);
      void flush();
    },
    [assessmentId, emit, flush],
  );

  useEffect(() => {
    mem.current = read(assessmentId); // replay anything saved on this tablet earlier
    void flush();
    const on = () => void flush();
    const off = () => emit(false, mem.current.length);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const iv = setInterval(() => mem.current.length && void flush(), 5000);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      clearInterval(iv);
    };
  }, [assessmentId, emit, flush]);

  return { enqueue, pending, online, justSaved, error };
}
