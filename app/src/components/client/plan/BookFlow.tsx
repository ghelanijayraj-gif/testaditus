"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds";
import { useToast } from "@/components/ui/Toast";
import { useReadOnly } from "@/components/client/readonly";
import { bookInPersonSlot, laterInPerson, payInPerson } from "@/server/client/plan/actions";
import { IN_PERSON_INCLUDES } from "@/lib/assessment/next";
import s from "./plan.module.css";

export type BookStep = "pay" | "centre" | "time" | "booked";
type Centre = { slug: string; name: string; area: string };
type Day = { day: string; slots: { id: string; time: string }[] };
type Summary = { k: string; v: string; href?: string }[];

const STEPS: [BookStep, string][] = [
  ["pay", "Pay"],
  ["centre", "Centre"],
  ["time", "Time"],
  ["booked", "Booked"],
];
const TITLE: Record<BookStep, string> = { pay: "Add an in person session.", centre: "Pick a centre.", time: "Pick a time.", booked: "You’re booked." };

/** 06 G. Add and book: Pay → Centre → Time → Booked. Steps live in the URL (?step=). */
export function BookFlow(p: { step: BookStep; price: string; centres: Centre[]; centre: string; days: Day[]; coach: string; summary: Summary; calendarHref?: string }) {
  const router = useRouter();
  const toast = useToast();
  const ro = useReadOnly();
  const [pending, start] = useTransition();
  const [centre, setCentre] = useState(p.centre);
  const [slot, setSlot] = useState<string | null>(null);
  const idx = STEPS.findIndex(([k]) => k === p.step);
  const centreName = p.centres.find((c) => c.slug === centre)?.name ?? "";

  const run = (fn: () => Promise<{ toast?: string; error?: string; redirect?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.error) toast(r.error);
      else if (r.toast) toast(r.toast);
      if (r.redirect) router.push(r.redirect);
      else router.refresh();
    });

  const back = () => {
    if (p.step === "pay") run(laterInPerson);
    else if (p.step === "centre" || p.step === "booked") router.push("/assessment/plan");
    else router.push(`/assessment/in-person?step=centre&centre=${centre}`);
  };
  const next = () => {
    if (p.step === "pay") run(payInPerson);
    else if (p.step === "centre") router.push(`/assessment/in-person?step=time&centre=${centre}`);
    else if (p.step === "time") {
      if (!slot) return toast("Pick a time first.");
      run(() => bookInPersonSlot(slot));
    } else if (p.calendarHref) {
      window.location.href = p.calendarHref;
      toast("Added to your calendar.");
    }
  };
  const backL = p.step === "pay" ? "LATER" : p.step === "booked" ? "PLAN" : "← BACK";
  const nextL = { pay: "PAY ON SHOPIFY →", centre: "NEXT →", time: "CONFIRM BOOKING →", booked: "ADD TO GOOGLE OR APPLE CALENDAR" }[p.step];

  return (
    <>
      <main className={s.main} style={{ maxWidth: 820, paddingBottom: 120, display: "flex", flexDirection: "column", gap: 18 }}>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", border: "2px solid var(--ink)" }} aria-label="Booking steps">
          {STEPS.map(([k, t], i) => (
            <li key={k} aria-current={i === idx ? "step" : undefined} style={{ padding: 10, fontSize: 10, textTransform: "uppercase", boxShadow: "inset -1px 0 0 var(--grey-200)", background: i === idx ? "var(--ink)" : i < idx ? "var(--ice)" : "#fff", color: i === idx ? "#fff" : "var(--ink)" }}>
              {String(i + 1).padStart(2, "0")} {t}
            </li>
          ))}
        </ol>
        <h1 className={s.h1} style={{ fontSize: "clamp(28px,5vw,44px)" }}>
          {TITLE[p.step]}
        </h1>

        {p.step === "pay" && (
          <>
            <div style={{ border: "2px solid var(--ink)", display: "flex", flexDirection: "column" }}>
              {IN_PERSON_INCLUDES.map(([k, v]) => (
                <div key={k} style={{ padding: "12px 16px", borderBottom: "1px solid var(--grey-200)", display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ font: "500 15px var(--font-sans)" }}>{k}</span>
                  <span style={{ fontSize: 11 }}>{v}</span>
                </div>
              ))}
              <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between" }}>
                <b style={{ font: "600 16px var(--font-sans)" }}>In person session</b>
                <b style={{ font: "600 18px var(--font-sans)" }}>{p.price}</b>
              </div>
            </div>
            <span style={{ font: "400 14px/1.5 var(--font-sans)", color: "var(--grey-700)" }}>You pay on Shopify, then come back here to pick a centre and a time.</span>
          </>
        )}

        {p.step === "centre" && (
          <div className={s.half} role="group" aria-label="Centre">
            {p.centres.map((c) => (
              <button
                key={c.slug}
                type="button"
                aria-pressed={centre === c.slug}
                onClick={() => setCentre(c.slug)}
                className={s.sel}
                style={{ textAlign: "left", border: "2px solid var(--ink)", padding: 16, display: "flex", flexDirection: "column", gap: 4 }}
              >
                <b style={{ font: "600 17px var(--font-sans)" }}>{c.name}</b>
                <span style={{ fontSize: 11 }}>{c.area}</span>
              </button>
            ))}
          </div>
        )}

        {p.step === "time" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {p.days.length === 0 && <span style={{ font: "400 15px/1.5 var(--font-sans)" }}>No times are open at {centreName} right now. Try the other centre, or message the team.</span>}
            {p.days.map((d) => (
              <div key={d.day} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 11, textTransform: "uppercase" }}>{d.day}</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {d.slots.map((t) => (
                    <button key={t.id} type="button" aria-pressed={slot === t.id} aria-label={`${d.day} · ${t.time}`} onClick={() => setSlot(t.id)} className={s.sel} style={{ height: 44, padding: "0 14px", fontSize: 12 }}>
                      {t.time}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <span style={{ fontSize: 11, color: "var(--grey-600)" }}>
              From {p.coach}’s availability at {centreName}.
            </span>
          </div>
        )}

        {p.step === "booked" && (
          <dl style={{ margin: 0, border: "2px solid var(--ink)", display: "flex", flexDirection: "column" }}>
            {p.summary.map((r) => (
              <div key={r.k} style={{ padding: "12px 16px", borderBottom: "1px solid var(--grey-200)", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <dt style={{ fontSize: 10, textTransform: "uppercase", color: "var(--grey-600)" }}>{r.k}</dt>
                <dd style={{ margin: 0, font: "500 14px var(--font-sans)", textAlign: "right" }}>
                  {r.v}
                  {r.href && (
                    <>
                      {" · "}
                      <a href={r.href} target="_blank" rel="noreferrer">
                        directions →
                      </a>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </main>
      <div className={s.bottomBar}>
        <div style={{ width: "100%", maxWidth: 820, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="outline" size="lg" onClick={back} disabled={pending || (ro && p.step === "pay")}>
            {backL}
          </Button>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Button variant="blue" size="lg" full onClick={next} disabled={pending || ro || (p.step === "time" && !slot)}>
              {nextL}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
