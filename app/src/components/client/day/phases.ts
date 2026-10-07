/**
 * Assessment day phases (04 §4.3 today). Shared shape with the Consoles area:
 * `Assessment.phases = [{ key, label, state: PENDING|CURRENT|DONE|NOT_NEEDED, line }]`.
 * Pure module (no server imports) so the seed can reuse it.
 */
export type PhaseState = "PENDING" | "CURRENT" | "DONE" | "NOT_NEEDED";
export type Phase = { key: string; label: string; state: PhaseState; line: string };

export const DEFAULT_PHASES: Omit<Phase, "state">[] = [
  { key: "checkin", label: "Check in", line: "You are checked in." },
  { key: "conversation", label: "Conversation", line: "Your goals, in your own words, and anything that bothers you." },
  { key: "movement", label: "Movement", line: "We measure how far each hip rotates, left and right, because it changes how your knee takes load." },
  { key: "breath", label: "Breath", line: "We time a calm breath hold and watch where your breath goes, because it shows how hard easy effort is for you." },
  { key: "recovery", label: "Recovery", line: "We take your resting heart rate and go over your sleep answers, to set how hard training should be." },
  { key: "performance", label: "Performance", line: "A few strength tests, stopped well before anything hurts, so your plan starts at the right load." },
  { key: "close", label: "Close", line: "Jayraj tells you what he saw, in plain words, and what happens next." },
];

/** Default phases with every phase pending. */
export function defaultPhases(practitioner = "Jayraj"): Phase[] {
  return DEFAULT_PHASES.map((p) => ({ ...p, line: p.line.replace("Jayraj", practitioner), state: "PENDING" as PhaseState }));
}

/** Read `Assessment.phases` defensively (Json column written by another area). */
export function readPhases(raw: unknown): Phase[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p, i) => {
      const def = DEFAULT_PHASES.find((d) => d.key === p.key);
      const st = String(p.state ?? "PENDING").toUpperCase();
      return {
        key: String(p.key ?? `phase${i}`),
        label: String(p.label ?? def?.label ?? p.key ?? ""),
        line: String(p.line ?? def?.line ?? ""),
        state: (["PENDING", "CURRENT", "DONE", "NOT_NEEDED"].includes(st) ? st : "PENDING") as PhaseState,
      };
    });
}

export const allDone = (ps: Phase[]) => ps.length > 0 && ps.every((p) => p.state === "DONE" || p.state === "NOT_NEEDED");
export const started = (ps: Phase[]) => ps.some((p) => p.state !== "PENDING");

/** The phase shown in the "Now" card: the CURRENT one, else the first pending, else the last. */
export function currentPhase(ps: Phase[]): Phase | null {
  return ps.find((p) => p.state === "CURRENT") ?? ps.find((p) => p.state === "PENDING") ?? ps[ps.length - 1] ?? null;
}

/** Staff profiles have no pronoun field yet: the sample staff are "he", anyone else by name. */
const HE = ["Jayraj", "Shimyu", "Sahil", "Arjun"];
/** "Jayraj is on his way." */
export const onTheWay = (name: string) => (HE.includes(name) ? `${name} is on his way.` : `${name} is on the way.`);
/** "He" for the sample staff, else the name. */
export const heOr = (name: string) => (HE.includes(name) ? "He" : name);
