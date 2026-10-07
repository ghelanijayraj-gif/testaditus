"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ds";
import { useToast } from "@/components/ui/Toast";
import { FIELD_TYPES } from "./planConstants";
import { fieldLabel, input, squareBtn, textarea } from "./styles";
import a from "./admin.module.css";

type Act = { toast?: string; error?: string; redirect?: string } | void;
export type Meta = { name: string; purpose: string; type: string; timeEstimate: string; instructions: string; safetyNote: string; availability: string; replacesCapture: boolean };
type Field = { label: string; type: string; map: string; tall: boolean };

const TYPES: [string, string][] = [
  ["FORM", "Form"],
  ["CAPTURE", "Capture"],
  ["SELF_TESTS", "Self tests"],
  ["UPLOAD", "Upload"],
  ["LIVE_VIDEO", "Live video session"],
  ["IN_PERSON", "In person session"],
  ["REVIEW_CALL", "Review call"],
  ["CONNECT_HEALTH", "Connect health data"],
];

/** 12 module builder (`BU`): meta, fields and measure mapping, rules, phone preview. Edits go to the draft version. */
export function ModuleBuilder({ metaRows, meta, fields, rules, ptype, canEdit, actions }: {
  metaRows: [string, string][];
  meta: Meta;
  fields: Field[];
  rules: string[];
  ptype: string;
  canEdit: boolean;
  actions: {
    addField: (type: string) => Promise<Act>;
    removeField: (i: number) => Promise<Act>;
    addRule: (text: string) => Promise<Act>;
    removeRule: (i: number) => Promise<Act>;
    saveMeta: (m: Meta & { type: "FORM"; availability: "ONLINE" }) => Promise<Act>;
  };
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [editMeta, setEditMeta] = useState(false);
  const [m, setM] = useState<Meta>(meta);
  const [rule, setRule] = useState("");
  const run = (fn: () => Promise<Act>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r?.error) return void toast(r.error);
      if (r?.toast) toast(r.toast);
      after?.();
      router.refresh();
    });
  const set = (k: keyof Meta) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setM({ ...m, [k]: e.target.value });

  return (
    <div className={a.build}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
        {!editMeta ? (
          <div style={{ border: "2px solid var(--ink)", display: "flex", flexDirection: "column" }}>
            {metaRows.map(([k, v]) => (
              <div key={k} style={{ padding: "8px 12px", borderBottom: "1px solid var(--grey-200)", display: "grid", gridTemplateColumns: "120px minmax(0,1fr)", gap: 10 }}>
                <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--grey-600)" }}>{k}</span>
                <span style={{ font: "500 13px/1.4 var(--font-sans)" }}>{v}</span>
              </div>
            ))}
            {canEdit && (
              <button type="button" onClick={() => { setM(meta); setEditMeta(true); }} style={{ border: 0, background: "#fff", padding: "8px 12px", textAlign: "left", cursor: "pointer", fontSize: 10, textTransform: "uppercase", color: "var(--blue)", fontFamily: "var(--font-mono)" }}>
                Edit details →
              </button>
            )}
          </div>
        ) : (
          <form
            style={{ border: "2px solid var(--ink)", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}
            onSubmit={(e) => {
              e.preventDefault();
              run(() => actions.saveMeta(m as Meta & { type: "FORM"; availability: "ONLINE" }), () => setEditMeta(false));
            }}
          >
            <label style={fieldLabel}>
              Name
              <input value={m.name} onChange={set("name")} style={input} required />
            </label>
            <label style={fieldLabel}>
              Purpose line shown to the client
              <textarea value={m.purpose} onChange={set("purpose")} style={textarea} required />
            </label>
            <div className={a.row2}>
              <label style={fieldLabel}>
                Type
                <select value={m.type} onChange={set("type")} style={input}>
                  {TYPES.map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label style={fieldLabel}>
                Time
                <input value={m.timeEstimate} onChange={set("timeEstimate")} style={input} required />
              </label>
              <label style={fieldLabel}>
                Availability
                <select value={m.availability} onChange={set("availability")} style={input}>
                  <option value="ONLINE">Online</option>
                  <option value="IN_PERSON">In person</option>
                  <option value="BOTH">Online and in person</option>
                </select>
              </label>
            </div>
            <label style={fieldLabel}>
              Instructions
              <textarea value={m.instructions} onChange={set("instructions")} style={textarea} />
            </label>
            <label style={fieldLabel}>
              Safety note
              <textarea value={m.safetyNote} onChange={set("safetyNote")} style={{ ...textarea, minHeight: 48 }} />
            </label>
            {m.type === "IN_PERSON" && (
              <label style={{ ...fieldLabel, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={m.replacesCapture} onChange={(e) => setM({ ...m, replacesCapture: e.target.checked })} style={{ accentColor: "var(--blue)" }} />
                Replaces Online Capture (default: adds to it)
              </label>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <Button variant="ink" size="sm" type="submit" disabled={pending}>
                SAVE TO DRAFT
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditMeta(false)}>
                CANCEL
              </Button>
            </div>
          </form>
        )}

        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Fields and measure mapping</span>
        {fields.map((f, i) => (
          <div key={i} style={{ border: "1.5px solid var(--ink)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <b style={{ font: "600 14px var(--font-sans)" }}>{f.label}</b>
              <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 9, textTransform: "uppercase", padding: "2px 6px", background: "var(--grey-50)" }}>{f.type}</span>
                {canEdit && (
                  <button type="button" style={{ ...squareBtn, width: 24, height: 24 }} aria-label={`Remove ${f.label}`} disabled={pending} onClick={() => run(() => actions.removeField(i))}>
                    ×
                  </button>
                )}
              </span>
            </span>
            <span style={{ fontSize: 11, color: "var(--blue)" }}>{f.map}</span>
          </div>
        ))}
        {fields.length === 0 && <span style={{ fontSize: 11, color: "var(--grey-600)" }}>No fields yet. Add one below.</span>}
        {canEdit && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {FIELD_TYPES.map(([k, l]) => (
              <button key={k} type="button" disabled={pending} onClick={() => run(() => actions.addField(k))} style={{ height: 26, padding: "0 8px", border: "1px solid var(--grey-300)", background: "#fff", cursor: "pointer", fontSize: 9, textTransform: "uppercase", fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
                + {l}
              </button>
            ))}
          </div>
        )}

        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Rules</span>
        {rules.map((r, i) => (
          <span key={i} style={{ border: "1px solid var(--grey-200)", padding: "8px 12px", font: "500 13px var(--font-sans)", display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            {r}
            {canEdit && (
              <button type="button" style={{ ...squareBtn, width: 24, height: 24 }} aria-label="Remove rule" disabled={pending} onClick={() => run(() => actions.removeRule(i))}>
                ×
              </button>
            )}
          </span>
        ))}
        {rules.length === 0 && <span style={{ fontSize: 11, color: "var(--grey-600)" }}>No automatic rules. Practitioners add it by hand.</span>}
        {canEdit && (
          <form
            style={{ display: "flex", gap: 6 }}
            onSubmit={(e) => {
              e.preventDefault();
              run(() => actions.addRule(rule), () => setRule(""));
            }}
          >
            <input aria-label="New rule" placeholder="Add automatically when city is in the Mumbai area" value={rule} onChange={(e) => setRule(e.target.value)} style={{ ...input, flex: 1, border: "1px solid var(--grey-300)" }} />
            <Button variant="outline" size="sm" type="submit" disabled={pending || !rule.trim()}>
              ADD RULE
            </Button>
          </form>
        )}
      </div>

      <div className={a.side} style={{ alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--grey-600)" }}>Preview as a client · phone</span>
        <div className={a.phone}>
          <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--blue)" }}>{ptype}</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 0.95, textTransform: "uppercase" }}>{meta.name}</span>
          <span style={{ font: "400 13px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>{meta.purpose}</span>
          {fields.map((f, i) => (
            <div key={i} style={{ border: "1.5px solid var(--ink)", padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              <b style={{ font: "600 12px var(--font-sans)" }}>{f.label}</b>
              <span style={{ height: f.tall ? 90 : 30, background: "var(--grey-50)" }} />
            </div>
          ))}
          <span style={{ marginTop: "auto", height: 44, background: "var(--blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, textTransform: "uppercase" }}>Submit →</span>
        </div>
      </div>
    </div>
  );
}
