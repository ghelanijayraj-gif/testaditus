// Shared, pure constants for the Records area (client and server safe).
import type { DocumentType, HealthProvider, SystemKey } from "@prisma/client";

export type SysId = "movement" | "breathwork" | "recovery" | "performance";

export const SYSTEMS: { id: SysId; key: SystemKey; name: string }[] = [
  { id: "movement", key: "MOVEMENT", name: "Movement" },
  { id: "breathwork", key: "BREATH", name: "Breath" },
  { id: "recovery", key: "RECOVERY", name: "Recovery" },
  { id: "performance", key: "PERFORMANCE", name: "Performance" },
];
export const sysByKey = (k: SystemKey | null | undefined) => SYSTEMS.find((s) => s.key === k);
export const sysById = (id: string | null | undefined) => SYSTEMS.find((s) => s.id === id);

/** Health metrics by system (05 §2.6, line 1565). `base/trend/amp` feed the dev series generator. */
export type Metric = { id: string; sys: SysId; name: string; desc: string; unit: string; dec: number; base: number; trend: number; amp: number; via: "Apple Health" | "Apple Watch"; pace?: boolean };
export const METRICS: Metric[] = [
  { id: "steps", sys: "movement", name: "Steps", desc: "daily", unit: "steps", dec: 0, base: 6200, trend: 1800, amp: 900, via: "Apple Health" },
  { id: "active", sys: "movement", name: "Active minutes", desc: "daily", unit: "min", dec: 0, base: 28, trend: 14, amp: 6, via: "Apple Health" },
  { id: "workouts", sys: "movement", name: "Workouts", desc: "per week, rolling", unit: "per week", dec: 1, base: 2.2, trend: 1.1, amp: 0.4, via: "Apple Health" },
  { id: "resp", sys: "breathwork", name: "Respiratory rate", desc: "during sleep", unit: "/min", dec: 1, base: 15.4, trend: -2.6, amp: 0.4, via: "Apple Watch" },
  { id: "spo2", sys: "breathwork", name: "Blood oxygen", desc: "during sleep, where available", unit: "%", dec: 0, base: 96.4, trend: 0.6, amp: 0.4, via: "Apple Watch" },
  { id: "sleep", sys: "recovery", name: "Sleep duration", desc: "nightly", unit: "h", dec: 1, base: 6.1, trend: 0.8, amp: 0.35, via: "Apple Health" },
  { id: "bedc", sys: "recovery", name: "Bedtime consistency", desc: "spread over 7 nights", unit: "h", dec: 1, base: 2.4, trend: -1.1, amp: 0.2, via: "Apple Health" },
  { id: "rhr", sys: "recovery", name: "Resting heart rate", desc: "daily", unit: "bpm", dec: 0, base: 68, trend: -7, amp: 1.2, via: "Apple Watch" },
  { id: "hrv", sys: "recovery", name: "HRV", desc: "overnight average", unit: "ms", dec: 0, base: 38, trend: 12, amp: 3, via: "Apple Watch" },
  { id: "wk2", sys: "performance", name: "Workouts", desc: "per week, rolling", unit: "per week", dec: 1, base: 2.2, trend: 1.1, amp: 0.4, via: "Apple Health" },
  { id: "vo2", sys: "performance", name: "Estimated VO2 max", desc: "from walks and runs", unit: "ml/kg/min", dec: 1, base: 38.2, trend: 2.6, amp: 0.3, via: "Apple Watch" },
  { id: "pace", sys: "performance", name: "Easy run pace", desc: "per km", unit: "/km", dec: 2, base: 7.4, trend: -0.6, amp: 0.12, via: "Apple Watch", pace: true },
];

/** 05 line 1545: v = base + trend·(i/89) + amp·sin(1.7i + seed) + 0.6·amp·sin(0.37i + 2·seed) */
export function seriesValue(m: Pick<Metric, "id" | "base" | "trend" | "amp">, i: number) {
  const seed = m.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0) % 7;
  return m.base + m.trend * (i / 89) + m.amp * Math.sin(i * 1.7 + seed) + m.amp * 0.6 * Math.sin(i * 0.37 + seed * 2);
}

/** Value text: 0 dp with en-IN grouping, pace as m:ss, else fixed decimals. */
export function fmtMetric(m: Pick<Metric, "dec" | "pace">, v: number) {
  if (m.pace) {
    const min = Math.floor(v);
    const sec = Math.round((v - min) * 60);
    return sec === 60 ? `${min + 1}:00` : `${min}:${String(sec).padStart(2, "0")}`;
  }
  return m.dec === 0 ? Math.round(v).toLocaleString("en-IN") : v.toFixed(m.dec);
}

export type SourceDef = { key: string; provider: HealthProvider; name: string; shares: string; types: string[]; metrics: string[] };
export const SOURCES: SourceDef[] = [
  { key: "apple", provider: "APPLE_HEALTH", name: "Apple Health", shares: "Steps, workouts, sleep, heart rate, HRV, respiratory rate, blood oxygen", types: ["Sleep", "Heart rate and HRV", "Activity and workouts"], metrics: METRICS.map((m) => m.id) },
  { key: "connect", provider: "GOOGLE_HEALTH_CONNECT", name: "Google Health Connect", shares: "Steps, sleep, heart rate", types: ["Sleep", "Heart rate", "Activity"], metrics: ["steps", "active", "sleep", "rhr"] },
  { key: "garmin", provider: "GARMIN", name: "Garmin", shares: "Workouts, VO2 max, pace, sleep", types: ["Workouts and pace", "Sleep"], metrics: ["workouts", "wk2", "vo2", "pace", "sleep"] },
  { key: "whoop", provider: "WHOOP", name: "Whoop", shares: "Sleep, HRV, strain", types: ["Sleep", "HRV"], metrics: ["sleep", "hrv"] },
  { key: "oura", provider: "OURA", name: "Oura", shares: "Sleep, HRV, resting heart rate", types: ["Sleep", "Heart rate and HRV"], metrics: ["sleep", "hrv", "rhr"] },
  { key: "scale", provider: "SMART_SCALE", name: "Smart scale", shares: "Weight, body measurements", types: ["Weight"], metrics: [] },
];
export const sourceByProvider = (p: HealthProvider) => SOURCES.find((s) => s.provider === p)!;

/** Data type a metric falls under for the per type "Share with coach" toggles. */
export function metricShareType(metricId: string, provider: HealthProvider) {
  const types = sourceByProvider(provider).types;
  const pick = (...cands: string[]) => cands.find((c) => types.includes(c));
  if (["sleep", "bedc", "resp", "spo2"].includes(metricId)) return pick("Sleep");
  if (["rhr", "hrv"].includes(metricId)) return pick("Heart rate and HRV", "Heart rate", "HRV");
  return pick("Activity and workouts", "Activity", "Workouts and pace");
}

// ── Documents ──
export const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  BLOOD_TEST: "Blood test",
  XRAY: "Scan",
  MRI: "Scan",
  PHYSIO_NOTE: "Physio or doctor notes",
  DOCTOR_NOTE: "Physio or doctor notes",
  ASSESSMENT_REPORT: "Assessment PDF",
  REASSESSMENT_REPORT: "Assessment PDF",
  PROGRESS_PHOTO: "Photos and videos",
  PROGRESS_VIDEO: "Photos and videos",
  INVOICE: "Invoice",
  CONSENT: "Consent",
  OTHER: "Other",
};
/** Type filter pills: [value, label]. */
export const DOC_FILTERS: [string, string][] = [
  ["All", "All"],
  ["Blood test", "Blood tests"],
  ["Scan", "Scans"],
  ["Physio or doctor notes", "Notes"],
  ["Assessment PDF", "Assessment PDFs"],
  ["Photos and videos", "Photos and videos"],
  ["Invoice", "Invoices"],
  ["Consent", "Consents"],
];
/** Upload type pills → stored DocumentType. */
export const UPLOAD_TYPES: [string, DocumentType][] = [
  ["Blood test", "BLOOD_TEST"],
  ["Scan", "XRAY"],
  ["Physio or doctor notes", "PHYSIO_NOTE"],
  ["Other", "OTHER"],
];
export const MAX_UPLOAD_MB = 20;

export const WHATSAPP_DISPLAY = "+91 98200 41700";
export const WHATSAPP_NUMBER = "919820041700";
export const waLink = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
