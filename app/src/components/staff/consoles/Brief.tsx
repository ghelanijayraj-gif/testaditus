import { BodyMap } from "@/components/shared/BodyMap";
import type { loadPractitioner } from "@/server/consoles/data";
import { SuggestedTests } from "./SuggestedTests";
import s from "./consoles.module.css";

type D = NonNullable<Awaited<ReturnType<typeof loadPractitioner>>>;

/** 10.4 Brief: client summary from intake, safety flags (staff only), suggested tests. */
export function Brief({ d }: { d: D }) {
  const b = d.brief;
  const injuries = d.injuries.filter(Boolean);
  const facts = [...(injuries.length ? [{ k: "Injuries", v: injuries.join(" · "), docs: undefined }] : []), ...b.facts];
  return (
    <div className={s.briefCols}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        {d.flags.map((f, i) => (
          <div key={i} className={s.flag}>
            <span className={s.kBlue}>Discuss before testing</span>
            <span>{[f.item, f.note].filter(Boolean).join(". ").replace(/\.\./g, ".")}</span>
          </div>
        ))}
        <div className={s.box} style={{ padding: 16, gap: 8 }}>
          <span className={s.kicker}>Goals, in {d.client.first}’s words</span>
          <span style={{ font: "400 18px/1.4 var(--font-sans)" }}>{b.goalText ? `“${b.goalText}”` : "No goals written in intake yet."}</span>
          {b.goalChips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {b.goalChips.map((g) => (
                <span key={g} className={s.chip}>
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={s.box + " " + s.bodyCols} style={{ display: "grid" }}>
          <div style={{ background: "var(--grey-50)", padding: 12, display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 150, aspectRatio: "400/720" }}>
              <BodyMap view="front" selected={b.concerns.map((c) => c.region)} ariaLabel="Concerns marked on the body, front view" />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--grey-200)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Concerns marked</div>
            {b.concerns.length === 0 && <div style={{ padding: "12px 14px", font: "400 14px var(--font-sans)", color: "var(--grey-700)" }}>None marked.</div>}
            {b.concerns.map((c) => (
              <div key={c.region} style={{ padding: "12px 14px", borderBottom: "1px solid var(--grey-200)", display: "flex", flexDirection: "column", gap: 3 }}>
                <b style={{ font: "600 15px var(--font-sans)" }}>
                  {c.name} · {c.v}/10
                </b>
                <span style={{ fontSize: 11, color: "var(--grey-700)" }}>{c.w}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", border: "2px solid var(--ink)" }}>
          {facts.map((f) => (
            <div key={f.k} style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 3, boxShadow: "inset -1px -1px 0 var(--grey-200)" }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>{f.k}</span>
              <span style={{ font: "600 14px/1.35 var(--font-sans)" }}>
                {f.v}
                {f.docs?.map((doc, i) => (
                  <span key={doc.id}>
                    {i > 0 && " · "}
                    <a href={`/api/files/${doc.id}`} target="_blank" rel="noopener">
                      {doc.title}
                    </a>
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
      <SuggestedTests assessmentId={d.a.id} bank={d.bank} initial={d.a.testKeys} why={b.why} online={d.a.online} started={d.a.started} />
    </div>
  );
}
