"use client";

import { useState } from "react";
import { Button, OptionRow } from "@/components/ds";
import { useReadOnly } from "@/components/client/readonly";
import { setCentre, setPassword, setSignInMethod, updateDetails } from "@/server/client/records/actions";
import { useRun } from "./ui";
import s from "./records.module.css";

const head = (title: string, right?: React.ReactNode) => (
  <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }} className={s.rowLine}>
    <b className={s.label}>{title}</b>
    {right}
  </div>
);

type Details = { firstName: string; lastName: string; mobile: string; dob: string; emergencyName: string; emergencyPhone: string; city: string; pin: string };

export function DetailsCard({ rows, details, email }: { rows: [string, string][]; details: Details; email: string }) {
  const ro = useReadOnly();
  const [edit, setEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { run, pending } = useRun();
  const field = (name: keyof Details, label: string, type = "text", extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className={s.field}>
      <span className={s.fieldLabel}>{label}</span>
      <input className={s.input} name={name} type={type} defaultValue={details[name]} {...extra} />
    </label>
  );
  return (
    <div className={s.card}>
      {head(
        "Personal details",
        !edit && !ro ? (
          <button type="button" className={s.blueLink} onClick={() => setEdit(true)}>
            Edit
          </button>
        ) : null,
      )}
      {!edit &&
        rows.map(([k, v]) => (
          <div key={k} style={{ padding: "12px 18px", display: "flex", justifyContent: "space-between", gap: 14 }} className={s.rowLine}>
            <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--grey-600)" }}>{k}</span>
            <span style={{ fontSize: 13, textAlign: "right" }}>{v}</span>
          </div>
        ))}
      {edit && (
        <form
          style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(() => updateDetails(fd), { onDone: (r) => (r?.error ? setError(r.error) : (setError(null), setEdit(false))) });
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))", gap: 14 }}>
            {field("firstName", "First name", "text", { required: true, autoComplete: "given-name" })}
            {field("lastName", "Last name", "text", { required: true, autoComplete: "family-name" })}
          </div>
          <label className={s.field}>
            <span className={s.fieldLabel}>Email · locked</span>
            <input className={s.input} value={email} disabled readOnly />
          </label>
          {field("mobile", "Mobile", "tel", { autoComplete: "tel", placeholder: "+91 98765 43210" })}
          {field("dob", "Date of birth", "date")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))", gap: 14 }}>
            {field("emergencyName", "Emergency contact", "text", { placeholder: "Name, relation" })}
            {field("emergencyPhone", "Their mobile", "tel")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))", gap: 14 }}>
            {field("city", "City", "text", { autoComplete: "address-level2" })}
            {field("pin", "PIN", "text", { inputMode: "numeric", pattern: "\\d{6}", maxLength: 6, autoComplete: "postal-code" })}
          </div>
          <span style={{ fontSize: 11, color: "var(--grey-600)", lineHeight: 1.5 }}>City and PIN decide whether in person sessions are offered to you.</span>
          {error && <span className={s.errorLine} role="alert">{error}</span>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Button type="submit" variant="blue" size="md" disabled={pending}>
              SAVE DETAILS
            </Button>
            <Button variant="outline" size="md" onClick={() => { setEdit(false); setError(null); }} disabled={pending}>
              CANCEL
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export function SignInCard({ method, hasPassword }: { method: "EMAIL_LINK" | "PASSWORD"; hasPassword: boolean }) {
  const ro = useReadOnly();
  const [form, setForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { run, pending } = useRun();
  return (
    <div className={s.card}>
      {head("Sign in method")}
      <OptionRow label="Email link" desc="We email you a link each time you sign in." checked={method === "EMAIL_LINK" && !form} onClick={() => { if (ro) return; setForm(false); if (method !== "EMAIL_LINK") run(() => setSignInMethod("EMAIL_LINK")); }} />
      <OptionRow label="Password" desc="Sign in with your email and a password." checked={method === "PASSWORD" || form} onClick={() => { if (!ro && method !== "PASSWORD") setForm(true); }} />
      {method === "PASSWORD" && !form && !ro && (
        <div style={{ padding: "12px 18px" }}>
          <button type="button" className={s.blueLink} onClick={() => setForm(true)}>
            Change password
          </button>
        </div>
      )}
      {form && (
        <form
          style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(() => setPassword(fd), { onDone: (r) => (r?.error ? setError(r.error) : (setError(null), setForm(false))) });
          }}
        >
          <label className={s.field}>
            <span className={s.fieldLabel}>{hasPassword && method === "PASSWORD" ? "New password" : "Set a password"}</span>
            <input className={s.input} name="password" type="password" minLength={8} required autoComplete="new-password" />
          </label>
          <label className={s.field}>
            <span className={s.fieldLabel}>Type it again</span>
            <input className={s.input} name="confirm" type="password" minLength={8} required autoComplete="new-password" />
          </label>
          <span style={{ fontSize: 11, color: "var(--grey-600)" }}>At least 8 characters.</span>
          {error && <span className={s.errorLine} role="alert">{error}</span>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Button type="submit" variant="blue" size="md" disabled={pending}>
              SAVE PASSWORD
            </Button>
            <Button variant="outline" size="md" onClick={() => { setForm(false); setError(null); }} disabled={pending}>
              CANCEL
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export function CentreCard({ centres, centreId }: { centres: { id: string; name: string; area: string }[]; centreId: string | null }) {
  const ro = useReadOnly();
  const { run } = useRun();
  return (
    <div className={s.card}>
      {head("Preferred centre")}
      {centres.map((c) => (
        <OptionRow key={c.id} label={c.name} desc={c.area} checked={c.id === centreId} onClick={() => !ro && c.id !== centreId && run(() => setCentre(c.id))} />
      ))}
    </div>
  );
}
