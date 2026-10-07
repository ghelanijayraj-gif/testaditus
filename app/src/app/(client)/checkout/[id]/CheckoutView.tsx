"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ds";
import { useToast } from "@/components/ui/Toast";
import { TEAM_WHATSAPP } from "@/lib/assessment/next";
import s from "@/components/client/plan/plan.module.css";
import { payCheckout } from "./actions";

/** 06 A. Checkout (public site look; simulated Shopify). */
export function CheckoutView(p: { id: string; title: string; lead: string; item: string; price: string; city: string; pin: string; mumbai: boolean; offerInPerson: boolean; paid: boolean }) {
  const [addIP, setAddIP] = useState(true);
  const [pending, start] = useTransition();
  const toast = useToast();
  const lines: [string, string][] = [[p.item, p.price]];
  if (p.offerInPerson && addIP) lines.push(["In person session", "₹X,XXX"]);
  lines.push(["Total", lines.length > 1 ? "₹XX,XXX" : p.price]);
  const pay = () =>
    start(async () => {
      const r = await payCheckout(p.id, p.offerInPerson && addIP);
      if (r?.error) toast(r.error);
    });
  return (
    <main className={s.main} style={{ maxWidth: 1080, paddingBottom: 80, display: "flex", flexDirection: "column", gap: 20 }}>
      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--grey-600)" }}>aditus.in · checkout</span>
      {p.offerInPerson && (
        <div style={{ background: "var(--ice)", padding: "16px 18px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
          <span style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            <b style={{ font: "600 17px var(--font-sans)" }}>You’re near our centres. We recommend starting with an in person session.</b>
            <span style={{ font: "400 14px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>Hands on measures at TIC Kandivali or Samyah Borivali, plus a trial training. Paid, optional.</span>
          </span>
          <Button variant="outline" size="sm" onClick={() => setAddIP((x) => !x)} aria-label={addIP ? "Remove in person session" : "Add in person session"}>
            {addIP ? "✓ ADDED" : "+ ADD TO ORDER"}
          </Button>
        </div>
      )}
      <div className={s.two}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <h1 className={s.h1}>{p.title}</h1>
          <span className={s.lead}>{p.lead}</span>
          <div style={{ border: "1px solid var(--grey-200)", padding: "12px 14px", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--grey-600)" }}>Location · from your address</span>
            <span style={{ font: "500 14px var(--font-sans)" }}>
              {p.city} {p.pin} ·{" "}
              <a href={TEAM_WHATSAPP} target="_blank" rel="noreferrer">
                Change
              </a>
            </span>
          </div>
          {!p.mumbai && (
            <span style={{ fontSize: 12, color: "var(--grey-700)" }}>
              Visiting Mumbai?{" "}
              <a href={TEAM_WHATSAPP} target="_blank" rel="noreferrer">
                Message the team →
              </a>
            </span>
          )}
        </div>
        <section className={s.aside} aria-label="Order summary" style={{ border: "2px solid var(--ink)", gap: 0 }}>
          <h2 style={{ margin: 0, fontWeight: 400, padding: "12px 16px", borderBottom: "2px solid var(--ink)", fontFamily: "var(--font-display)", fontSize: 16, textTransform: "uppercase" }}>Order summary</h2>
          {lines.map(([k, v]) => (
            <div key={k} style={{ padding: "12px 16px", borderBottom: "1px solid var(--grey-200)", display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ font: "500 14px var(--font-sans)" }}>{k}</span>
              <span style={{ font: "600 14px var(--font-sans)" }}>{v}</span>
            </div>
          ))}
          <div style={{ padding: "14px 16px" }}>
            <Button variant="blue" size="lg" full onClick={pay} disabled={pending}>
              {pending ? "PAYING…" : p.paid ? "CONTINUE →" : "PAY ON SHOPIFY →"}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
