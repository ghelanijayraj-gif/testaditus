/**
 * Measure formatting, status and change (05 §2.3, prototype lines 1377–1393).
 * Pure functions shared by the Assessment page, Compare, reports and the reveal walkthrough.
 */

import { dateLong, dateShort, dayLabel } from "./format";

export type SysId = "movement" | "breathwork" | "recovery" | "performance";
export type TagLabel = "Measured" | "Observed" | "Self reported";
export type SideKey = "L" | "R";
export type Pair = { L: number | null; R: number | null };
/** A measure value: scalar (number, category index, or seconds for times), a left/right pair, or not tested. */
export type Val = number | Pair | null;

export type MeasureDef = {
  key: string;
  sys: SysId;
  name: string;
  /** Display unit including its leading space where needed: "°", " s", " cm", "/10". */
  unit: string;
  how: string;
  tag: TagLabel;
  dir: "higher" | "lower";
  sides: boolean;
  focus: SideKey;
  min?: number;
  max: number;
  /** Categorical labels, index = value (worst to best). */
  cats?: string[];
  criteria?: string;
  isTime?: boolean;
  view?: "front" | "back";
  groups: string[];
  /** Breath gauge label (Upper ribs, Lower ribs, Back). */
  gauge?: string;
};

/** up Improved · same Unchanged · down Lower than baseline · new Not tested at baseline · none no retest · nc different method. */
export type Status = "up" | "same" | "down" | "new" | "none" | "nc";

export const SYSTEMS: [SysId, string][] = [
  ["movement", "Movement"],
  ["breathwork", "Breath"],
  ["recovery", "Recovery"],
  ["performance", "Performance"],
];
export const sysName = (s: SysId) => SYSTEMS.find((x) => x[0] === s)?.[1] ?? s;

/** DB unit ("s", "cm", "°", "/10") → display unit (" s", " cm", "°", "/10"). */
export const displayUnit = (u: string | null | undefined) => {
  const t = (u ?? "").trim();
  if (!t || t === "min:sec") return "";
  return /^[a-z]/i.test(t) ? " " + t : t;
};

const isPair = (v: Val): v is Pair => v != null && typeof v === "object";

/** Number without a trailing .0 (2.0 → "2", 3.5 → "3.5"). */
export function n1(v: number) {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** One value with its unit: "22°", "16 s", "1 of 3", "6:40"; missing "·". */
export function f1(m: Pick<MeasureDef, "cats" | "isTime" | "unit">, v: number | null | undefined) {
  if (v == null) return "·";
  if (m.cats) return m.cats[v] ?? String(v);
  if (m.isTime) return Math.floor(v / 60) + ":" + String(Math.round(v % 60)).padStart(2, "0");
  return n1(v) + m.unit;
}

/** Value text: "L 38° · R 22°", a category, a time, a display text (bedtime), or null when not tested. */
export function vt(m: MeasureDef, v: Val, text?: string | null) {
  if (v == null || (isPair(v) && v.L == null && v.R == null)) return null;
  if (isPair(v)) return "L " + f1(m, v.L) + " · R " + f1(m, v.R);
  if (text && !m.cats) return text;
  return f1(m, v);
}

/** Focus side (two sided) or the scalar. */
export function pick(m: Pick<MeasureDef, "sides" | "focus">, v: Val): number | null {
  if (v == null) return null;
  if (isPair(v)) return m.sides ? v[m.focus] : (v.R ?? v.L);
  return v;
}

export function status(m: MeasureDef, b: Val, r: Val, comparable = true): Status {
  const bv = pick(m, b),
    rv = pick(m, r);
  if (bv == null) return "new";
  if (rv == null) return "none";
  if (!comparable) return "nc";
  if (rv === bv) return "same";
  return (m.dir === "lower" ? rv < bv : rv > bv) ? "up" : "down";
}

/** "+12°", "4 points lower", "35 s faster", "R No change"; side prefix for two sided measures. */
export function change(m: MeasureDef, b: Val, r: Val) {
  const bv = pick(m, b),
    rv = pick(m, r);
  if (bv == null || rv == null) return "";
  if (m.cats) return (m.cats[bv] ?? bv) + " → " + (m.cats[rv] ?? rv);
  const d = Math.round((rv - bv) * 10) / 10,
    a = n1(Math.abs(d)),
    side = m.sides ? m.focus + " " : "";
  if (d === 0) return side + "No change";
  if (m.isTime) return side + a + " s " + (d < 0 ? "faster" : "slower");
  const u = m.unit === "/10" ? (Math.abs(d) === 1 ? " point" : " points") : m.unit;
  return side + (d > 0 ? "+" + a + u : a + u + " lower");
}

/** Compare list line: "22° → 34° · +12°", "1 of 3 → 2 of 3", "Now 60 s". */
export function compareText(m: MeasureDef, b: Val, r: Val, st: Status, reText?: string | null) {
  if (st === "new") return "Now " + (vt(m, r, reText) ?? "·");
  if (m.cats) return change(m, b, r);
  return f1(m, pick(m, b)) + " → " + f1(m, pick(m, r)) + " · " + change(m, b, r).replace(/^[LR] /, "");
}

/** Bar fill percentage on the measure's scale, clamped 0..100. */
export function pctNum(m: Pick<MeasureDef, "min" | "max">, v: number | null | undefined) {
  if (v == null) return 0;
  const mn = m.min ?? 0;
  if (m.max === mn) return 0;
  return Math.max(0, Math.min(100, ((v - mn) / (m.max - mn)) * 100));
}
export const pctOf = (m: Pick<MeasureDef, "min" | "max">, v: number | null | undefined) => pctNum(m, v) + "%";

/** "6 improved, 2 unchanged, 1 lower" (new, none and different method are left out). */
export function counts(statuses: Status[]) {
  const c = { up: 0, same: 0, down: 0 };
  for (const s of statuses) if (s === "up" || s === "same" || s === "down") c[s]++;
  return `${c.up} improved, ${c.same} unchanged, ${c.down} lower`;
}

export const STATUS_LABEL: Record<Status, string> = {
  up: "Improved",
  same: "Unchanged",
  down: "Lower than baseline",
  new: "Not tested at baseline",
  none: "",
  nc: "Different method, not directly comparable",
};

export function statusUI(st: Status) {
  switch (st) {
    case "up":
      return { bg: "var(--blue)", fg: "#fff", bd: "none", label: STATUS_LABEL.up };
    case "same":
      return { bg: "#fff", fg: "var(--ink)", bd: "inset 0 0 0 1.5px var(--ink)", label: STATUS_LABEL.same };
    case "down":
      return { bg: "var(--grey-400)", fg: "#fff", bd: "none", label: STATUS_LABEL.down };
    case "new":
      return { bg: "var(--ice)", fg: "var(--ink)", bd: "none", label: STATUS_LABEL.new };
    case "nc":
      return { bg: "var(--grey-50)", fg: "var(--grey-700)", bd: "inset 0 0 0 1px var(--grey-400)", label: STATUS_LABEL.nc };
    default:
      return { bg: "#fff", fg: "var(--grey-600)", bd: "none", label: "" };
  }
}

export function tagUI(t: TagLabel) {
  if (t === "Measured") return { bg: "var(--ink)", fg: "#fff", bd: "none" };
  if (t === "Observed") return { bg: "#fff", fg: "var(--ink)", bd: "inset 0 0 0 1.5px var(--ink)" };
  return { bg: "var(--grey-50)", fg: "var(--grey-700)", bd: "inset 0 0 0 1px var(--grey-400)" };
}

export const TAG_LABEL: Record<"MEASURED" | "OBSERVED" | "SELF_REPORTED", TagLabel> = {
  MEASURED: "Measured",
  OBSERVED: "Observed",
  SELF_REPORTED: "Self reported",
};

/** Sleep strip bar: bedtime hour (e.g. 23.5 or 0.5) and duration on a 20:00 to 10:00 axis. */
export function nightBar(bed: number, dur: number) {
  const since = bed >= 12 ? bed - 20 : bed + 4;
  return { top: (since / 14) * 100 + "%", h: (dur / 14) * 100 + "%" };
}

export const pad2 = (i: number) => String(i + 1).padStart(2, "0");

// Date labels for results copy. en-GB ICU renders September as "Sept"; the designs use "Sep".
const sep = (s: string) => s.replace(/\bSept\b/g, "Sep");
/** "2 Sep 2026" */
export const dLong = (d: Date) => sep(dateLong(d));
/** "2 Sep" */
export const dShort = (d: Date) => sep(dateShort(d));
/** "Wed 2 Sep" */
export const dDay = (d: Date) => sep(dayLabel(d));
