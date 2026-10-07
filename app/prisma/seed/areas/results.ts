import type { Prisma, PrismaClient, MeasureTag, Side, SystemKey } from "@prisma/client";
import { d, type Base } from "../base";

/**
 * Results area seed (05 Assessment and Reports, 04 report reveal). All data fictional.
 * Ananya Iyer: released baseline (05 catalogue, Aarav → Ananya), reassessment window opens 28 Oct.
 * Ishita Rao: baseline + reassessment released (Compare unlocked).
 * Sana Patel: baseline released today 11:02 AM (the reveal sample, 04 copy).
 * Farah Ali: baseline + two reassessments (history selector, one different method). Omar Sheikh: baseline + reassessment.
 */

type V = number | [number, number] | null; // scalar, or [L, R]
type Obs = [string, string][];
type Cat = {
  key: string;
  tag: MeasureTag;
  unit: string;
  how: string;
  base: V;
  re: V;
  re2?: V;
  /** Display text for bedtime range: [baseline, reassessment, reassessment 2]. */
  text?: string[];
  /** Choice measures stored as text (value null). */
  cats?: string[];
  obs: Obs;
  work: string;
  related: string;
  ev: string[];
};

// Evidence refs resolve by document title at runtime (Documents are seeded by the Records area).
const DOC = {
  d1: "title:Blood test, full panel",
  d2: "title:Right knee X ray",
  d3: "title:Baseline assessment report",
  d4: "title:Baseline photos, front, back, side",
  d5: "title:Deep squat video, baseline",
  d6: "title:Breath and rib tape sheet",
};

// 05 measure catalogue (prototype lines 1218–1276), test keys mapped to the test bank.
const CATALOGUE: Cat[] = [
  { key: "hipIR", tag: "MEASURED", unit: "°", how: "Seated, knee at 90°, goniometer", base: [38, 22], re: [39, 34], re2: [41, 36],
    obs: [["Your right hip turns in 22°. The left turns in 38°.", "When the hip cannot turn, the knee and lower back take the rotation instead."], ["You shift your weight to the left at the bottom of a squat.", "The left side carries more load on every rep, every day."], ["The right glute switches on late when you step up.", "The knee drifts in before the hip takes over."]],
    work: "Opening right hip rotation, then strengthening the glutes through the new range.", related: "3 exercises and 1 article", ev: [DOC.d4, DOC.d3] },
  { key: "hipER", tag: "MEASURED", unit: "°", how: "Seated, knee at 90°, goniometer", base: [44, 40], re: [45, 43], re2: [47, 45],
    obs: [["Both hips turn out well. Right is 4° behind the left.", "Turning out is not the limit here. Turning in is."]], work: "Keeping this range while we work on rotation inward.", related: "1 exercise", ev: [] },
  { key: "ankle", tag: "MEASURED", unit: "°", how: "Knee to wall, inclinometer on the shin", base: [41, 33], re: [42, 33], re2: [44, 35],
    obs: [["Your right ankle bends 8° less than the left.", "A stiff ankle sends the knee inward to find depth."], ["Your right heel lifts early in a deep squat.", "Load moves to the front of the knee."]], work: "Lengthening the right calf and loading the ankle through range.", related: "2 exercises", ev: [DOC.d5] },
  { key: "tspine", tag: "MEASURED", unit: "°", how: "Seated, hips fixed, rotation measured at the shoulders", base: [45, 34], re: [46, 47], re2: [48, 49],
    obs: [["Your upper back turns 34° right and 45° left.", "Your lower back makes up the difference when you turn."], ["Your shoulders round forward as you reach overhead.", "That narrows the space the shoulder needs to move freely."]], work: "Mobilising the upper back and strengthening between the shoulder blades.", related: "2 exercises", ev: [DOC.d4] },
  { key: "overhead", tag: "MEASURED", unit: "°", how: "Lying on your back, arm raised, inclinometer", base: [172, 160], re: [174, 168], re2: [180, 176],
    obs: [["Your right arm stops 12° short of the left overhead.", "Pressing and hanging get harder on that side."]], work: "Opening the lats and upper back before any overhead loading.", related: "2 exercises", ev: [] },
  { key: "squat", tag: "OBSERVED", unit: "/3", how: "Bodyweight squat, filmed front and side", base: 1, re: 2, re2: 2,
    obs: [["Hips stay above the knees and shift left.", "Depth comes from the left side only."], ["The right knee caves in on the way up.", "That angle loads the inside of the knee each time you stand."]], work: "Box squat lowered week by week, pain kept under 3.", related: "The squat progression", ev: [DOC.d5] },
  { key: "balance", tag: "MEASURED", unit: "s", how: "Eyes open, hands on hips, best of three", base: [31, 14], re: [40, 38], re2: [42, 40],
    obs: [["Right leg held 14 s. Left held 31 s.", "Every stair, run and trek is single leg balance."], ["Your right arch drops as you lose balance.", "The shin and knee rotate inward with it."]], work: "Strengthening the right foot and leg in single leg positions.", related: "2 exercises", ev: [] },
  { key: "knee", tag: "SELF_REPORTED", unit: "/10", how: "Your own rating at the bottom of a squat, right knee", base: 6, re: 2, re2: 1,
    obs: [["You rated the right knee 6 of 10 at the bottom of a squat.", "Pain here usually follows the hip and foot, not the knee itself."]], work: "Strengthening the quads with a box squat we lower each week.", related: "2 exercises and a client story", ev: [DOC.d2] },
  { key: "hold", tag: "MEASURED", unit: "s", how: "Seated, after a normal exhale, until the first urge", base: 16, re: 24, re2: 25,
    obs: [["Your hold ended at 16 s with a strong urge to breathe.", "A short hold usually means you breathe faster than you need to, all day."]], work: "Building tolerance with slow nasal breathing.", related: "The breathing practice", ev: [DOC.d6] },
  { key: "rate", tag: "MEASURED", unit: "/min", how: "Seated, counted over 2 minutes", base: 16, re: 11, re2: 10,
    obs: [["16 breaths a minute at rest, mostly into the upper chest.", "Neck and shoulder muscles end up doing breathing work all day."]], work: "Moving the breath into the lower ribs.", related: "2 exercises", ev: [DOC.d6] },
  { key: "exhale", tag: "MEASURED", unit: "s", how: "One slow exhale through the nose, seated", base: 6, re: 11, re2: 12,
    obs: [["Your exhale ran out at 6 s.", "A short exhale makes it harder to settle after effort."]], work: "Lengthening the exhale. In 4, out 8.", related: "The breathing practice", ev: [] },
  { key: "ribsUpper", tag: "MEASURED", unit: "cm", how: "Tape at the armpits, full breath in and out", base: 3.5, re: 3.8, re2: 4.8,
    obs: [["Upper ribs expand 3.5 cm.", "This is where most of your breath goes now."]], work: "Keeping the upper ribs quiet so the lower ribs can work.", related: "1 exercise", ev: [DOC.d6] },
  { key: "ribs", tag: "MEASURED", unit: "cm", how: "Tape at the bottom of the sternum, full breath in and out", base: 2.0, re: 3.6, re2: 4.6,
    obs: [["Your lower ribs move 2.0 cm. The upper ribs move 3.5 cm.", "Breathing sits high in the chest, so the neck and shoulders work all day."], ["Lower ribs flare out when you lift your arms.", "Flared ribs pull the lower back into an arch."]], work: "Breathing into the lower ribs with 90 90 breathing, 5 minutes a day.", related: "2 exercises", ev: [DOC.d6] },
  { key: "ribsBack", tag: "MEASURED", unit: "cm", how: "Tape across the lower back ribs, seated, leaning forward", base: 1.2, re: 2.4, re2: 3.4,
    obs: [["Your back ribs barely move, 1.2 cm.", "The back of the ribcage is half your breathing room."]], work: "Crocodile breathing, face down, into the back ribs.", related: "1 exercise", ev: [DOC.d6] },
  { key: "nasal", tag: "OBSERVED", unit: "", how: "Stairs at a steady pace, mouth closed", base: 0, re: 1, re2: 1, cats: ["Not yet", "Partly", "Yes"],
    obs: [["You switched to mouth breathing after two floors.", "Easy effort is costing you more than it should."]], work: "Nose only breathing in every warm up.", related: "Why we breathe through the nose", ev: [] },
  { key: "pattern", tag: "OBSERVED", unit: "", how: "Hands on chest and belly, seated and lying", base: 0, re: 1, re2: 1, cats: ["Chest led", "Belly led", "360 expansion"],
    obs: [["Your chest rises first and most.", "We want the breath to spread all the way around the ribs."]], work: "Moving from chest led to 360 expansion.", related: "2 exercises", ev: [] },
  { key: "sleep", tag: "SELF_REPORTED", unit: "h", how: "Your log for the 7 nights before the assessment", base: 6.1, re: 6.9, re2: 7.9,
    obs: [["You slept just over 6 hours on weeknights.", "Training adapts while you sleep. Short nights slow every other measure."], ["Bedtime moved by up to 2.5 hours across the week.", "A fixed wake time does more than a long lie in."]], work: "A fixed wake time and screens off 30 minutes before bed.", related: "1 article", ev: [] },
  { key: "bedtime", tag: "SELF_REPORTED", unit: "h", how: "Earliest to latest bedtime, same 7 nights", base: 2.5, re: 1.4, re2: 0.4, text: ["23:00 to 01:30", "22:50 to 00:15", "23:00 to 23:25"],
    obs: [["Your bedtime ranged from 23:00 to 01:30.", "A wide range shifts your body clock every night."]], work: "Narrowing bedtime to within one hour.", related: "1 article", ev: [] },
  { key: "selfrec", tag: "SELF_REPORTED", unit: "/10", how: "Your rating the morning after a session", base: 5, re: 7, re2: 8,
    obs: [["You rated recovery 5 of 10 the morning after training.", "It tells us how fast to add load."]], work: "An easy walk the day after each session.", related: "1 article", ev: [] },
  { key: "stress", tag: "SELF_REPORTED", unit: "/10", how: "Your rating for a typical work week", base: 7, re: 6, re2: 5,
    obs: [["You rated work stress 7 of 10.", "High stress weeks need lighter sessions, not missed ones."]], work: "Adjusting load on high stress weeks.", related: "1 article", ev: [] },
  { key: "rhr", tag: "MEASURED", unit: "bpm", how: "Seated, 5 minutes, at the start of your assessment", base: 68, re: 61, re2: 58,
    obs: [["68 bpm seated at the start of your assessment.", "We use it to set how hard your easy work should be."]], work: "Two easy nose only walks a week, 30 minutes.", related: "The walking plan", ev: [DOC.d1] },
  { key: "goblet", tag: "MEASURED", unit: "kg", how: "To a box at 40 cm, pain under 3", base: 12, re: 20, re2: 21,
    obs: [["8 reps at 12 kg before your form changed.", "Strength in the new range is what keeps the knee quiet."]], work: "Adding load as the box comes down.", related: "The squat progression", ev: [DOC.d5] },
  { key: "pushup", tag: "MEASURED", unit: "reps", how: "Full range, hips in line", base: 14, re: 22, re2: 23,
    obs: [["14 push ups before your hips dropped.", "Upper body strength you can use without your lower back."]], work: "Strengthening the trunk in plank positions.", related: "2 exercises", ev: [] },
  { key: "plank", tag: "MEASURED", unit: "s", how: "Forearms, until form breaks", base: 75, re: 68, re2: 71,
    obs: [["You held 75 s before your lower back sagged.", "Trunk endurance protects the back in long days."]], work: "Back in the plan after the reassessment.", related: "1 exercise", ev: [] },
  { key: "vjump", tag: "MEASURED", unit: "cm", how: "Countermovement, best of three", base: 34, re: 39, re2: 41,
    obs: [["34 cm, jumping more from the knees than the hips.", "Power from the hips protects the knees when you land."]], work: "Hip hinge strength and landing practice.", related: "2 exercises", ev: [] },
  { key: "run1k", tag: "MEASURED", unit: "min:sec", how: "Treadmill, 1% incline", base: 400, re: 365, re2: 347,
    obs: [["1 km in 6:40, breathing through the mouth from 300 m.", "Your easy pace is not easy yet."]], work: "Easy nose only running, twice a week.", related: "The walking plan", ev: [] },
  { key: "sts", tag: "MEASURED", unit: "reps", how: "From a 45 cm box, no hands", base: [9, 5], re: [11, 10], re2: [12, 11],
    obs: [["Right leg managed 5. Left managed 9.", "Stairs and getting up off the floor depend on this."]], work: "Strengthening the right leg, step ups and split squats.", related: "2 exercises", ev: [] },
  { key: "carry", tag: "MEASURED", unit: "s", how: "Walking, until grip or posture goes", base: null, re: 60, re2: 63,
    obs: [["Added after the baseline. You carried 2 × 16 kg for 60 s.", "Grip and trunk under load, for bags, kids and luggage."]], work: "Loaded carries twice a week.", related: "1 exercise", ev: [] },
];
const KEYS = CATALOGUE.map((c) => c.key);

const NIGHTS = {
  base: [[23.5, 6.0], [0.5, 5.5], [23.0, 6.5], [1.0, 5.8], [23.3, 6.2], [0.2, 6.8], [1.5, 6.0]],
  re: [[23.0, 7.0], [23.5, 6.8], [22.8, 7.2], [0.2, 6.6], [23.2, 7.0], [23.0, 7.1], [23.8, 6.6]],
  re2: [[23.0, 7.8], [23.1, 8.0], [23.0, 7.9], [23.2, 7.7], [23.0, 8.1], [23.4, 7.9], [23.1, 7.9]],
};

const NOTES = {
  overall: "Your right hip and right leg did most of the catching up. Breath moved well. Plank dropped because we stopped training it, and that is fine for now.",
  MOVEMENT: "The right hip did most of the catching up. The ankle has not moved yet. That is next.",
  BREATH: "The breath has moved down into the lower ribs. Keep the daily practice.",
  RECOVERY: "Sleep is longer and steadier. Stress is still high, so we keep sessions in the morning.",
  PERFORMANCE: "Strength went up across the board. Plank dropped because we stopped training it.",
};

const TOP_05 = { movement: "Your right hip turns in 16° less than the left.", breathwork: "Your breath sits high in the chest at rest.", recovery: "Short and irregular sleep on weeknights.", performance: "Your right leg is weaker than the left." };
const TOP_04 = { movement: "Right hip turns in 14° less than the left.", breathwork: "Breath sits high in the chest at rest.", recovery: "Short sleep on weeknights. Resting heart rate 68 bpm.", performance: "Right leg weaker than the left." };

const BASE_COPY = {
  starting: "You move well forwards and lose control when you turn or stand on your right leg. Your breath sits high in the chest. Sleep is short and irregular on weeknights. Everything starts with the right hip.",
  work: ["Open right hip rotation, then load it.", "Rebuild the right arch and single leg balance.", "Move the breath into the lower ribs.", "A fixed wake time, every day."],
  note: "Your body is not broken. One hip is doing less than the other, and everything else is working around it. That is very trainable.",
};
const RE_COPY = (first: string) => ({
  starting: "Every baseline measure retested in the same order. The right hip and right leg did most of the catching up. Breath moved down into the lower ribs. The right ankle has not moved, and plank dropped.",
  work: ["Right ankle range, the one measure that has not moved.", "Plank and trunk endurance, back in the plan.", "Loading the right leg to match the left."],
  note: `Good work, ${first}. You did the homework that mattered. Next block we load the right side properly and fix the ankle.`,
  pathTitle: "Personal Training.",
  pathReason: "The right side still needs one to one loading. Group Training works once the hip holds under load.",
});
const SANA_COPY = {
  starting: "You move well forwards. You lose control when you turn, or when you stand on your right leg. Your breath sits high in your chest. Sleep is short on weeknights. Everything starts with your right hip.",
  work: ["Opening right hip rotation, then loading it.", "Strengthening the right foot and leg.", "Breathing into the lower ribs.", "A fixed wake time, every day."],
  note: BASE_COPY.note,
};

// Priorities (findings). First four = "What matters most"; Movement ones carry body markers (report 03).
type F = { key: string; system: SystemKey; title: string; groups: string[]; marker?: { view: "front" | "back"; x: number; y: number }[] };
const FINDINGS_05: F[] = [
  { key: "hipIR", system: "MOVEMENT", title: "Right hip rotation", groups: ["R:hipflex", "L:hipflex", "R:glute", "L:glute"], marker: [{ view: "front", x: 176, y: 366 }, { view: "back", x: 228, y: 388 }] },
  { key: "balance", system: "MOVEMENT", title: "Right leg balance", groups: ["R:foot", "L:foot", "R:calf", "L:calf"], marker: [{ view: "front", x: 170, y: 692 }, { view: "back", x: 228, y: 692 }] },
  { key: "ribs", system: "BREATH", title: "Lower rib breathing", groups: [] },
  { key: "sleep", system: "RECOVERY", title: "Weeknight sleep", groups: [] },
  { key: "ankle", system: "MOVEMENT", title: "Ankle dorsiflexion", groups: ["R:shin", "L:shin", "R:foot", "L:foot"], marker: [{ view: "front", x: 170, y: 640 }] },
  { key: "tspine", system: "MOVEMENT", title: "Upper back rotation", groups: ["C:trapback", "L:scap", "R:scap"], marker: [{ view: "back", x: 200, y: 186 }] },
  { key: "knee", system: "MOVEMENT", title: "Knee pain on deep squat", groups: ["R:knee"], marker: [{ view: "front", x: 172, y: 543 }] },
];
// 04 reveal sample: three Movement priorities (hip, balance, knee) with right side regions.
const FINDINGS_04: F[] = [
  { key: "hipIR", system: "MOVEMENT", title: "Right hip rotation", groups: ["R:hipflex", "R:glute"], marker: [{ view: "front", x: 176, y: 366 }, { view: "back", x: 228, y: 388 }] },
  { key: "balance", system: "MOVEMENT", title: "Right leg balance", groups: ["R:foot", "R:calf"], marker: [{ view: "front", x: 170, y: 692 }, { view: "back", x: 228, y: 692 }] },
  { key: "ribs", system: "BREATH", title: "Lower rib breathing", groups: [] },
  { key: "knee", system: "MOVEMENT", title: "Knee on deep squat", groups: ["R:knee"], marker: [{ view: "front", x: 172, y: 543 }] },
];

// Movement test locator data (05 catalogue `view`/`groups`, FG/POS keys in bodyGeometry.ts).
const MOVEMENT_DEFS: Record<string, Partial<Prisma.TestDefinitionUpdateInput>> = {
  hipIR: { bodyView: "front", bodyGroups: ["R:hipflex", "L:hipflex", "R:glute", "L:glute"], focusKey: "hip", scaleMax: 50, focusSide: "RIGHT" },
  hipER: { bodyView: "front", bodyGroups: ["R:hipflex", "L:hipflex"], focusKey: "hip", scaleMax: 60, focusSide: "RIGHT" },
  ankle: { bodyView: "front", bodyGroups: ["R:shin", "L:shin", "R:foot", "L:foot"], focusKey: "foot", scaleMax: 50, focusSide: "RIGHT" },
  tspine: { bodyView: "back", bodyGroups: ["C:trapback", "L:scap", "R:scap"], focusKey: "tspine", scaleMax: 60, focusSide: "RIGHT" },
  overhead: { bodyView: "front", bodyGroups: ["L:delt", "R:delt", "L:lat", "R:lat"], focusKey: "hang", scaleMax: 180, focusSide: "RIGHT" },
  squat: { bodyView: "front", bodyGroups: ["L:quad", "R:quad", "L:glute", "R:glute"], focusKey: "jump", scaleMax: 3, criteria: ["3 heels down, hips below knees, trunk upright · 2 one change · 1 two or more changes · 0 pain"] },
  balance: { bodyView: "front", bodyGroups: ["R:foot", "L:foot", "R:calf", "L:calf"], focusKey: "balance", scaleMax: 60, focusSide: "RIGHT" },
  knee: { bodyView: "front", bodyGroups: ["R:knee"], focusKey: "knee", scaleMax: 10 },
  foot: { bodyView: "front", bodyGroups: ["R:foot", "L:foot"], focusKey: "foot" },
};
const SCALE_MAX: Record<string, number> = { hold: 60, rate: 20, exhale: 20, ribsUpper: 8, ribs: 8, ribsBack: 8, nasal: 2, pattern: 2, sleep: 9, bedtime: 4, selfrec: 10, stress: 10, rhr: 100, goblet: 32, pushup: 40, plank: 180, vjump: 60, run1k: 480, sts: 20 };

async function seedTests(db: PrismaClient) {
  for (const [key, data] of Object.entries(MOVEMENT_DEFS)) await db.testDefinition.updateMany({ where: { key }, data: data as Prisma.TestDefinitionUpdateManyMutationInput });
  for (const [key, scaleMax] of Object.entries(SCALE_MAX)) await db.testDefinition.updateMany({ where: { key }, data: { scaleMax } });
  // 05 treats bedtime range as a number of hours where lower is better.
  await db.testDefinition.updateMany({ where: { key: "bedtime" }, data: { direction: "LOWER_BETTER" } });
  await db.testDefinition.upsert({
    where: { key: "carry" },
    update: {},
    create: { key: "carry", system: "PERFORMANCE", name: "Farmer carry, 2 × 16 kg", howTo: "Two 16 kg bells, walking. Stop when grip or posture goes.", unit: "s", inputType: "STOPWATCH", direction: "HIGHER_BETTER", tag: "MEASURED", availability: "IN_PERSON", scaleMax: 120, order: 29 },
  });
}

const sideRows = (v: V): [Side, number][] => (v == null ? [] : Array.isArray(v) ? [["LEFT", v[0]], ["RIGHT", v[1]]] : [["NONE", v]]);

/** Write one assessment's values from the catalogue column (`base`, `re` or `re2`). */
async function writeValues(db: PrismaClient, clientId: string, assessmentId: string, col: "base" | "re" | "re2", at: Date, by: string, override: Record<string, Partial<Prisma.MeasureValueUncheckedCreateInput>> = {}) {
  const ti = col === "base" ? 0 : col === "re" ? 1 : 2;
  for (const c of CATALOGUE) {
    const v = col === "re2" ? (c.re2 ?? c.re) : c[col];
    for (const [side, n] of sideRows(v)) {
      const isChoice = !!c.cats;
      const data: Prisma.MeasureValueUncheckedCreateInput = {
        clientId,
        assessmentId,
        testKey: c.key,
        side,
        value: isChoice ? null : n,
        text: isChoice ? c.cats![n] : (c.text?.[ti] ?? null),
        unit: c.unit,
        tag: c.tag,
        method: c.how,
        source: c.tag === "SELF_REPORTED" ? "intake" : "console",
        capturedAt: at,
        capturedBy: by,
        ...(override[c.key] ?? {}),
      };
      await db.measureValue.upsert({ where: { assessmentId_testKey_side: { assessmentId, testKey: c.key, side } }, update: data, create: data });
    }
  }
}

async function findOrCreateAssessment(db: PrismaClient, data: Prisma.AssessmentUncheckedCreateInput) {
  const hit = await db.assessment.findFirst({ where: { clientId: data.clientId, kind: data.kind, cycle: data.cycle ?? 1 } });
  if (hit) return db.assessment.update({ where: { id: hit.id }, data });
  return db.assessment.create({ data });
}

async function nights(db: PrismaClient, assessmentId: string, start: string, set: number[][]) {
  await db.sleepNight.deleteMany({ where: { assessmentId } });
  const s = d(start);
  await db.sleepNight.createMany({ data: set.map(([bedtimeHour, durationH], i) => ({ assessmentId, date: new Date(s.getTime() + i * 86_400_000), bedtimeHour, durationH })) });
}

type ReportIn = {
  clientId: string;
  assessmentId: string;
  kind: "BASELINE" | "REASSESSMENT";
  releasedAt: Date;
  authorId: string;
  approverId: string;
  starting: string;
  note: string;
  work: string[];
  path: "PERSONAL_TRAINING" | "GROUP_TRAINING" | "EITHER";
  pathTitle: string;
  pathReason: string;
  systems?: Record<string, string>;
  findings?: F[];
  noteBy?: string;
};

async function writeReport(db: PrismaClient, r: ReportIn) {
  const data: Prisma.ReportUncheckedCreateInput = {
    clientId: r.clientId,
    assessmentId: r.assessmentId,
    kind: r.kind,
    status: "RELEASED",
    authorId: r.authorId,
    approverId: r.approverId,
    startingPoint: r.starting,
    practitionerNote: r.note,
    recommendedPath: r.path,
    pathReason: r.pathReason,
    sections: { workOn: r.work, pathTitle: r.pathTitle, systems: r.systems ?? {}, mattersMost: 4, noteBy: r.noteBy ?? "Jayraj · assessment coach" },
    submittedAt: new Date(r.releasedAt.getTime() - 26 * 3_600_000),
    releasedAt: r.releasedAt,
    createdAt: new Date(r.releasedAt.getTime() - 48 * 3_600_000),
  };
  const hit = await db.report.findFirst({ where: { assessmentId: r.assessmentId } });
  const rep = hit ? await db.report.update({ where: { id: hit.id }, data }) : await db.report.create({ data });
  await db.finding.deleteMany({ where: { reportId: rep.id } });
  for (const [i, f] of (r.findings ?? []).entries()) {
    const c = CATALOGUE.find((x) => x.key === f.key)!;
    await db.finding.create({
      data: { reportId: rep.id, order: i + 1, system: f.system, title: f.title, observed: c.obs[0][0], whyItMatters: c.obs[0][1], workOn: c.work, related: [c.related], bodyGroups: f.groups, marker: f.marker ?? undefined, measureKeys: [f.key] },
    });
  }
  return rep;
}

async function insights(db: PrismaClient, clientId: string, swap?: (s: string) => string) {
  const t = swap ?? ((s: string) => s);
  for (const c of CATALOGUE) {
    const data = { observations: c.obs.map(([observed, why]) => ({ observed: t(observed), why: t(why) })), workOn: c.work, relatedLabel: c.related, evidenceDocIds: c.ev };
    await db.measureInsight.upsert({ where: { clientId_testKey: { clientId, testKey: c.key } }, update: data, create: { clientId, testKey: c.key, ...data } });
  }
}

async function compareNotes(db: PrismaClient, clientId: string, assessmentId: string, coachName: string) {
  await db.coachNote.deleteMany({ where: { clientId, assessmentId, scope: { in: ["compare", "overall"] } } });
  await db.coachNote.createMany({
    data: [
      { clientId, assessmentId, scope: "overall", text: NOTES.overall, coachName },
      ...(["MOVEMENT", "BREATH", "RECOVERY", "PERFORMANCE"] as const).map((system) => ({ clientId, assessmentId, system, scope: "compare", text: NOTES[system], coachName })),
    ],
  });
}

export default async function seedResults(db: PrismaClient, base: Base) {
  await seedTests(db);
  const { jayraj, shimyu, tic } = base;
  const client = (email: string) => db.clientProfile.findFirst({ where: { user: { email } } });

  // ── Ananya Iyer: training sample, released baseline (05), reassessment window opens 28 Oct ──
  const ananya = await client("ananya@example.com");
  if (ananya) {
    const a = await findOrCreateAssessment(db, { clientId: ananya.id, kind: "BASELINE", cycle: 1, format: "IN_PERSON", date: d("2026-09-02 08:00"), practitionerId: jayraj.id, centreId: tic.id, releasedAt: d("2026-09-05 11:00"), submittedAt: d("2026-09-02 10:00"), testKeys: KEYS, measuresTotal: KEYS.length });
    await writeValues(db, ananya.id, a.id, "base", d("2026-09-02 08:40"), "Jayraj");
    await nights(db, a.id, "2026-08-26", NIGHTS.base);
    await insights(db, ananya.id);
    await writeReport(db, { clientId: ananya.id, assessmentId: a.id, kind: "BASELINE", releasedAt: d("2026-09-05 11:00"), authorId: jayraj.id, approverId: shimyu.id, starting: BASE_COPY.starting, note: BASE_COPY.note, work: BASE_COPY.work, path: "PERSONAL_TRAINING", pathTitle: "Personal Training, then Group Training.", pathReason: "The right side needs one to one loading before group work.", systems: TOP_05, findings: FINDINGS_05 });
  }

  // ── Ishita Rao: baseline (Jun) + reassessment (Sat 3 Oct), both released → Compare ──
  const ishita = await client("ishita@example.com");
  if (ishita) {
    const a = await findOrCreateAssessment(db, { clientId: ishita.id, kind: "BASELINE", cycle: 1, format: "IN_PERSON", date: d("2026-06-06 08:00"), practitionerId: jayraj.id, centreId: tic.id, releasedAt: d("2026-06-09 11:00"), testKeys: KEYS, measuresTotal: KEYS.length });
    await writeValues(db, ishita.id, a.id, "base", d("2026-06-06 08:40"), "Jayraj");
    await nights(db, a.id, "2026-05-30", NIGHTS.base);
    const r = await findOrCreateAssessment(db, { clientId: ishita.id, kind: "REASSESSMENT", cycle: 1, format: "IN_PERSON", date: d("2026-10-03 08:00"), practitionerId: jayraj.id, centreId: tic.id, releasedAt: d("2026-10-05 11:00"), testKeys: KEYS, measuresTotal: KEYS.length });
    await writeValues(db, ishita.id, r.id, "re", d("2026-10-03 08:40"), "Jayraj");
    await nights(db, r.id, "2026-09-26", NIGHTS.re);
    await insights(db, ishita.id);
    await compareNotes(db, ishita.id, r.id, "Shimyu");
    await writeReport(db, { clientId: ishita.id, assessmentId: a.id, kind: "BASELINE", releasedAt: d("2026-06-09 11:00"), authorId: jayraj.id, approverId: shimyu.id, starting: BASE_COPY.starting, note: BASE_COPY.note, work: BASE_COPY.work, path: "PERSONAL_TRAINING", pathTitle: "Personal Training, then Group Training.", pathReason: "The right side needs one to one loading before group work.", systems: TOP_05, findings: FINDINGS_05 });
    const re = RE_COPY("Ishita");
    await writeReport(db, { clientId: ishita.id, assessmentId: r.id, kind: "REASSESSMENT", releasedAt: d("2026-10-05 11:00"), authorId: jayraj.id, approverId: shimyu.id, starting: re.starting, note: re.note, work: re.work, path: "PERSONAL_TRAINING", pathTitle: re.pathTitle, pathReason: re.pathReason, systems: TOP_05, findings: FINDINGS_05 });
  }

  // ── Sana Patel: baseline released today 11:02 AM (04 reveal sample) ──
  const sana = await client("sana@example.com");
  if (sana) {
    const a = await findOrCreateAssessment(db, { clientId: sana.id, kind: "BASELINE", cycle: 1, format: "IN_PERSON", date: d("2026-10-05 17:30"), practitionerId: jayraj.id, centreId: tic.id, releasedAt: d("2026-10-07 11:02"), submittedAt: d("2026-10-05 19:00"), testKeys: KEYS, measuresTotal: KEYS.length });
    await writeValues(db, sana.id, a.id, "base", d("2026-10-05 18:00"), "Jayraj");
    // 04 copy: right hip 22°, left 36°.
    await db.measureValue.update({ where: { assessmentId_testKey_side: { assessmentId: a.id, testKey: "hipIR", side: "LEFT" } }, data: { value: 36 } });
    await nights(db, a.id, "2026-09-28", NIGHTS.base);
    await insights(db, sana.id, (s) => s.replace("The left turns in 38°.", "The left turns in 36°."));
    const rep = await writeReport(db, { clientId: sana.id, assessmentId: a.id, kind: "BASELINE", releasedAt: d("2026-10-07 11:02"), authorId: jayraj.id, approverId: shimyu.id, starting: SANA_COPY.starting, note: SANA_COPY.note, work: SANA_COPY.work, path: "PERSONAL_TRAINING", pathTitle: "Personal Training, then Group Training.", pathReason: "The right side needs one to one loading before group work.", systems: TOP_04, findings: FINDINGS_04 });
    // "Also sent to you" (04 released screen).
    // 06 "Recommended next assessment steps" attached by the practitioner (rendered by the Plan area's NextSteps).
    await db.report.update({
      where: { id: rep.id },
      data: {
        nextSteps: [
          { name: "Live video session", family: "live", priceLabel: "Included", why: "Talk through your results and watch your squat live with a practitioner.", by: "Jayraj", action: "book" },
          { name: "Follow up photos", family: "photos", priceLabel: "Included", why: "Retake your posture photos in 6 weeks so we can see what changed.", by: "Jayraj", action: "remind" },
        ],
      },
    });
    const to = await db.user.findFirst({ where: { client: { id: sana.id } } });
    await db.outboxMessage.deleteMany({ where: { clientId: sana.id, template: "report_ready" } });
    await db.outboxMessage.createMany({
      data: [
        { clientId: sana.id, toAddress: "+91 98XXX XXXXX", channel: "WHATSAPP", template: "report_ready", body: "Hi Sana, your report is ready. Open it here: aditus.in/r/sana. Jayraj is around if you have questions.", status: "SENT", createdAt: d("2026-10-07 11:02") },
        { clientId: sana.id, toAddress: to?.email ?? "sana@example.com", channel: "EMAIL", template: "report_ready", subject: "Your report is ready", body: "Your starting point, what matters most, and your recommended path.", status: "SENT", createdAt: d("2026-10-07 11:02") },
      ],
    });
    void rep;
  }

  // ── Farah Ali: baseline online (self timed hold) + two reassessments in person (history selector) ──
  const farah = await client("farah@example.com");
  if (farah) {
    const a = await findOrCreateAssessment(db, { clientId: farah.id, kind: "BASELINE", cycle: 1, format: "IN_PERSON", date: d("2026-03-02 08:00"), practitionerId: jayraj.id, centreId: tic.id, releasedAt: d("2026-03-05 11:00"), testKeys: KEYS, measuresTotal: KEYS.length });
    await writeValues(db, farah.id, a.id, "base", d("2026-03-02 08:40"), "Jayraj", { hold: { tag: "SELF_REPORTED", method: "Self timed at home", source: "self_test" } });
    await nights(db, a.id, "2026-02-23", NIGHTS.base);
    const r1 = await findOrCreateAssessment(db, { clientId: farah.id, kind: "REASSESSMENT", cycle: 1, format: "IN_PERSON", date: d("2026-05-30 08:00"), practitionerId: jayraj.id, centreId: tic.id, releasedAt: d("2026-06-02 11:00"), testKeys: KEYS, measuresTotal: KEYS.length });
    await writeValues(db, farah.id, r1.id, "re", d("2026-05-30 08:40"), "Jayraj");
    await nights(db, r1.id, "2026-05-23", NIGHTS.re);
    const r2 = await findOrCreateAssessment(db, { clientId: farah.id, kind: "REASSESSMENT", cycle: 2, format: "IN_PERSON", date: d("2026-08-29 08:00"), practitionerId: jayraj.id, centreId: tic.id, releasedAt: d("2026-09-01 11:00"), testKeys: KEYS, measuresTotal: KEYS.length });
    await writeValues(db, farah.id, r2.id, "re2", d("2026-08-29 08:40"), "Jayraj");
    await nights(db, r2.id, "2026-08-22", NIGHTS.re2);
    await insights(db, farah.id);
    await compareNotes(db, farah.id, r1.id, "Shimyu");
    await compareNotes(db, farah.id, r2.id, "Shimyu");
    await writeReport(db, { clientId: farah.id, assessmentId: a.id, kind: "BASELINE", releasedAt: d("2026-03-05 11:00"), authorId: jayraj.id, approverId: shimyu.id, starting: BASE_COPY.starting, note: BASE_COPY.note, work: BASE_COPY.work, path: "PERSONAL_TRAINING", pathTitle: "Personal Training, then Group Training.", pathReason: "The right side needs one to one loading before group work.", systems: TOP_05, findings: FINDINGS_05 });
    const re = RE_COPY("Farah");
    await writeReport(db, { clientId: farah.id, assessmentId: r1.id, kind: "REASSESSMENT", releasedAt: d("2026-06-02 11:00"), authorId: jayraj.id, approverId: shimyu.id, starting: re.starting, note: re.note, work: re.work, path: "PERSONAL_TRAINING", pathTitle: re.pathTitle, pathReason: re.pathReason, findings: FINDINGS_05 });
    await writeReport(db, { clientId: farah.id, assessmentId: r2.id, kind: "REASSESSMENT", releasedAt: d("2026-09-01 11:00"), authorId: jayraj.id, approverId: shimyu.id, starting: "Every baseline measure retested a second time. The right side now matches the left within a few degrees. Breath and sleep kept improving.", note: "Good work, Farah. The right side has caught up. Group Training is the next step.", work: ["Keep the ankle range you gained.", "Plank and trunk endurance, twice a week."], path: "GROUP_TRAINING", pathTitle: "Group Training.", pathReason: "The right side holds under load. Group work keeps it there.", findings: FINDINGS_05 });
  }

  // ── Omar Sheikh: baseline + reassessment released (export sample) ──
  const omar = await client("omar@example.com");
  if (omar) {
    const a = await findOrCreateAssessment(db, { clientId: omar.id, kind: "BASELINE", cycle: 1, format: "IN_PERSON", date: d("2026-02-10 08:00"), practitionerId: jayraj.id, centreId: tic.id, releasedAt: d("2026-02-13 11:00"), testKeys: KEYS, measuresTotal: KEYS.length });
    await writeValues(db, omar.id, a.id, "base", d("2026-02-10 08:40"), "Jayraj");
    await nights(db, a.id, "2026-02-03", NIGHTS.base);
    const r = await findOrCreateAssessment(db, { clientId: omar.id, kind: "REASSESSMENT", cycle: 1, format: "IN_PERSON", date: d("2026-05-09 08:00"), practitionerId: jayraj.id, centreId: tic.id, releasedAt: d("2026-05-12 11:00"), testKeys: KEYS, measuresTotal: KEYS.length });
    await writeValues(db, omar.id, r.id, "re", d("2026-05-09 08:40"), "Jayraj");
    await nights(db, r.id, "2026-05-02", NIGHTS.re);
    await insights(db, omar.id);
    await compareNotes(db, omar.id, r.id, "Shimyu");
    await writeReport(db, { clientId: omar.id, assessmentId: a.id, kind: "BASELINE", releasedAt: d("2026-02-13 11:00"), authorId: jayraj.id, approverId: shimyu.id, starting: BASE_COPY.starting, note: BASE_COPY.note, work: BASE_COPY.work, path: "PERSONAL_TRAINING", pathTitle: "Personal Training, then Group Training.", pathReason: "The right side needs one to one loading before group work.", systems: TOP_05, findings: FINDINGS_05 });
    const re = RE_COPY("Omar");
    await writeReport(db, { clientId: omar.id, assessmentId: r.id, kind: "REASSESSMENT", releasedAt: d("2026-05-12 11:00"), authorId: jayraj.id, approverId: shimyu.id, starting: re.starting, note: re.note, work: re.work, path: "PERSONAL_TRAINING", pathTitle: re.pathTitle, pathReason: re.pathReason, findings: FINDINGS_05 });
  }
}
