import "server-only";
import type { ClientPlan, LifecycleStage, Product } from "@prisma/client";
import { prisma } from "@/server/db";
import { now, TZ } from "@/lib/clock";

/** 05 lifecycle stage number (1 purchased … 6 plan ended). */
export function stageNum(stage: LifecycleStage) {
  return ({ ASSESSMENT_PURCHASED: 1, ONBOARDING: 2, ASSESSMENT_DAY: 3, REPORT: 4, TRAINING: 5, PLAN_ENDED: 6, GRACE: 6, ACCESS_ENDED: 6 } as const)[stage];
}

/** Read only while the plan has ended (grace period): reading and downloading only. */
export const isReadOnlyStage = (stage: LifecycleStage) => stage === "GRACE" || stage === "PLAN_ENDED" || stage === "ACCESS_ENDED";

/** Calendar day key in IST, e.g. "2026-10-07". */
export const istDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
/** Whole calendar days from today (IST) to `d` (IST). */
export function calendarDaysUntil(d: Date, from = now()) {
  const a = Date.parse(istDay(from) + "T00:00:00Z");
  const b = Date.parse(istDay(d) + "T00:00:00Z");
  return Math.round((b - a) / 86_400_000);
}
/** "Aug 2026" */
export const monthYear = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, month: "short", year: "numeric" }).format(d);

export type PlanStatusLabel = "Active" | "Expiring soon" | "Expired" | "Completed";

/** Brief: Expiring soon when ≤ 7 days or ≤ 2 sessions left. Status is derived from dates and usage. */
export function planStatus(p: Pick<ClientPlan, "endsAt" | "sessionsTotal" | "sessionsUsed" | "status">, at = now()): PlanStatusLabel {
  if (p.status === "COMPLETED" || p.sessionsUsed >= p.sessionsTotal) return "Completed";
  if (p.status === "EXPIRED" || p.endsAt.getTime() < at.getTime()) return "Expired";
  const days = calendarDaysUntil(p.endsAt, at);
  if (days <= 7 || p.sessionsTotal - p.sessionsUsed <= 2) return "Expiring soon";
  return "Active";
}

/** "Personal Training · 12 sessions" */
export function planTitle(p: Pick<ClientPlan, "name" | "sessionsTotal"> & { product?: Pick<Product, "kind"> | null }) {
  if (p.name.includes("·")) return p.name;
  return `${p.name} · ${p.sessionsTotal} ${p.product?.kind === "GROUP_TRAINING" ? "classes" : "sessions"}`;
}

/** The plan the client is on now (active or expiring), else the most recent one. */
export async function currentPlan(clientId: string) {
  const plans = await prisma.clientPlan.findMany({ where: { clientId }, include: { product: true }, orderBy: { startsAt: "desc" } });
  const live = plans.find((p) => { const s = planStatus(p); return s === "Active" || s === "Expiring soon"; });
  return { current: live ?? plans[0] ?? null, plans };
}

/** Placeholder GST: one digit group less than the amount label (₹XX,XXX → ₹X,XXX). */
export function gstLabel(amountLabel: string, amountPaise: number | null | undefined, rate = 18) {
  if (amountPaise != null) {
    const gst = Math.round((amountPaise * rate) / (100 + rate));
    return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(gst / 100));
  }
  if (amountLabel.includes("XX,XXX")) return amountLabel.replace("XX,XXX", "X,XXX");
  if (amountLabel.includes("X,XXX")) return amountLabel.replace("X,XXX", "XXX");
  return amountLabel;
}

export async function contactNumber() {
  const s = await prisma.setting.findUnique({ where: { key: "contact" } });
  const v = (s?.value ?? {}) as { whatsapp?: string };
  return v.whatsapp ?? "+91 98200 41700";
}

/** Mumbai area rules from Settings → `mumbai_area` (cities + PIN prefixes). */
export async function inMumbaiArea(city: string | null | undefined, pin: string | null | undefined) {
  const s = await prisma.setting.findUnique({ where: { key: "mumbai_area" } });
  const v = (s?.value ?? {}) as { cities?: string[]; pinPrefixes?: string[] };
  const c = (city ?? "").toLowerCase();
  const byCity = !!c && (v.cities ?? []).some((x) => c.split(/[,·]/).map((t) => t.trim()).includes(x.toLowerCase()) || c === x.toLowerCase());
  const p = (pin ?? "").replace(/\s/g, "");
  const byPin = !!p && (v.pinPrefixes ?? []).some((x) => p.startsWith(x));
  return byCity || byPin;
}
