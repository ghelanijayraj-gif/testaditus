"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ds";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/Toast";
import { fieldLabel, input, textarea } from "./styles";
import a from "./admin.module.css";

type Act = { toast?: string; error?: string; redirect?: string } | void;

function useRun() {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (fn: () => Promise<Act>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r?.error) return void toast(r.error);
      if (r?.toast) toast(r.toast);
      after?.();
      if (r?.redirect) router.push(r.redirect, { scroll: false });
      else router.refresh();
    });
  return { pending, run, router };
}

const editLink = { border: 0, background: "#fff", padding: "8px 12px", textAlign: "left" as const, cursor: "pointer", fontSize: 10, textTransform: "uppercase" as const, color: "var(--blue)", fontFamily: "var(--font-mono)", borderTop: "1px solid var(--grey-200)" };

/** Settings → Mumbai area: cities, PIN prefixes, radius label. */
export function AreaForm({ cities, pins, radius, save }: { cities: string[]; pins: string[]; radius: string; save: (i: { cities: string; pinPrefixes: string; radiusLabel: string }) => Promise<Act> }) {
  const { pending, run } = useRun();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ cities: cities.join(", "), pinPrefixes: pins.join(", "), radiusLabel: radius });
  if (!open)
    return (
      <button type="button" style={editLink} onClick={() => setOpen(true)}>
        Edit area rules →
      </button>
    );
  return (
    <form
      className={a.form}
      style={{ borderTop: "1px solid var(--grey-200)" }}
      onSubmit={(e) => {
        e.preventDefault();
        run(() => save(f), () => setOpen(false));
      }}
    >
      <label style={fieldLabel}>
        Cities · comma separated
        <textarea value={f.cities} onChange={(e) => setF({ ...f, cities: e.target.value })} style={{ ...textarea, minHeight: 56 }} />
      </label>
      <label style={fieldLabel}>
        PIN prefixes · comma separated
        <input value={f.pinPrefixes} onChange={(e) => setF({ ...f, pinPrefixes: e.target.value })} style={input} />
      </label>
      <label style={fieldLabel}>
        Radius
        <input value={f.radiusLabel} onChange={(e) => setF({ ...f, radiusLabel: e.target.value })} style={input} />
      </label>
      <div style={{ display: "flex", gap: 6 }}>
        <Button variant="ink" size="sm" type="submit" disabled={pending}>
          SAVE
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
          CANCEL
        </Button>
      </div>
    </form>
  );
}

/** Settings → Notifications: edit one template's subject and body. */
export function TemplateDrawer({ title, email, subject, body, closeHref, save }: { title: string; email: boolean; subject: string; body: string; closeHref: string; save: (i: { subject?: string; body: string }) => Promise<Act> }) {
  const { pending, run, router } = useRun();
  const [s, setS] = useState(subject);
  const [b, setB] = useState(body);
  return (
    <Drawer open title={title} width={480} onClose={() => router.push(closeHref, { scroll: false })}>
      <form
        className={a.form}
        onSubmit={(e) => {
          e.preventDefault();
          run(() => save({ subject: s, body: b }));
        }}
      >
        {email && (
          <label style={fieldLabel}>
            Subject
            <input value={s} onChange={(e) => setS(e.target.value)} style={input} />
          </label>
        )}
        <label style={fieldLabel}>
          Message
          <textarea value={b} onChange={(e) => setB(e.target.value)} style={{ ...textarea, minHeight: 180 }} />
        </label>
        <span style={{ fontSize: 10, color: "var(--grey-600)", lineHeight: 1.6 }}>Variables: {"{first_name} {staff_name} {module_name} {note} {due} {link} {centre} {when} {session_type} {coach} {progress} {what} {reason}"}</span>
        <Button variant="blue" size="sm" full type="submit" disabled={pending}>
          SAVE TEMPLATE
        </Button>
      </form>
    </Drawer>
  );
}

/** Settings → Consents and retention. */
export function RetentionForm({ rows, save }: { rows: [string, string][]; save: (rows: [string, string][]) => Promise<Act> }) {
  const { pending, run } = useRun();
  const [open, setOpen] = useState(false);
  const [r, setR] = useState(rows);
  if (!open)
    return (
      <button type="button" style={editLink} onClick={() => setOpen(true)}>
        Edit retention →
      </button>
    );
  return (
    <form
      className={a.form}
      style={{ borderTop: "1px solid var(--grey-200)" }}
      onSubmit={(e) => {
        e.preventDefault();
        run(() => save(r), () => setOpen(false));
      }}
    >
      {r.map(([k, v], i) => (
        <label key={i} style={fieldLabel}>
          {k}
          <input value={v} onChange={(e) => setR(r.map((x, j) => (j === i ? [x[0], e.target.value] : x)))} style={input} />
        </label>
      ))}
      <div style={{ display: "flex", gap: 6 }}>
        <Button variant="ink" size="sm" type="submit" disabled={pending}>
          SAVE
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
          CANCEL
        </Button>
      </div>
    </form>
  );
}
