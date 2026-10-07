"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { staffStyles as s } from "@/components/staff/Page";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ds";

export type ClientTableRow = {
  id: string;
  href: string;
  cells: { name: string; city: string; mumbai: string; status: string; flag: boolean; modules: string; practitioner: string; next: string; due: string; plan: string; expiry: string };
};

type Act = { toast?: string; error?: string; redirect?: string } | void;

const COLS = "32px 1.4fr 1fr .6fr 1.2fr .7fr .9fr 1.3fr .9fr .7fr .7fr";
const HEAD = ["", "Name", "City", "Mumbai", "Status", "Modules", "Practitioner", "Next action", "Due", "Plan", "Expiry"];

/** 12 Clients: dense table, row checkboxes and the sticky bulk bar (assign practitioner, send nudge). */
export function ClientsTable({ rows, practitioners, canAssign, assign, nudge }: {
  rows: ClientTableRow[];
  practitioners: { id: string; name: string }[];
  canAssign: boolean;
  assign: (ids: string[], staffId: string) => Promise<Act>;
  nudge: (ids: string[]) => Promise<Act>;
}) {
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [picker, setPicker] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const chosen = Object.keys(sel).filter((k) => sel[k] && rows.some((r) => r.id === k));
  const run = (fn: () => Promise<Act>) =>
    start(async () => {
      const r = await fn();
      if (r?.error) toast(r.error);
      else if (r?.toast) toast(r.toast);
      setSel({});
      setPicker(false);
      router.refresh();
    });

  return (
    <>
      {chosen.length > 0 && (
        <div className={s.bulk} role="region" aria-label="Bulk actions">
          <span>{chosen.length} selected</span>
          <button type="button" className={s.bulkBtn} disabled={pending} onClick={() => (canAssign ? setPicker((v) => !v) : toast("Ask a head of department to reassign clients."))} aria-expanded={picker}>
            Assign practitioner
          </button>
          <button type="button" className={s.bulkBtn} disabled={pending} onClick={() => run(() => nudge(chosen))}>
            Send nudge
          </button>
          {picker && (
            <span style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "var(--sky)" }}>Pick</span>
              {practitioners.map((p) => (
                <button key={p.id} type="button" className={s.bulkBtn} style={{ background: "#fff", color: "var(--ink)" }} disabled={pending} onClick={() => run(() => assign(chosen, p.id))}>
                  {p.name}
                </button>
              ))}
            </span>
          )}
          <button type="button" className={s.bulkBtn} style={{ marginLeft: "auto", border: 0 }} onClick={() => setSel({})}>
            Clear
          </button>
        </div>
      )}
      <section className={s.block}>
        <div className={s.blockHead}>
          <b className={s.blockTitle}>Clients</b>
          <span className={s.blockCount}>{rows.length}</span>
        </div>
        <div className={s.scroll}>
          <div style={{ minWidth: 1100, display: "flex", flexDirection: "column" }}>
            <div className={s.thead} style={{ gridTemplateColumns: COLS }}>
              {HEAD.map((h, i) =>
                i === 0 ? (
                  <span key={i} className={s.th} style={{ display: "flex", alignItems: "center" }}>
                    <input type="checkbox" aria-label="Select all" checked={rows.length > 0 && chosen.length === rows.length} onChange={(e) => setSel(e.target.checked ? Object.fromEntries(rows.map((r) => [r.id, true])) : {})} style={{ accentColor: "var(--blue)", margin: 0 }} />
                  </span>
                ) : (
                  <span key={i} className={s.th}>
                    {h}
                  </span>
                ),
              )}
            </div>
            {rows.map((r) => {
              const c = r.cells;
              return (
                <div key={r.id} className={s.row + " " + s.rowLink} style={{ gridTemplateColumns: COLS, background: sel[r.id] ? "var(--mist)" : undefined }} onClick={() => router.push(r.href)}>
                  <span className={s.cell} onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" aria-label={`Select ${c.name}`} checked={!!sel[r.id]} onChange={(e) => setSel({ ...sel, [r.id]: e.target.checked })} style={{ accentColor: "var(--blue)", margin: 0 }} />
                  </span>
                  <span className={s.cell + " " + s.cellSans + " " + s.cellB}>
                    <Link href={r.href} onClick={(e) => e.stopPropagation()} style={{ color: "inherit", textDecoration: "none" }}>
                      {c.name}
                    </Link>
                  </span>
                  <span className={s.cell}>{c.city}</span>
                  <span className={s.cell}>{c.mumbai}</span>
                  <span className={s.cell}>
                    <span className={s.chip + (c.flag ? " " + s.chipFlag : "")}>{c.status}</span>
                  </span>
                  <span className={s.cell}>{c.modules}</span>
                  <span className={s.cell}>{c.practitioner}</span>
                  <span className={s.cell + " " + s.cellSans}>{c.next}</span>
                  <span className={s.cell}>{c.due}</span>
                  <span className={s.cell} style={{ overflowWrap: "normal" }}>{c.plan}</span>
                  <span className={s.cell}>{c.expiry}</span>
                </div>
              );
            })}
            {rows.length === 0 && <span className={s.empty}>No clients match this view.</span>}
          </div>
        </div>
      </section>
    </>
  );
}

/** SAVE VIEW: names the current view + search and stores it as a SavedView. */
export function SaveView({ view, q, save }: { view: string; q: string; save: (i: { name: string; view?: string; q?: string }) => Promise<Act> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  if (!open)
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        SAVE VIEW
      </Button>
    );
  return (
    <form
      style={{ display: "flex", gap: 6, alignItems: "center" }}
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await save({ name, view, q });
          if (r?.error) return toast(r.error);
          if (r?.toast) toast(r.toast);
          setOpen(false);
          setName("");
          if (r?.redirect) router.push(r.redirect);
        });
      }}
    >
      <input autoFocus aria-label="View name" placeholder="View name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)} style={{ height: 40, border: "2px solid var(--ink)", padding: "0 10px", font: "400 13px var(--font-sans)", width: 180, borderRadius: 0 }} />
      <button type="submit" disabled={pending} style={{ height: 40, padding: "0 14px", border: 0, background: "var(--ink)", color: "#fff", fontFamily: "var(--font-display)", fontSize: 12, cursor: "pointer" }}>
        SAVE
      </button>
      <button type="button" onClick={() => setOpen(false)} aria-label="Cancel" style={{ height: 40, width: 40, border: "2px solid var(--ink)", background: "#fff", cursor: "pointer" }}>
        ×
      </button>
    </form>
  );
}
