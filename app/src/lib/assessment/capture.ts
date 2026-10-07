/**
 * Online Capture wizard (02 §A6): 18 steps. Items = the 14 capture steps (photos, videos,
 * self tests); 12 are required. Shared by the wizard (client) and its server actions.
 */
export type CaptureKind = "need" | "perm" | "photo" | "video" | "timer" | "count" | "choice" | "review" | "submit";
export type CaptureStep = { id: string; label: string; kind: CaptureKind; required?: boolean; short?: string; how?: string; testKey?: string; unit?: string; sided?: boolean };

export const CAPTURE_STEPS: CaptureStep[] = [
  { id: "need", label: "Before you start", kind: "need" },
  { id: "perm", label: "Camera", kind: "perm" },
  { id: "front", label: "Front", kind: "photo", required: true, short: "Front", how: "Face the phone. Arms relaxed by your sides, feet hip width." },
  { id: "left", label: "Left side", kind: "photo", required: true, short: "Left", how: "Turn so your left side faces the phone. Look straight ahead." },
  { id: "right", label: "Right side", kind: "photo", required: true, short: "Right", how: "Turn so your right side faces the phone. Look straight ahead." },
  { id: "back", label: "Back", kind: "photo", required: true, short: "Back", how: "Turn your back to the phone. Arms relaxed." },
  { id: "squat", label: "Overhead squat", kind: "video", required: true, short: "Squat", how: "Arms straight overhead, squat as low as is comfortable, three times. Film from the front." },
  { id: "balL", label: "Balance, left", kind: "video", required: true, short: "Bal L", how: "Stand on your left leg, eyes open, hands on hips. Up to 30 seconds." },
  { id: "balR", label: "Balance, right", kind: "video", required: true, short: "Bal R", how: "Stand on your right leg, eyes open, hands on hips. Up to 30 seconds." },
  { id: "bend", label: "Bend forward", kind: "video", required: true, short: "Bend", how: "Feet together, knees straight, reach down slowly. Film from the side." },
  { id: "walk", label: "Walking, optional", kind: "video", short: "Walk", how: "Walk away from the phone and back, at a normal pace." },
  { id: "hold", label: "Breath hold", kind: "timer", required: true, short: "Hold", testKey: "hold", unit: "s", how: "Sit. Breathe in and out normally, then hold your nose. Stop at the first clear urge to breathe." },
  { id: "bpm", label: "Breaths per minute", kind: "count", required: true, short: "Rate", testKey: "rate", unit: "/min", how: "Sit quietly for a minute. Tap + each time you breathe in." },
  { id: "nasal", label: "Nasal breathing", kind: "choice", required: true, short: "Nasal", testKey: "nasal", unit: "", how: "Walk up two flights of stairs at a steady pace, mouth closed. Could you keep it closed?" },
  { id: "bal", label: "Balance time", kind: "timer", required: true, short: "Bal", testKey: "balance", unit: "s", sided: true, how: "Stand on one leg, eyes open, hands on hips. Stop when your foot touches down." },
  { id: "plank", label: "Plank, optional", kind: "timer", short: "Plank", testKey: "plank", unit: "s", how: "Forearms on the floor. Stop when your lower back sags or anything hurts." },
  { id: "review", label: "Review", kind: "review" },
  { id: "submit", label: "Submit", kind: "submit" },
];

export const CAPTURE_ITEMS = CAPTURE_STEPS.filter((s) => !["need", "perm", "review", "submit"].includes(s.kind));
export const CAPTURE_REQUIRED = CAPTURE_ITEMS.filter((s) => s.required).map((s) => s.id);
export const NASAL_CHOICES = ["Yes", "Partly", "Not yet"];
/** Max recording length per video ("REC 08 of XX s"; XX is a coach configured placeholder). */
export const VIDEO_MAX_S = 30;

/** Saved per client in PlanModule.data.capture. */
export type CaptureData = {
  done: string[];
  media: Record<string, string>;
  values: { hold?: number; bpm?: number; nasal?: string; bal?: { L?: number; R?: number }; plank?: number };
  attempts?: Record<string, number>;
  /** Steps a practitioner asked to redo (from RetakeRequest). */
  retake?: string[];
};

export const emptyCapture = (): CaptureData => ({ done: [], media: {}, values: {} });

export const requiredDone = (c: Pick<CaptureData, "done">) => CAPTURE_REQUIRED.filter((id) => c.done.includes(id)).length;

/** Map a practitioner's retake request ("Side view photos", "Right side") to wizard steps. */
export function retakeSteps(text: string): string[] {
  const t = text.toLowerCase();
  const hits = CAPTURE_ITEMS.filter((i) => t.includes(i.label.toLowerCase()) || t.includes(i.id.toLowerCase() + " ")).map((i) => i.id);
  if (hits.length) return hits;
  if (t.includes("side")) return ["left", "right"];
  if (t.includes("photo")) return ["front", "left", "right", "back"];
  if (t.includes("squat")) return ["squat"];
  if (t.includes("balance")) return ["balL", "balR"];
  return [];
}
