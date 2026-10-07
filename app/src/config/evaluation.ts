/**
 * Coach evaluation and the report it produces.
 *
 * This file is the single place to define what a coach evaluates on a client's photos and videos and how it reads in
 * the report. Everything below is a placeholder: rename sections and parameters, change options, add or remove items.
 * The evaluation screen (/staff/evaluate/…), the head coach review and the client report all read from here.
 *
 * Rules:
 * - Keys must be unique within a section and must not change once real evaluations exist (values are stored by key).
 *   Labels, help text, options and order can change any time.
 * - `media` lists which uploads to show next to the section: photo views (front, side, back, left, right…) and/or
 *   "video". Leave it out to show everything.
 * - `report: false` keeps a parameter for internal use only (coach sees it, client report does not).
 * - `scored: true` on a scale or grade counts it towards the section score and the overall score.
 *
 * Parameter types:
 *   scale     1 to `max` (default 5) with labels for the low and high ends
 *   grade     one of a few ordered levels, e.g. Good / Fair / Needs work (first = best)
 *   choice    pick one option
 *   multi     pick any number of options
 *   number    a measured value with a unit; `sides: true` asks for left and right
 *   yesno     yes or no
 *   bodymap   tap body areas on a figure (front and back)
 *   text      one line of text
 *   longtext  a paragraph
 */

export type ParamType = "scale" | "grade" | "choice" | "multi" | "number" | "yesno" | "bodymap" | "text" | "longtext";

export type EvalParam = {
  key: string;
  label: string;
  type: ParamType;
  /** Shown under the label to the coach. */
  help?: string;
  /** Wording for the client report. Defaults to `label`. */
  reportLabel?: string;
  required?: boolean;
  report?: boolean;
  scored?: boolean;
  /** scale */
  max?: number;
  low?: string;
  high?: string;
  /** grade, choice, multi */
  options?: string[];
  /** number */
  unit?: string;
  sides?: boolean;
  min?: number;
  step?: number;
  /** text, longtext */
  placeholder?: string;
};

export type EvalSection = {
  key: string;
  title: string;
  /** One line under the title, for the coach. */
  intro?: string;
  /** Wording for the client report. Defaults to `title`. */
  reportTitle?: string;
  media?: string[];
  params: EvalParam[];
};

export const EVALUATION: EvalSection[] = [
  {
    key: "front",
    title: "Section A · Front view",
    intro: "Placeholder. Evaluate the front photo.",
    media: ["front"],
    params: [
      { key: "a1", label: "Parameter A1 (scale)", type: "scale", max: 5, low: "Low end label", high: "High end label", scored: true, required: true, help: "Placeholder help text for the coach." },
      { key: "a2", label: "Parameter A2 (grade)", type: "grade", options: ["Good", "Fair", "Needs work"], scored: true },
      { key: "a3", label: "Parameter A3 (choice)", type: "choice", options: ["Option 1", "Option 2", "Option 3", "Option 4"] },
      { key: "a4", label: "Parameter A4 (number, left and right)", type: "number", unit: "°", sides: true, step: 0.5 },
    ],
  },
  {
    key: "side",
    title: "Section B · Side view",
    intro: "Placeholder. Evaluate the side photos.",
    media: ["side", "left", "right"],
    params: [
      { key: "b1", label: "Parameter B1 (scale)", type: "scale", max: 5, low: "Low end label", high: "High end label", scored: true },
      { key: "b2", label: "Parameter B2 (multi select)", type: "multi", options: ["Observation 1", "Observation 2", "Observation 3", "Observation 4", "Observation 5"] },
      { key: "b3", label: "Parameter B3 (number)", type: "number", unit: "cm", step: 0.5 },
      { key: "b4", label: "Parameter B4 (yes or no)", type: "yesno" },
    ],
  },
  {
    key: "back",
    title: "Section C · Back view",
    intro: "Placeholder. Evaluate the back photo.",
    media: ["back"],
    params: [
      { key: "c1", label: "Parameter C1 (scale)", type: "scale", max: 5, low: "Low end label", high: "High end label", scored: true },
      { key: "c2", label: "Parameter C2 (grade)", type: "grade", options: ["Good", "Fair", "Needs work"], scored: true },
      { key: "c3", label: "Parameter C3 (body areas)", type: "bodymap", help: "Tap the areas this applies to." },
    ],
  },
  {
    key: "movement",
    title: "Section D · Movement video",
    intro: "Placeholder. Evaluate the uploaded videos.",
    media: ["video"],
    params: [
      { key: "d1", label: "Parameter D1 (scale)", type: "scale", max: 10, low: "Low end label", high: "High end label", scored: true },
      { key: "d2", label: "Parameter D2 (choice)", type: "choice", options: ["Option 1", "Option 2", "Option 3"] },
      { key: "d3", label: "Parameter D3 (short text)", type: "text", placeholder: "Placeholder" },
      { key: "d4", label: "Parameter D4 (internal only)", type: "longtext", report: false, placeholder: "Not shown to the client" },
    ],
  },
];

/** The report built from the evaluation. */
export const REPORT = {
  title: "Assessment report",
  /** Free text the coach writes for the whole report, in this order. */
  summary: [
    { key: "overview", label: "Summary (placeholder)", placeholder: "The big picture in two or three sentences." },
    { key: "startHere", label: "Where to start (placeholder)", placeholder: "What the client should focus on first." },
  ],
  /** Show the overall and section scores (from `scored` parameters). */
  showScores: true,
  /** How many parameters the coach can mark as a priority; priorities lead the report. */
  maxPriorities: 3,
  /** Recommended next step. Empty list hides it. */
  paths: ["Personal training", "Group training", "Either"],
};

// ───────────────────────── helpers (no need to edit below) ─────────────────────────

import { GROUP_NAMES } from "@/components/shared/bodyGeometry";

/** "R:knee" → "Right knee". */
export function areaLabel(k: string) {
  const [side, g] = k.split(":");
  const name = GROUP_NAMES[g] ?? g;
  return (side === "R" ? "Right " : side === "L" ? "Left " : "") + (side === "R" || side === "L" ? name.toLowerCase() : name);
}

export type ParamValue = {
  v?: number | string | string[] | boolean | null;
  /** number with sides */
  l?: number | null;
  r?: number | null;
  note?: string;
  /** MediaAsset ids attached as evidence */
  media?: string[];
  priority?: boolean;
};

export type EvaluationData = {
  values: Record<string, ParamValue>;
  summary: Record<string, string>;
  path?: string | null;
};

export const paramId = (s: EvalSection, p: EvalParam) => `${s.key}.${p.key}`;

export function readEvaluation(raw: unknown): EvaluationData {
  const o = raw && typeof raw === "object" ? (raw as Partial<EvaluationData>) : {};
  return { values: o.values && typeof o.values === "object" ? o.values : {}, summary: o.summary && typeof o.summary === "object" ? o.summary : {}, path: o.path ?? null };
}

export function hasEvaluation(raw: unknown) {
  const e = readEvaluation(raw);
  return Object.keys(e.values).length > 0 || Object.values(e.summary).some(Boolean);
}

export function isAnswered(p: EvalParam, x: ParamValue | undefined) {
  if (!x) return false;
  if (p.type === "number" && p.sides) return x.l != null || x.r != null;
  if (Array.isArray(x.v)) return x.v.length > 0;
  return x.v !== undefined && x.v !== null && x.v !== "";
}

/** 0 to 1 for a scored parameter, null when unanswered. */
export function scoreOf(p: EvalParam, x: ParamValue | undefined): number | null {
  if (!p.scored || !isAnswered(p, x)) return null;
  if (p.type === "scale") return ((x!.v as number) - 1) / ((p.max ?? 5) - 1);
  if (p.type === "grade" && p.options?.length) {
    const i = p.options.indexOf(x!.v as string);
    return i < 0 ? null : p.options.length === 1 ? 1 : 1 - i / (p.options.length - 1);
  }
  return null;
}

const avg = (xs: (number | null)[]) => {
  const n = xs.filter((x): x is number => x !== null);
  return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
};

export function sectionScore(s: EvalSection, e: EvaluationData) {
  return avg(s.params.map((p) => scoreOf(p, e.values[paramId(s, p)])));
}

export function overallScore(e: EvaluationData) {
  return avg(EVALUATION.map((s) => sectionScore(s, e)));
}

export function progress(e: EvaluationData) {
  const all = EVALUATION.flatMap((s) => s.params.map((p) => ({ s, p })));
  const done = all.filter(({ s, p }) => isAnswered(p, e.values[paramId(s, p)])).length;
  const missing = all.filter(({ s, p }) => p.required && !isAnswered(p, e.values[paramId(s, p)])).map(({ s, p }) => `${s.title}: ${p.label}`);
  return { done, total: all.length, missing };
}

/** Value as text for the report and previews. */
export function formatValue(p: EvalParam, x: ParamValue | undefined): string {
  if (!isAnswered(p, x)) return "Not assessed";
  const u = p.unit ? (p.unit === "°" ? "°" : " " + p.unit) : "";
  switch (p.type) {
    case "scale":
      return `${x!.v} of ${p.max ?? 5}`;
    case "number":
      if (p.sides) return [x!.l != null ? `Left ${x!.l}${u}` : null, x!.r != null ? `Right ${x!.r}${u}` : null].filter(Boolean).join(" · ");
      return `${x!.v}${u}`;
    case "yesno":
      return x!.v ? "Yes" : "No";
    case "multi":
      return (x!.v as string[]).join(", ");
    case "bodymap":
      return [...new Set((x!.v as string[]).map(areaLabel))].join(", ");
    default:
      return String(x!.v);
  }
}
