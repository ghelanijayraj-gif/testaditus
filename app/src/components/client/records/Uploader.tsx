"use client";

import { useRef, useState } from "react";
import { Button, Pill } from "@/components/ds";
import { useReadOnly } from "@/components/client/readonly";
import { MAX_UPLOAD_MB, UPLOAD_TYPES } from "./catalog";
import { useRun } from "./ui";
import s from "./records.module.css";

const ACCEPT = ["application/pdf", "image/jpeg", "image/png"];
const mb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** 05 §2.7 drop zone + tagging panel. Real drag and drop and file input; the server re-validates. */
export function Uploader({ closed }: { closed: boolean }) {
  const ro = useReadOnly();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("Physio or doctor notes");
  const [date, setDate] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const { run, pending } = useRun();
  const disabled = ro || closed;

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    setError(null);
    if (!ACCEPT.includes(f.type)) {
      setFile(null);
      setError(`${f.name} is not a PDF, JPG or PNG. Choose another file.`);
      return;
    }
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setFile(null);
      setError(`${f.name} is over ${MAX_UPLOAD_MB} MB. Try a smaller file or a photo of each page.`);
      return;
    }
    setFile(f);
  };

  const save = () => {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("type", type);
    fd.set("testDate", date);
    fd.set("link", link);
    const upload = async () => {
      try {
        const res = await fetch("/api/files", { method: "POST", body: fd });
        return (await res.json()) as { toast?: string; error?: string };
      } catch {
        return { error: "Upload failed. Nothing was saved. Check your connection and try again." };
      }
    };
    run(upload, {
      onDone: (r) => {
        if (r?.error) setError(r.error);
        else {
          setFile(null);
          setDate("");
          setLink("");
          setError(null);
        }
      },
    });
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!disabled) pick(e.dataTransfer.files?.[0]);
        }}
        className={s.drop}
        style={{ background: over || file ? "var(--ice)" : undefined, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1 }}
      >
        <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, textTransform: "uppercase" }}>Drop files here.</span>
          <span style={{ font: "400 14px/1.4 var(--font-sans)", color: "var(--grey-700)" }}>
            {closed ? "Uploads are closed now that your plan has ended. You can still read and download everything." : `Blood tests, scans, physio or doctor notes. PDF, JPG or PNG up to ${MAX_UPLOAD_MB} MB.`}
          </span>
        </span>
        <span style={{ height: 44, padding: "0 18px", display: "flex", alignItems: "center", background: "var(--ink)", color: "#fff", fontFamily: "var(--font-display)", fontSize: 12 }}>BROWSE FILES</span>
      </button>
      <input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} aria-label="Choose a file to upload" />

      {error && !file && (
        <div className={s.errorLine} role="alert" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span>{error}</span>
          <Button variant="ink" size="sm" onClick={() => input.current?.click()}>
            TRY AGAIN
          </Button>
        </div>
      )}

      {file && (
        <div style={{ border: "2px solid var(--ink)", boxShadow: "6px 6px 0 var(--blue)", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <span style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <b style={{ font: "600 16px var(--font-sans)", overflowWrap: "anywhere" }}>{file.name}</b>
            <span style={{ fontSize: 11, color: "var(--grey-600)", whiteSpace: "nowrap" }}>{mb(file.size)}</span>
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className={s.fieldLabel}>Type</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role="radiogroup" aria-label="Type">
              {UPLOAD_TYPES.map(([l]) => (
                <Pill key={l} active={type === l} onClick={() => setType(l)} style={{ whiteSpace: "nowrap", flex: "none" }}>
                  {l}
                </Pill>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            <label className={s.field} style={{ maxWidth: 260, flex: "1 1 200px" }}>
              <span className={s.fieldLabel}>Test or visit date</span>
              <input type="date" className={s.input} value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className={s.field} style={{ maxWidth: 260, flex: "1 1 200px" }}>
              <span className={s.fieldLabel}>Linked measure</span>
              <select className={s.input} value={link} onChange={(e) => setLink(e.target.value)}>
                <option value="">Not linked</option>
                <option value="movement">Movement</option>
                <option value="breathwork">Breath</option>
                <option value="recovery">Recovery</option>
                <option value="performance">Performance</option>
              </select>
            </label>
          </div>
          {error && <span className={s.errorLine} role="alert">{error}</span>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Button variant="blue" size="md" onClick={save} disabled={pending}>
              {pending ? "SAVING…" : error ? "TRY AGAIN" : "SAVE FILE"}
            </Button>
            <Button variant="outline" size="md" onClick={() => { setFile(null); setError(null); }} disabled={pending}>
              CANCEL
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
