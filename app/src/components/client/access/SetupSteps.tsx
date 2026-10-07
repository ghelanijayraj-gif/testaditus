"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Label, OptionRow } from "@/components/ds";
import s from "./access.module.css";

type FormState = { error?: string; field?: string } | null;
type Act = (prev: FormState, fd: FormData) => Promise<FormState>;

function ErrorLine({ state }: { state: FormState }) {
  if (!state?.error) return null;
  return (
    <span className={s.error} role="alert">
      {state.error}
    </span>
  );
}

/* ───────────── Setup 1 · Details ───────────── */

export type DetailsInit = { name: string; email: string; mobile: string; dob: string; ecName: string; ecPhone: string; city: string; pin: string; cityFromOrder: boolean };

export function StepDetails({ init, action }: { init: DetailsInit; action: Act }) {
  const [state, run, pending] = useActionState(action, null);
  // Controlled, so a validation error never clears what the client typed.
  const [v, setV] = useState(init);
  const bind = (k: keyof DetailsInit) => ({ name: k, value: String(v[k]), onChange: (e: ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value }) });
  return (
    <form action={run} className={s.fields} style={{ gap: 28 }} noValidate>
      <div className={s.fields}>
        <ErrorLine state={state} />
        <label className={s.field}>
          <span className={s.fieldLabel}>Full name</span>
          <input className={s.input} {...bind("name")} autoComplete="name" required aria-invalid={state?.field === "name"} />
        </label>
        <div className={s.field}>
          <div className={`${s.labelRow} ${s.fieldLabel}`}>
            <span>Email</span>
            <span className={s.labelNote}>From your order · Locked</span>
          </div>
          <div className={s.locked} aria-label="Email, locked">{init.email}</div>
        </div>
        <div className={s.field}>
          <div className={`${s.labelRow} ${s.fieldLabel}`}>
            <label htmlFor="mobile">Mobile</label>
            <span className={s.labelNote}>From your order · You can edit</span>
          </div>
          <div className={s.prefixRow}>
            <span className={s.prefix}>+91</span>
            <input id="mobile" className={s.input} style={{ flex: 1 }} {...bind("mobile")} inputMode="numeric" autoComplete="tel-national" aria-invalid={state?.field === "mobile"} />
          </div>
          <span className={s.helper}>We use this for session reminders on WhatsApp, if you turn them on.</span>
        </div>
        <label className={s.field} style={{ maxWidth: 240 }}>
          <span className={s.fieldLabel}>Date of birth</span>
          <input className={s.input} type="date" {...bind("dob")} autoComplete="bday" aria-invalid={state?.field === "dob"} />
        </label>
        <div className={s.field}>
          <div className={`${s.labelRow} ${s.fieldLabel}`}>
            <span>City and PIN code</span>
            {init.cityFromOrder && <span className={s.labelNote}>From your order · You can edit</span>}
          </div>
          <div className={s.cityPin}>
            <input className={s.input} {...bind("city")} placeholder="City" aria-label="City" autoComplete="address-level2" />
            <input className={s.input} {...bind("pin")} placeholder="PIN code" aria-label="PIN code" inputMode="numeric" maxLength={7} autoComplete="postal-code" aria-invalid={state?.field === "pin"} />
          </div>
          <span className={s.helper}>Tells us whether our centres in Mumbai are near you.</span>
        </div>
        <div className={s.field}>
          <div className={`${s.labelRow} ${s.fieldLabel}`}>
            <span>Emergency contact</span>
            <span className={s.labelNote}>Only used if you are unwell in a session</span>
          </div>
          <div className={s.pair}>
            <input className={s.input} {...bind("ecName")} placeholder="Name and relation" aria-label="Emergency contact name and relation" />
            <input className={s.input} {...bind("ecPhone")} placeholder="+91 mobile" aria-label="Emergency contact mobile" inputMode="tel" />
          </div>
        </div>
      </div>
      <Button type="submit" variant="ink" size="lg" full disabled={pending}>CONTINUE →</Button>
    </form>
  );
}

/* ───────────── Setup 2 · Security ───────────── */

export function StepSecurity({ initial, action }: { initial: "link" | "password"; action: Act }) {
  const [state, run, pending] = useActionState(action, null);
  const [method, setMethod] = useState<"link" | "password">(initial);
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const rules: [string, boolean][] = [
    ["At least 10 characters", pw.length >= 10],
    ["At least one number", /\d/.test(pw)],
  ];
  const blocked = method === "password" && rules.some(([, ok]) => !ok);
  const cards: { k: "link" | "password"; title: string; line: string; simple?: boolean }[] = [
    { k: "link", title: "Always sign in with an email link", line: "We email you a link each time. Nothing to remember.", simple: true },
    { k: "password", title: "Use a password", line: "Sign in with your email and a password you choose." },
  ];
  return (
    <form action={run} className={s.fields} style={{ gap: 28 }}>
      <input type="hidden" name="method" value={method} />
      <ErrorLine state={state} />
      <div className={s.methods} role="radiogroup" aria-label="Sign in method">
        {cards.map((c) => {
          const on = method === c.k;
          return (
            <button key={c.k} type="button" role="radio" aria-checked={on} className={`${s.method} ${on ? s.methodOn : ""}`} onClick={() => setMethod(c.k)}>
              <span className={s.methodTop}>
                <span className={`${s.radio} ${on ? s.radioOn : ""}`}>{on ? "✓" : ""}</span>
                {c.simple && <Label tone="blue">SIMPLER</Label>}
              </span>
              <span className={s.methodTitle}>{c.title}</span>
              <span className={s.methodLine}>{c.line}</span>
            </button>
          );
        })}
      </div>
      {method === "password" && (
        <div className={s.fields} style={{ gap: 14 }}>
          <label className={s.field}>
            <span className={s.fieldLabel}>Choose a password</span>
            <span className={s.pwRow}>
              <input className={s.input} style={{ borderRight: 0, flex: 1 }} type={show ? "text" : "password"} name="password" autoComplete="new-password" placeholder="At least 10 characters" value={pw} onChange={(e) => setPw(e.target.value)} />
              <button type="button" className={s.pwToggle} onClick={() => setShow(!show)} aria-pressed={show}>
                {show ? "Hide" : "Show"}
              </button>
            </span>
          </label>
          <div className={s.rules}>
            {rules.map(([t, ok]) => (
              <span key={t} className={`${s.rule} ${ok ? s.ruleOn : ""}`}>
                {ok ? "✓" : "·"} {t}
              </span>
            ))}
          </div>
        </div>
      )}
      <Button type="submit" variant="ink" size="lg" full disabled={blocked || pending}>CONTINUE →</Button>
    </form>
  );
}

/* ───────────── Setup 3 · Preferences ───────────── */

export type Centre = { slug: string; name: string; desc: string };
export type ConsentDef = { kind: string; label: string; desc: string };

export function StepPreferences({ centres, consents, mobile, init, action }: { centres: Centre[]; consents: ConsentDef[]; mobile: string; init: { centre: string; wa: boolean; given: string[] }; action: Act }) {
  const [state, run, pending] = useActionState(action, null);
  const [centre, setCentre] = useState(init.centre);
  const [wa, setWa] = useState(init.wa);
  const [given, setGiven] = useState<string[]>(init.given);
  return (
    <form action={run} className={s.fields} style={{ gap: 28 }}>
      <input type="hidden" name="centre" value={centre} />
      {wa && <input type="hidden" name="whatsapp" value="on" />}
      {given.map((k) => (
        <input key={k} type="hidden" name="consent" value={k} />
      ))}
      <ErrorLine state={state} />
      <div className={s.field} style={{ gap: 10 }}>
        <span className={s.fieldLabel}>Preferred centre</span>
        <div className={s.ruled} role="radiogroup" aria-label="Preferred centre">
          {centres.map((c) => (
            <OptionRow key={c.slug} label={c.name} desc={c.desc} checked={centre === c.slug} onClick={() => setCentre(c.slug)} />
          ))}
        </div>
      </div>
      <button type="button" role="switch" aria-checked={wa} className={s.toggleRow} onClick={() => setWa(!wa)}>
        <span>
          <span className={s.toggleTitle} style={{ display: "block" }}>WhatsApp updates</span>
          <span className={s.toggleLine} style={{ display: "block" }}>Session reminders and report alerts on +91 {mobile || "your mobile"}.</span>
        </span>
        <span className={`${s.switch} ${wa ? s.switchOn : ""}`}>
          <span className={s.knob} />
        </span>
      </button>
      <div className={s.field} style={{ gap: 10 }}>
        <div className={`${s.labelRow} ${s.fieldLabel}`}>
          <span>Consents</span>
          <span className={s.labelNote}>All optional · Change any time</span>
        </div>
        <div className={s.ruled}>
          {consents.map((c) => (
            <OptionRow key={c.kind} multi label={c.label} desc={c.desc} checked={given.includes(c.kind)} onClick={() => setGiven(given.includes(c.kind) ? given.filter((x) => x !== c.kind) : [...given, c.kind])} />
          ))}
        </div>
      </div>
      <Button type="submit" variant="blue" size="lg" full disabled={pending}>CONTINUE →</Button>
    </form>
  );
}

/* ───────────── Setup 4 · Documents ───────────── */

export type DocRow = { id: string; name: string; typeLabel: string; date: string; state?: "uploading" | "failed"; error?: string };

export function StepDocuments({ initial, finish }: { initial: DocRow[]; finish: () => Promise<void> }) {
  const [files, setFiles] = useState<DocRow[]>(initial);
  const [over, setOver] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const upload = async (list: FileList | File[]) => {
    for (const f of Array.from(list)) {
      const tmp = "tmp" + Math.random();
      setFiles((x) => [...x, { id: tmp, name: f.name, typeLabel: "", date: "", state: "uploading" }]);
      const fd = new FormData();
      fd.append("file", f);
      try {
        const r = await fetch("/setup/upload", { method: "POST", body: fd });
        const j = await r.json();
        setFiles((x) => x.map((row) => (row.id === tmp ? (r.ok ? (j as DocRow) : { ...row, state: "failed", error: j.error ?? "Did not upload" }) : row)));
      } catch {
        setFiles((x) => x.map((row) => (row.id === tmp ? { ...row, state: "failed", error: "The connection dropped. Try again." } : row)));
      }
    }
  };

  return (
    <>
      <button
        type="button"
        className={`${s.drop} ${over ? s.dropOver : ""}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          upload(e.dataTransfer.files);
        }}
      >
        <span className={s.dropTitle}>Drop files here.</span>
        <span className={s.dropLine}>Blood tests, X ray or MRI reports, physio notes. PDF, JPG or PNG up to 25 MB.</span>
        <span className={s.fakeBtn}>BROWSE FILES</span>
      </button>
      <input
        ref={input}
        type="file"
        hidden
        multiple
        accept="application/pdf,image/jpeg,image/png"
        onChange={(e) => {
          if (e.target.files) upload(e.target.files);
          e.target.value = "";
        }}
      />
      {files.length > 0 && (
        <div className={s.ruled} aria-live="polite">
          {files.map((f) => (
            <div key={f.id} className={s.fileRow}>
              <span style={{ minWidth: 0 }}>
                <span className={s.fileName} style={{ display: "block" }}>{f.name}</span>
                <span className={s.fileMeta} style={{ display: "block", color: f.state === "failed" ? "var(--blue)" : undefined }}>
                  {f.state === "failed" ? f.error : f.state === "uploading" ? "Uploading" : `${f.typeLabel} · ${f.date}`}
                </span>
              </span>
              <span className={s.fileState}>{f.state === "failed" ? "Not added" : f.state === "uploading" ? "…" : "✓ Added"}</span>
            </div>
          ))}
        </div>
      )}
      <span className={s.note}>Seen only by you, your coach and the head coach. You can add more later in Documents.</span>
      <div className={s.two}>
        <Button variant="outline" size="lg" full disabled={pending} onClick={() => start(() => finish())}>SKIP FOR NOW</Button>
        <Button variant="blue" size="lg" full disabled={pending || files.some((f) => f.state === "uploading")} onClick={() => start(() => finish())}>FINISH SETUP →</Button>
      </div>
    </>
  );
}

/* ───────────── Done · auto redirect ───────────── */

export function DoneCountdown({ to }: { to: string }) {
  const router = useRouter();
  const [n, setN] = useState(5);
  useEffect(() => {
    if (n <= 1) {
      router.push(to);
      return;
    }
    const t = setTimeout(() => setN((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [n, router, to]);
  return <span className={s.note}>Taking you to Home in {n} s</span>;
}
