import Link from "next/link";
import { Button, ImageSlot, Label } from "@/components/ds";
import { Lock } from "@/components/ui/Lock";
import { getPlanView } from "@/server/client/records/plan";
import { dismissSuggestion, renewPlan, startCheckout } from "@/server/client/records/actions";
import { waLink } from "./catalog";
import { Chip, PageHead, Segments } from "./parts";
import { ActBtn, ActRaw } from "./ui";
import s from "./records.module.css";

const TABS = [
  ["plan", "Plan"],
  ["products", "Products"],
  ["coaches", "Coaches"],
] as const;

const statusTone = (st: string) => (st === "Active" ? "ink" : st === "Expiring soon" ? "ice" : "white") as "ink" | "ice" | "white";

export async function PlanView({ clientId, tab: rawTab }: { clientId: string; tab?: string }) {
  const v = await getPlanView(clientId);
  const tab = TABS.some(([k]) => k === rawTab) ? rawTab! : "plan";
  const full = v.stage >= 5;
  const hello = (about?: string) => waLink(`Hi, this is ${v.clientName}, ${v.clientCode}.${about ? ` ${about}` : ""}`);

  return (
    <div className={s.page} style={{ maxWidth: 1120 }}>
      <PageHead
        kicker={v.kicker}
        title={v.title}
        right={
          full ? (
            <nav className={s.tabs} aria-label="My plan">
              {TABS.map(([k, l]) => (
                <Link key={k} href={k === "plan" ? "/plan" : `/plan?tab=${k}`} scroll={false} className={`${s.tab} ${tab === k ? s.tabOn : ""}`} aria-current={tab === k ? "page" : undefined}>
                  {l}
                </Link>
              ))}
            </nav>
          ) : null
        }
      />

      {v.stage < 4 && (
        <div className={s.card} style={{ padding: "clamp(20px,3vw,32px)", gap: 12, maxWidth: 640 }}>
          <Lock size={12} />
          <span className={s.display24}>My plan opens after your report.</span>
          <span className={s.body}>Your practitioner recommends a path once your assessment is reviewed. Then you choose a plan here.</span>
        </div>
      )}

      {v.stage === 4 && (
        <>
          <span style={{ font: "400 17px/1.45 var(--font-sans)", maxWidth: 680, color: "var(--grey-700)" }}>{v.chooseLine}</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: 12 }}>
            {v.choices.map((p) => (
              <div key={p.slug} style={{ border: "2px solid var(--ink)", padding: 18, display: "flex", flexDirection: "column", gap: 10, background: p.rec ? "var(--ice)" : "#fff", boxShadow: p.rec ? "6px 6px 0 #006DE0" : "none" }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>{p.kind}</span>
                  {p.rec && <Label tone="blue">RECOMMENDED</Label>}
                </span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 0.92, textTransform: "uppercase" }}>{p.name}</span>
                <span style={{ fontSize: 12, color: "var(--grey-700)" }}>{p.meta}</span>
                <span style={{ font: "600 22px var(--font-sans)" }}>{p.price}</span>
                <ActBtn action={startCheckout.bind(null, p.slug, "training_plan")} variant={p.rec ? "blue" : "outline"} size="md" full>
                  START TRAINING →
                </ActBtn>
              </div>
            ))}
          </div>
        </>
      )}

      {full && tab === "plan" && (
        <>
          {v.planCard ? (
            <div className={s.card}>
              <div style={{ padding: 18, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }} className={s.rowLine}>
                <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className={s.display24}>{v.planCard.title}</span>
                  <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--grey-700)" }}>{v.planCard.coachLine}</span>
                </span>
                <Chip tone={statusTone(v.planCard.status)}>{v.planCard.status}</Chip>
              </div>
              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }} className={s.rowLine}>
                <Segments used={v.planCard.used} total={v.planCard.total} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 12 }}>
                  {v.planCard.facts.map(([k, val]) => (
                    <span key={k} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span className={s.meta}>{k}</span>
                      <b style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 20 }}>{val}</b>
                    </span>
                  ))}
                </div>
                <span style={{ font: "600 15px/1.4 var(--font-sans)" }}>{v.planCard.rule}</span>
              </div>
              <div style={{ padding: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 14 }} className={s.rowLine}>
                {v.planCard.summary.map(([k, val]) => (
                  <span key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span className={s.meta}>{k}</span>
                    <span style={{ font: "600 15px/1.4 var(--font-sans)" }}>{val}</span>
                  </span>
                ))}
                {v.planCard.focus.length > 0 && (
                  <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span className={s.meta}>Focus areas</span>
                    <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {v.planCard.focus.map((f) => (
                        <Link key={f.n} href={f.href} className={s.focusBtn}>
                          {f.n} {f.title}
                        </Link>
                      ))}
                    </span>
                  </span>
                )}
              </div>
              <div style={{ padding: "14px 18px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, background: "var(--grey-50)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--grey-700)" }}>
                  <Lock size={12} />
                  Your coach manages your program details.
                </span>
                <ActBtn action={renewPlan} variant="blue" size="sm">
                  RENEW PLAN →
                </ActBtn>
              </div>
            </div>
          ) : (
            <div className={s.card} style={{ padding: "clamp(20px,3vw,32px)", gap: 12, maxWidth: 640 }}>
              <span className={s.display24}>No plan yet.</span>
              <span className={s.body}>Your plans appear here once you start training.</span>
            </div>
          )}
          {v.past.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <b className={s.label}>Past plans</b>
              <div className={s.card}>
                {v.past.map((p) => (
                  <div key={p.t + p.d} style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", gap: 12 }} className={s.rowLine}>
                    <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ font: "600 15px var(--font-sans)" }}>{p.t}</span>
                      <span className={s.meta}>{p.d}</span>
                    </span>
                    <span style={{ fontSize: 10, textTransform: "uppercase", padding: "3px 7px", boxShadow: "inset 0 0 0 1.5px var(--grey-400)", height: "fit-content", whiteSpace: "nowrap" }}>{p.s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {full && tab === "products" && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <b className={s.label}>In use</b>
            <div className={s.card}>
              {v.inUse.map((u) => (
                <div key={u.t} className={s.list} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                  <span style={{ font: "600 15px var(--font-sans)" }}>{u.t}</span>
                  <span style={{ fontSize: 10, textTransform: "uppercase", padding: "3px 7px", background: u.s === "Active" ? "var(--ink)" : "#fff", color: u.s === "Active" ? "#fff" : "var(--ink)", boxShadow: "inset 0 0 0 1.5px var(--ink)", whiteSpace: "nowrap" }}>{u.s}</span>
                  <span style={{ fontSize: 11, color: "var(--grey-700)" }}>{u.d}</span>
                </div>
              ))}
              {v.inUse.length === 0 && <p style={{ margin: 0, padding: 18, font: "400 15px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>Nothing in use right now.</p>}
            </div>
          </div>
          {v.suggestions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
                <b className={s.label}>Suggested for you</b>
                <span className={s.meta}>Based on your assessment · at most two</span>
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 12 }}>
                {v.suggestions.map((sg) => (
                  <div key={sg.id} style={{ border: "1px solid var(--grey-300)", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                    <span style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ font: "600 16px var(--font-sans)" }}>{sg.title}</span>
                      <ActRaw action={dismissSuggestion.bind(null, sg.id)} title="Dismiss" label={`Dismiss ${sg.title}`} style={{ border: 0, background: "none", cursor: "pointer", fontSize: 18, width: 32, height: 32, margin: "-6px -8px 0 0", flex: "none", color: "var(--ink)" }}>
                        ×
                      </ActRaw>
                    </span>
                    <span style={{ font: "400 14px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>{sg.why}</span>
                    {sg.meta && <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--grey-600)" }}>{sg.meta}</span>}
                    <a href={hello(`I would like to ask ${v.planCoachName} about ${sg.title}.`)} target="_blank" rel="noreferrer" className={s.link}>
                      Ask {v.planCoachName} about it →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {full && tab === "coaches" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 16 }}>
          {v.coaches.map((co) => (
            <div key={co.id} style={{ border: "2px solid var(--ink)", display: "grid", gridTemplateColumns: "110px minmax(0,1fr)" }}>
              <div style={{ borderRight: "2px solid var(--ink)", minHeight: 150 }}>
                <ImageSlot caption={`PHOTO: ${co.name.toUpperCase()}`} src={co.photo ?? undefined} />
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 22, textTransform: "uppercase" }}>{co.name}</span>
                <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--blue)" }}>{co.role}</span>
                <span style={{ font: "400 13px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>{co.creds}</span>
                <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--grey-600)" }}>{co.meta}</span>
                <div style={{ marginTop: 6 }}>
                  <Button variant="outline" size="sm" href={hello(`A message for Coach ${co.firstName}.`)}>
                    MESSAGE →
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {v.coaches.length === 0 && <p style={{ margin: 0, font: "400 15px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>Your coaches appear here once your plan starts.</p>}
        </div>
      )}
    </div>
  );
}
