"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ds";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/Toast";
import { chipBtn, fieldLabel, input, textarea } from "./styles";
import a from "./admin.module.css";

type Act = { toast?: string; error?: string; redirect?: string; secret?: string; uri?: string } | void;

function useRun() {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (fn: () => Promise<Act>, after?: (r: Act) => void) =>
    start(async () => {
      const r = await fn();
      if (r?.error) return void toast(r.error);
      if (r?.toast) toast(r.toast);
      after?.(r);
      if (r?.redirect) router.push(r.redirect);
      else router.refresh();
    });
  return { pending, run, router };
}

/** Billing → access end scheduling: grace and access end dates. */
export function AccessDrawer({ name, unused, grace, access, closeHref, save, canEdit }: { name: string; unused: string; grace: string; access: string; closeHref: string; canEdit: boolean; save: (i: { grace: string; access: string }) => Promise<Act> }) {
  const { pending, run, router } = useRun();
  const [g, setG] = useState(grace);
  const [x, setX] = useState(access);
  const close = () => router.push(closeHref, { scroll: false });
  return (
    <Drawer open title={name} onClose={close}>
      <form
        className={a.form}
        onSubmit={(e) => {
          e.preventDefault();
          run(() => save({ grace: g, access: x }), close);
        }}
      >
        <span style={{ font: "400 13px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>Unused at expiry: {unused}. During the grace period the client can still book their unused sessions. After access ends they keep their export pack only.</span>
        <label style={fieldLabel}>
          Grace ends
          <input type="date" value={g} onChange={(e) => setG(e.target.value)} style={input} disabled={!canEdit} />
        </label>
        <label style={fieldLabel}>
          Access ends
          <input type="date" value={x} onChange={(e) => setX(e.target.value)} style={input} disabled={!canEdit} />
        </label>
        {canEdit ? (
          <Button variant="blue" size="sm" full type="submit" disabled={pending}>
            SAVE DATES
          </Button>
        ) : (
          <span style={{ fontSize: 11, color: "var(--grey-600)" }}>View only. Ask ops or a founder to change these dates.</span>
        )}
      </form>
    </Drawer>
  );
}

/** Team → INVITE STAFF. Shows the authenticator secret once. */
export function InviteDrawer({ centres, closeHref, invite }: { centres: { id: string; name: string }[]; closeHref: string; invite: (i: { name: string; email: string; role: "PRACTITIONER"; title?: string; centres: string[] }) => Promise<Act> }) {
  const { pending, run, router } = useRun();
  const [f, setF] = useState({ name: "", email: "", role: "PRACTITIONER", title: "" });
  const [cs, setCs] = useState<string[]>(centres.map((c) => c.id));
  const [done, setDone] = useState<{ secret: string; uri: string } | null>(null);
  const close = () => router.push(closeHref, { scroll: false });
  return (
    <Drawer open title="Invite staff" onClose={close}>
      {done ? (
        <div className={a.form}>
          <span style={{ font: "600 14px var(--font-sans)" }}>Invite sent to {f.email}.</span>
          <span style={{ font: "400 13px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>Share this authenticator secret with them in person. It is shown once and cannot be read again.</span>
          <code style={{ border: "2px solid var(--ink)", padding: 10, fontSize: 13, wordBreak: "break-all", fontFamily: "var(--font-mono)" }}>{done.secret}</code>
          <span style={{ fontSize: 10, color: "var(--grey-600)", wordBreak: "break-all" }}>{done.uri}</span>
          <Button variant="ink" size="sm" onClick={close}>
            DONE
          </Button>
        </div>
      ) : (
        <form
          className={a.form}
          onSubmit={(e) => {
            e.preventDefault();
            run(() => invite({ ...f, role: f.role as "PRACTITIONER", centres: cs }), (r) => r?.secret && setDone({ secret: r.secret, uri: r.uri ?? "" }));
          }}
        >
          <label style={fieldLabel}>
            Name
            <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={input} />
          </label>
          <label style={fieldLabel}>
            Work email
            <input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} style={input} placeholder="name@aditus.in" />
          </label>
          <label style={fieldLabel}>
            Role
            <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} style={input}>
              <option value="PRACTITIONER">Practitioner</option>
              <option value="HOD">Head of department</option>
              <option value="OPS">Ops admin</option>
              <option value="FINANCE">Finance</option>
              <option value="FOUNDER">Founder</option>
            </select>
          </label>
          <label style={fieldLabel}>
            Title in the console
            <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} style={input} placeholder="Coach" />
          </label>
          <span style={fieldLabel}>Centres</span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {centres.map((c) => {
              const on = cs.includes(c.id);
              return (
                <button key={c.id} type="button" style={chipBtn(on, 30)} aria-pressed={on} onClick={() => setCs(on ? cs.filter((x) => x !== c.id) : [...cs, c.id])}>
                  {c.name}
                </button>
              );
            })}
          </div>
          <Button variant="blue" size="sm" full type="submit" disabled={pending}>
            SEND INVITE
          </Button>
          <span style={{ fontSize: 10, color: "var(--grey-600)" }}>Invite only. They sign in with this email and an authenticator code.</span>
        </form>
      )}
    </Drawer>
  );
}

type StaffForm = { role: string; title: string; segment: string; availability: string; yearsCoaching: string; credentials: string; shownToClients: boolean };

/** Team → founder edits role and the coach profile clients see. */
export function StaffDrawer({ name, initial, closeHref, save }: { name: string; initial: StaffForm; closeHref: string; save: (i: StaffForm & { role: "PRACTITIONER" }) => Promise<Act> }) {
  const { pending, run, router } = useRun();
  const [f, setF] = useState(initial);
  const close = () => router.push(closeHref, { scroll: false });
  const t = (k: keyof StaffForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Drawer open title={name} onClose={close}>
      <form
        className={a.form}
        onSubmit={(e) => {
          e.preventDefault();
          run(() => save({ ...f, role: f.role as "PRACTITIONER" }), close);
        }}
      >
        <label style={fieldLabel}>
          Role
          <select value={f.role} onChange={t("role")} style={input}>
            <option value="FOUNDER">Founder</option>
            <option value="HOD">Head of department</option>
            <option value="PRACTITIONER">Practitioner</option>
            <option value="OPS">Ops admin</option>
            <option value="FINANCE">Finance</option>
          </select>
        </label>
        <label style={fieldLabel}>
          Title
          <input value={f.title} onChange={t("title")} style={input} required />
        </label>
        <label style={fieldLabel}>
          Segment
          <input value={f.segment} onChange={t("segment")} style={input} placeholder="Personal Training" />
        </label>
        <label style={fieldLabel}>
          Availability
          <input value={f.availability} onChange={t("availability")} style={input} />
        </label>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", marginTop: 4 }}>Coach profile · shown to clients</span>
        <label style={fieldLabel}>
          Years coaching
          <input value={f.yearsCoaching} onChange={t("yearsCoaching")} style={input} placeholder="XX years" />
        </label>
        <label style={fieldLabel}>
          Credentials
          <textarea value={f.credentials} onChange={t("credentials")} style={{ ...textarea, minHeight: 56 }} />
        </label>
        <label style={{ ...fieldLabel, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={f.shownToClients} onChange={(e) => setF({ ...f, shownToClients: e.target.checked })} style={{ accentColor: "var(--blue)" }} />
          Show this profile to clients
        </label>
        <Button variant="blue" size="sm" full type="submit" disabled={pending}>
          SAVE
        </Button>
      </form>
    </Drawer>
  );
}
