// Pure helpers shared by the consoles (10 Practitioner Console, head coach review, 11 Photo Review).
// Client safe: no server imports.
import type { Availability, Direction, InputType, MeasureTag, Side, SystemKey } from "@prisma/client";
import { FOCUS_GROUPS, FOCUS_POS, GROUP_NAMES } from "@/components/shared/bodyGeometry";

/** "R:knee" → "Right knee" (server safe copy of BodyMap's helper). */
export function groupLabel(k: string) {
  const [s, g] = k.split(":");
  const name = GROUP_NAMES[g] ?? g;
  return (s === "R" ? "Right " : s === "L" ? "Left " : "") + (s === "C" ? name : name.toLowerCase());
}

export type TestDef = {
  key: string;
  system: SystemKey;
  name: string;
  howTo: string;
  unit: string;
  inputType: InputType;
  direction: Direction;
  tag: MeasureTag;
  availability: Availability;
  onlineTag: MeasureTag | null;
  choices: string[];
  sided: boolean;
  flagDiff: number | null;
  min: number | null;
  max: number | null;
  step: number | null;
};

export type MeasureRow = {
  testKey: string;
  side: Side;
  value: number | null;
  text: string | null;
  notTested: boolean;
  skipReason: string | null;
  priority: boolean;
  observation: string[];
  note: string | null;
  tag?: MeasureTag;
  source?: string;
};

/** One test's captured state, folded from its MeasureValue rows. */
export type TestState = { L?: number; R?: number; v?: number; t?: string; skipped?: string; flag: boolean; obs: string[]; note: string };

export const SYSTEMS: { key: SystemKey; label: string }[] = [
  { key: "MOVEMENT", label: "Movement" },
  { key: "BREATH", label: "Breath" },
  { key: "RECOVERY", label: "Recovery" },
  { key: "PERFORMANCE", label: "Performance" },
];
export const SYS_LABEL: Record<SystemKey, string> = { MOVEMENT: "Movement", BREATH: "Breath", RECOVERY: "Recovery", PERFORMANCE: "Performance" };
export const TAG_LABEL: Record<MeasureTag, string> = { MEASURED: "Measured", OBSERVED: "Observed", SELF_REPORTED: "Self reported" };

/** Fixed observation tags (file 10). */
export const OBS_TAGS = ["Shifts left", "Knee drifts in", "Arch drops", "Holds breath", "Pain", "Guarded"];
/** Squat observations (file 11). */
export const SQUAT_OBS = ["Knees drift in", "Heels lift", "Shifts left", "Trunk tips", "Arch drops right", "Holds breath"];

/** Canonical 0 to 3 squat criteria (file 10 wording, as the spec recommends). */
export const SCORE_CRITERIA: [number, string][] = [
  [3, "Heels down, hips below knees, trunk upright, knees track the toes"],
  [2, "One change: heels lift, or knees drift in, or trunk tips"],
  [1, "Two or more changes"],
  [0, "Pain stops the movement"],
];

export const SKIPS: { code: string; label: string }[] = [
  { code: "declined", label: "Client declined" },
  { code: "pain", label: "Pain today" },
  { code: "equipment", label: "No equipment" },
];

/** Tests outside the 24 test default set (still in the bank, added by toggling them in). */
export const EXTRA_TESTS = ["posture", "ribsUpper", "ribsBack", "bedtime", "run1k"];

export const isLR = (d: TestDef) => d.inputType === "LR_PAIR" || (d.inputType === "STOPWATCH" && d.sided);

/** Effective tag on the online route (spec 10.8 `tagOf`). */
export function tagOf(d: TestDef, online: boolean): string {
  if (online && d.availability === "IN_PERSON") return "Not online";
  if (online && d.tag === "MEASURED" && d.inputType === "LR_PAIR" && d.system === "MOVEMENT") return "Observed";
  return TAG_LABEL[d.tag];
}
/** Tag stored on the captured MeasureValue (the effective tag, not just the definition's). */
export function storedTag(d: TestDef, online: boolean): MeasureTag {
  const t = tagOf(d, online);
  if (t === "Not online") return d.onlineTag ?? "OBSERVED";
  return t === "Observed" ? "OBSERVED" : d.tag;
}

export function foldMeasures(rows: MeasureRow[]): Record<string, TestState> {
  const out: Record<string, TestState> = {};
  for (const r of rows) {
    const s = (out[r.testKey] ??= { flag: false, obs: [], note: "" });
    if (r.notTested) s.skipped = r.skipReason ?? "declined";
    if (r.side === "LEFT" && r.value != null) s.L = r.value;
    else if (r.side === "RIGHT" && r.value != null) s.R = r.value;
    else if (r.side === "NONE") {
      if (r.value != null) s.v = r.value;
      if (r.text != null && r.text !== "") s.t = r.text;
    }
    if (r.priority) s.flag = true;
    for (const o of r.observation) if (!s.obs.includes(o)) s.obs.push(o);
    if (r.note && !s.note) s.note = r.note;
  }
  return out;
}

export const hasValue = (s?: TestState) => !!s && (s.L != null || s.R != null || s.v != null || (s.t != null && s.t !== ""));

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;
const num = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/** Value formatting (spec 10.5 `fmtV`). */
export function fmtV(d: TestDef, s?: TestState): string {
  if (s?.skipped) return "Not tested";
  if (!hasValue(s)) return "·";
  if (isLR(d)) return `L ${s!.L ?? "·"} · R ${s!.R ?? "·"}${d.unit}`;
  if (s!.t != null) return s!.t;
  if (d.inputType === "TIME") return mmss(s!.v!);
  const u = d.unit;
  return `${num(s!.v!)}${!u || u.startsWith("/") ? "" : " "}${u}`;
}

/** File 11 self test formatting: "18 s", "16", "L 24 s · R 11 s", "Skipped". */
export function fmtSelf(d: TestDef, s?: TestState): string {
  if (s?.skipped) return "Skipped";
  if (!hasValue(s)) return "·";
  const u = d.unit && !d.unit.startsWith("/") ? " " + d.unit : "";
  if (isLR(d)) return `L ${s!.L ?? "·"}${u} · R ${s!.R ?? "·"}${u}`;
  if (s!.t != null) return s!.t;
  return `${num(s!.v!)}${u}`;
}

/** Focus key used for body markers and highlights, per test. */
const FOCUS_OF: Record<string, string> = {
  hipIR: "hip", hipER: "hip", squat: "hip", goblet: "hip", sts: "hip", knee: "knee", balance: "balance", foot: "foot", ankle: "calf",
  tspine: "tspine", overhead: "tspine", posture: "tspine", ribs: "ribs", ribsUpper: "ribs", ribsBack: "ribs", pattern: "ribs", hold: "ribs", exhale: "ribs", rate: "nasal", nasal: "nasal",
  sleep: "sleep", bedtime: "sleep", selfrec: "sleep", stress: "neck", rhr: "sleep", plank: "lowback", pushup: "hang", vjump: "jump", run1k: "calf",
};
export const focusOf = (key: string) => FOCUS_OF[key] ?? "hip";

/** Finding marker and body groups from the focus maps (FOCUS_GROUPS / FOCUS_POS). */
export function findingBody(key: string) {
  const f = focusOf(key);
  const pos = FOCUS_POS[f] ?? {};
  const view = pos.front ? "front" : pos.back ? "back" : null;
  const xy = view ? pos[view]! : null;
  return { bodyGroups: FOCUS_GROUPS[f] ?? [], marker: view && xy ? { view, x: xy[0], y: xy[1] } : null };
}

/** Assessment day phases (Assessment.phases). Lines are client facing (shown on 04's tracker). */
export type Phase = { key: string; label: string; state: "PENDING" | "CURRENT" | "DONE" | "NOT_NEEDED"; line: string };
export const DEFAULT_PHASES: Omit<Phase, "state">[] = [
  { key: "checkin", label: "Check in", line: "You are checked in. Your practitioner will come and find you." },
  { key: "conversation", label: "Conversation", line: "Your goals and what you marked in your intake." },
  { key: "movement", label: "Movement", line: "We measure how far each joint moves, left and right, because it changes how your body takes load." },
  { key: "breath", label: "Breath", line: "We time a calm breath hold and watch where your breath goes, because it shows how hard easy effort is for you." },
  { key: "recovery", label: "Recovery", line: "We take your resting heart rate and go over your sleep answers, to set how hard training should be." },
  { key: "performance", label: "Performance", line: "A few strength tests, stopped well before anything hurts, so your plan starts at the right load." },
  { key: "close", label: "Close", line: "Your practitioner tells you what they saw, in plain words, and what happens next." },
];
export const PHASE_OF_SYSTEM: Record<SystemKey, string> = { MOVEMENT: "movement", BREATH: "breath", RECOVERY: "recovery", PERFORMANCE: "performance" };

/** Fixed report sections. Keys are the Report.sections JSON keys. */
export const SECTIONS: { key: string; label: string }[] = [
  { key: "bigPicture", label: "Big Picture" },
  { key: "frontView", label: "Front View" },
  { key: "sideView", label: "Side View" },
  { key: "backView", label: "Back View" },
  { key: "muscleStrategy", label: "Muscle Strategy" },
  { key: "keyObservations", label: "Key Observations" },
  { key: "startHere", label: "Start Here" },
];

export const PATHS: { key: "PERSONAL_TRAINING" | "GROUP_TRAINING" | "EITHER"; label: string; title: string }[] = [
  { key: "PERSONAL_TRAINING", label: "Personal Training", title: "Personal Training." },
  { key: "GROUP_TRAINING", label: "Group Training", title: "Group Training." },
  { key: "EITHER", label: "Either", title: "Personal or Group Training." },
];

/** Retake reasons and the fix sentence (file 11). */
export const RETAKE_REASONS: [string, string][] = [
  ["Feet not in frame", "Step back half a metre."],
  ["Too dark", "Face a window or turn on a light."],
  ["Wrong angle", "Turn a little more to the side."],
  ["Clothing hides the joints", "Shorts and a fitted top, please."],
];
export const retakeMessage = (photo: string, reason: string) => `${photo}: ${reason.toLowerCase()}. ${RETAKE_REASONS.find((r) => r[0] === reason)?.[1] ?? ""}`.trim();
