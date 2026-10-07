// Intake (03) definitions: shared by the client intake flow, the server actions and the
// staff Intake tab. No "server-only" here: client components import these too.

export type ChipGroup = { q: string; options: string[]; multi: boolean };
export type IntakeSectionDef = {
  /** IntakeSection.key */
  key: string;
  name: string;
  sub: string;
  groups: ChipGroup[];
  text?: { label: string; placeholder: string };
  /** Special bodies. */
  kind?: "concerns" | "injuries";
};

const g = (q: string, options: string[]): ChipGroup => ({ q, options, multi: q === "Pick any" || q === "What you do" });

/** The ten sections, verbatim from 03. Steps 0 to 9. */
export const INTAKE_SECTIONS: IntakeSectionDef[] = [
  {
    key: "goals",
    name: "Goals",
    sub: "What do you want training to help with? Tap any that fit.",
    groups: [g("Pick any", ["Run without knee pain", "Lift overhead", "Play football without niggles", "Carry my kids without a sore back", "Trek in the hills", "Get stronger", "Sleep better"])],
    text: { label: "In your own words, one line", placeholder: "Like: play a full 5 a side game again" },
  },
  {
    key: "activity",
    name: "Current activity",
    sub: "Roughly, in a normal week.",
    groups: [g("Days you move on purpose", ["0", "1", "2", "3", "4", "5", "6", "7"]), g("What you do", ["Walking", "Gym", "Running", "Yoga", "Football", "Cycling", "Nothing yet"])],
  },
  {
    key: "history",
    name: "Training history",
    sub: "Helps us pitch the first sessions right.",
    groups: [g("Have you trained with a coach?", ["Never", "A little", "Yes, for years", "Yes, recently"]), g("Longest you have trained without a break", ["Under 3 months", "3 to 12 months", "Over a year"])],
  },
  { key: "concerns", name: "Movement concerns", sub: "Mark where it bothers you. Skip if nothing does.", groups: [], kind: "concerns" },
  { key: "injuries", name: "Injuries or restrictions", sub: "Anything past or present we should know about.", groups: [], kind: "injuries" },
  {
    key: "sleep",
    name: "Sleep",
    sub: "A rough picture is enough.",
    groups: [g("Hours on a normal night", ["Under 5", "5 to 6", "6 to 7", "7 to 8", "Over 8"]), g("How do you wake up?", ["Tired", "Okay", "Rested"])],
  },
  {
    key: "recovery",
    name: "Recovery",
    sub: "How your body handles hard days.",
    groups: [g("The morning after hard exercise", ["Fine", "A bit sore", "Very sore"]), g("Soreness usually lasts", ["A day", "2 days", "3 days or more"])],
  },
  {
    key: "stress",
    name: "Stress and workload",
    sub: "Training works around your life, not against it.",
    groups: [g("A typical work week feels", ["Light", "Steady", "Heavy", "Very heavy"]), g("Hours sitting on a work day", ["Under 4", "4 to 8", "Over 8"])],
  },
  {
    key: "sport",
    name: "Sport and activities",
    sub: "Anything you play or want to play.",
    groups: [g("Pick any", ["Football", "Badminton", "Cricket", "Running events", "Swimming", "Trekking", "None"]), g("How often", ["Weekly", "Monthly", "Now and then"])],
  },
  {
    key: "better",
    name: "What you want to do better",
    sub: "The one thing that would make this worth it.",
    groups: [g("Pick one", ["Move without pain", "Feel stronger", "Have more energy", "Play my sport better"])],
    text: { label: "Anything else for Jayraj", placeholder: "Optional" },
  },
];

export const SECTION_COUNT = INTAKE_SECTIONS.length; // 10
export const SAFETY_STEP = SECTION_COUNT; // 10
export const AGREEMENT_STEP = SECTION_COUNT + 1; // 11
export const DONE_STEP = SECTION_COUNT + 2; // 12
export const TOTAL_STEPS = SECTION_COUNT + 3; // 13

export const WHEN_CHIPS = ["Stairs", "Squatting", "Running", "Sitting long", "Mornings", "After training"];
export const TREATMENTS: [string, string][] = [
  ["REST", "Rest"],
  ["PHYSIO", "Physio"],
  ["SURGERY", "Surgery"],
  ["INJECTION", "Injection"],
  ["NOTHING", "Nothing"],
];
export const treatmentLabel = (k: string) => TREATMENTS.find(([v]) => v === k)?.[1] ?? k;

export type SafetyItem = { key: string; q: string; cold?: boolean };
export const SAFETY_ITEMS: SafetyItem[] = [
  { key: "surgery", q: "Surgery in the last 12 months" },
  { key: "chest", q: "Chest pain or dizziness when you exert yourself" },
  { key: "heart", q: "A heart or blood pressure condition" },
  { key: "preg", q: "Pregnant, or had a baby in the last 6 months" },
  { key: "meds", q: "Medication that affects how you handle exertion" },
  { key: "knee", q: "Anything else your practitioner should know, like a past injury" },
  { key: "veins", q: "Varicose veins", cold: true },
  { key: "ill", q: "A cold, fever or infection in the last 2 weeks", cold: true },
];
export const safetyItemsFor = (cold: boolean) => SAFETY_ITEMS.filter((i) => cold || !i.cold);

export const AGREEMENT_VERSION = "2026-08";

/**
 * IntakeSection.answers shape written by the client intake:
 *  - chip sections: { groups: { [question]: string[] }, text?: string }
 *  - concerns:      { summary: "Right knee · 5 of 10 · Squatting, Stairs" }
 *  - injuries:      { summary, sides?: { [injuryId]: "Left"|"Right"|"Both" } }
 *  - safety:        { items: { [key]: "yes"|"no" }, notes: { [key]: string } }
 *  - agreement:     { agreed: boolean, photos: boolean, version }
 * Older seed rows may use { picked, text } or free keys; `intakeLines` reads both.
 */
export type IntakeAnswers = {
  groups?: Record<string, string[]>;
  text?: string;
  summary?: string;
  picked?: string[];
  items?: Record<string, "yes" | "no">;
  notes?: Record<string, string>;
  agreed?: boolean;
  photos?: boolean;
  sides?: Record<string, string>;
  [k: string]: unknown;
};

/** Human readable lines for a stored section (staff Intake tab). Never includes safety answers for clients. */
export function intakeLines(key: string, a: IntakeAnswers | null | undefined): { q: string; a: string }[] {
  if (!a) return [];
  const out: { q: string; a: string }[] = [];
  const def = INTAKE_SECTIONS.find((s) => s.key === key);
  if (a.groups) for (const [q, v] of Object.entries(a.groups)) if (v?.length) out.push({ q, a: v.join(", ") });
  if (a.picked?.length && !a.groups) out.push({ q: "Picked", a: a.picked.join(", ") });
  if (a.text) out.push({ q: def?.text?.label ?? "In their words", a: a.text });
  if (a.summary) out.push({ q: "Summary", a: a.summary });
  if (key === "safety" && a.items) {
    for (const it of SAFETY_ITEMS) if (a.items[it.key]) out.push({ q: it.q, a: a.items[it.key] === "yes" ? "Yes" + (a.notes?.[it.key] ? ` · ${a.notes[it.key]}` : "") : "No" });
  }
  if (key === "agreement") {
    out.push({ q: "Assessment agreement", a: a.agreed ? "Agreed" : "Not yet" });
    out.push({ q: "Photos and videos", a: a.photos ? "Yes" : "No" });
  }
  // Legacy free keys from older seed rows.
  for (const [k, v] of Object.entries(a)) {
    if (["groups", "text", "summary", "picked", "items", "notes", "agreed", "photos", "sides", "version"].includes(k)) continue;
    if (v != null && typeof v !== "object") out.push({ q: k, a: String(v) });
  }
  return out;
}
