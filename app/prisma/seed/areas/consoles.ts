import type { Prisma, PrismaClient } from "@prisma/client";
import { d, type Base } from "../base";

/**
 * Consoles area (10 Practitioner Console, head coach review, 11 Photo Review).
 * Enriches existing clients only; skips anything an earlier area did not create.
 *  - Meera Shah: Online Capture submitted, review due in 18 h, with photos (and overlay
 *    annotations), videos and self tests. Her in person assessment comes from the Day area.
 *  - Kabir Nair: report pending approval (base seed) completed with an assessment, measures,
 *    4 priorities, sections, note and recommended path.
 *  - Vikram Joshi: report returned by the head coach with a comment (author Jayraj).
 *  - Rhea Kulkarni: capture ready to review (photos), due Thu 8 Oct 11:00 AM.
 */
export default async function seedConsoles(db: PrismaClient, base: Base) {
  const { jayraj, shimyu } = base;
  const byEmail = (email: string) => db.clientProfile.findFirst({ where: { user: { email } } });
  const bank = Object.fromEntries((await db.testDefinition.findMany()).map((t) => [t.key, t]));

  type MV = { key: string; side?: "LEFT" | "RIGHT" | "NONE"; value?: number; text?: string; tag?: "MEASURED" | "OBSERVED" | "SELF_REPORTED"; source?: string; priority?: boolean; obs?: string[]; note?: string; notTested?: boolean; at?: string };
  const measures = async (clientId: string, assessmentId: string | null, rows: MV[]) => {
    for (const r of rows) {
      const side = r.side ?? "NONE";
      if (assessmentId && (await db.measureValue.findFirst({ where: { assessmentId, testKey: r.key, side } }))) continue;
      if (!assessmentId && (await db.measureValue.findFirst({ where: { clientId, assessmentId: null, testKey: r.key, side, source: r.source ?? "self_test" } }))) continue;
      await db.measureValue.create({
        data: {
          clientId, assessmentId, testKey: r.key, side, value: r.value ?? null, text: r.text ?? null, unit: bank[r.key]?.unit ?? "",
          tag: r.tag ?? (r.source === "self_test" ? "SELF_REPORTED" : "OBSERVED"), source: r.source ?? "photo_review", priority: !!r.priority, observation: r.obs ?? [], note: r.note ?? null,
          notTested: !!r.notTested, skipReason: r.notTested ? "declined" : null, method: r.source === "self_test" ? "Self timed at home" : "Photo and video review",
          capturedBy: r.source === "self_test" ? null : "Jayraj", capturedAt: d(r.at ?? "2026-10-06 18:00"),
        },
      });
    }
  };
  type Media = { view: string; label: string; kind: "PHOTO" | "VIDEO"; at: string; ann?: Prisma.InputJsonValue; dur?: number };
  const media = async (clientId: string, moduleKey: string, rows: Media[]) => {
    if (await db.mediaAsset.count({ where: { clientId, moduleKey } })) return;
    for (const m of rows)
      await db.mediaAsset.create({ data: { clientId, moduleKey, kind: m.kind, view: m.view, label: m.label, durationS: m.dur ?? null, capturedBy: "CLIENT", tag: "OBSERVED", status: "NEEDS_REVIEW", annotations: m.ann ?? [], capturedAt: d(m.at) } });
  };
  const capturePhotos = (at: string, levels: [number, number][] = [[22, 50], [22, 47], [22, 49], [22, 51]], angles = [0, -4, -9, 2]): Media[] => [
    ...(
      [
        ["front", "Front"],
        ["left", "Left side"],
        ["right", "Right side"],
        ["back", "Back"],
      ] as const
    ).map(([view, label], i) => ({ view, label, kind: "PHOTO" as const, at, ann: [{ type: "LEVEL", ys: levels[i] }, { type: "ANGLE", deg: angles[i] }] })),
    ...(
      [
        ["squat", "Overhead squat"],
        ["balL", "Balance, left"],
        ["balR", "Balance, right"],
        ["bend", "Bend forward"],
      ] as const
    ).map(([view, label]) => ({ view, label, kind: "VIDEO" as const, at, dur: 10 })),
  ];
  const ensureAssessment = async (clientId: string, data: Omit<Prisma.AssessmentUncheckedCreateInput, "clientId">) =>
    (await db.assessment.findFirst({ where: { clientId }, orderBy: { date: "desc" } })) ?? db.assessment.create({ data: { clientId, ...data } });

  type F = { key: string; observed: string; why: string; work: string; related: string[] };
  const FOCUS: Record<string, { groups: string[]; marker: { view: string; x: number; y: number } | null }> = {
    hipIR: { groups: ["R:hipflex", "R:glute"], marker: { view: "front", x: 176, y: 366 } },
    balance: { groups: ["R:foot", "R:shin", "R:calf"], marker: { view: "front", x: 170, y: 692 } },
    squat: { groups: ["R:hipflex", "R:glute"], marker: { view: "front", x: 176, y: 366 } },
    tspine: { groups: ["C:trapback", "L:scap", "R:scap", "R:uppback", "L:uppback"], marker: { view: "back", x: 200, y: 186 } },
    knee: { groups: ["R:knee"], marker: { view: "front", x: 172, y: 543 } },
    overhead: { groups: ["C:trapback", "L:scap", "R:scap", "R:uppback", "L:uppback"], marker: { view: "back", x: 200, y: 186 } },
  };
  const writeReport = async (reportId: string, fs: F[], extra: Prisma.ReportUncheckedUpdateInput) => {
    await db.finding.deleteMany({ where: { reportId } });
    await db.consoleFindingDraft.deleteMany({ where: { reportId } });
    for (const [i, f] of fs.entries()) {
      const def = bank[f.key];
      const body = def?.system === "MOVEMENT" ? FOCUS[f.key] : undefined;
      await db.finding.create({
        data: { reportId, order: i + 1, system: def?.system ?? "MOVEMENT", title: def?.name ?? f.key, observed: f.observed, whyItMatters: f.why, workOn: f.work, related: f.related, bodyGroups: body?.groups ?? [], marker: body?.marker ?? undefined, measureKeys: [f.key] },
      });
      await db.consoleFindingDraft.create({ data: { reportId, testKey: f.key, picked: true, order: i + 1, observed: f.observed, whyItMatters: f.why, workOn: f.work, related: f.related } });
    }
    await db.report.update({ where: { id: reportId }, data: extra });
  };

  // ── Meera Shah: Online Capture ready to review, 18 h left ──
  const meera = await byEmail("meera@example.com");
  if (meera) {
    const cap = await db.planModule.findFirst({ where: { plan: { clientId: meera.id }, key: "capture" } });
    if (cap) await db.planModule.update({ where: { id: cap.id }, data: { dueAt: cap.dueAt ?? d("2026-10-08 13:50"), status: cap.status === "DONE" ? cap.status : "SUBMITTED" } });
    await media(meera.id, "capture", capturePhotos("2026-10-07 01:30"));
    // Self tests from the capture (not attached to the in person assessment, so its live count stays as the Day area set it).
    await measures(meera.id, null, [
      { key: "hold", value: 18, source: "self_test", at: "2026-10-07 01:40" },
      { key: "rate", value: 16, source: "self_test", at: "2026-10-07 01:42" },
      { key: "nasal", text: "Partly", source: "self_test", at: "2026-10-07 01:44" },
      { key: "balance", side: "LEFT", value: 24, source: "self_test", at: "2026-10-07 01:46" },
      { key: "balance", side: "RIGHT", value: 11, source: "self_test", at: "2026-10-07 01:46" },
      { key: "plank", notTested: true, source: "self_test", at: "2026-10-07 01:48" },
    ]);
    // Her in person assessment (Day area): add the flags the practitioner set so far.
    const a = await db.assessment.findFirst({ where: { clientId: meera.id, format: "IN_PERSON" }, orderBy: { date: "desc" } });
    if (a) {
      await db.measureValue.updateMany({ where: { assessmentId: a.id, testKey: "hipIR" }, data: { priority: true, observation: ["Shifts left"] } });
      await db.measureValue.updateMany({ where: { assessmentId: a.id, testKey: "tspine" }, data: { priority: true } });
      await db.measureValue.updateMany({ where: { assessmentId: a.id, testKey: "squat" }, data: { priority: true, observation: ["Knee drifts in"], note: "Left shoulder fine in the overhead position." } });
      // The base seed's draft report belongs to this assessment.
      await db.report.updateMany({ where: { clientId: meera.id, assessmentId: null, status: "DRAFT" }, data: { assessmentId: a.id, kind: "BASELINE" } });
    }
  }

  // ── Kabir Nair: report pending approval, complete for the review page ──
  const kabir = await byEmail("kabir@example.com");
  const kabirReport = kabir ? await db.report.findFirst({ where: { clientId: kabir.id, status: "PENDING_APPROVAL" } }) : null;
  if (kabir && kabirReport) {
    const a = await ensureAssessment(kabir.id, { kind: "BASELINE", format: "ONLINE", date: d("2026-10-05 18:30"), practitionerId: shimyu.id, submittedAt: d("2026-10-05 18:30"), testKeys: ["hipIR", "tspine", "overhead", "squat", "balance", "foot", "hold", "rate", "nasal", "sleep", "stress", "selfrec", "pushup", "plank"] });
    await measures(kabir.id, a.id, [
      { key: "hipIR", side: "LEFT", value: 38, priority: true, obs: ["Shifts left"] },
      { key: "hipIR", side: "RIGHT", value: 29, priority: true, obs: ["Shifts left"] },
      { key: "tspine", side: "LEFT", value: 44, priority: true },
      { key: "tspine", side: "RIGHT", value: 36, priority: true },
      { key: "overhead", text: "Limited right" },
      { key: "squat", value: 1, priority: true, obs: ["Knee drifts in"], note: "Heels lift on all three reps." },
      { key: "foot", text: "Arch drops right" },
      { key: "balance", side: "LEFT", value: 26, source: "self_test", priority: true },
      { key: "balance", side: "RIGHT", value: 12, source: "self_test", priority: true },
      { key: "hold", value: 21, source: "self_test" },
      { key: "rate", value: 14, source: "self_test" },
      { key: "nasal", text: "Partly", source: "self_test" },
      { key: "sleep", value: 6, source: "intake", tag: "SELF_REPORTED" },
      { key: "stress", value: 6, source: "intake", tag: "SELF_REPORTED" },
      { key: "selfrec", value: 5, source: "intake", tag: "SELF_REPORTED" },
      { key: "pushup", value: 12, source: "self_test" },
      { key: "plank", value: 45, source: "self_test" },
    ]);
    if (!(await db.mediaAsset.count({ where: { clientId: kabir.id, moduleKey: "capture" } }))) await media(kabir.id, "capture", capturePhotos("2026-10-04 19:10"));
    await writeReport(
      kabirReport.id,
      [
        { key: "hipIR", observed: "Right hip turns in 29°, left 38°. He shifts left at the bottom of a squat.", why: "The knee and lower back take the turn the hip cannot.", work: "Opening right hip rotation, then loading it.", related: ["90 90 hip switch", "Why hips get stuck"] },
        { key: "balance", observed: "Right leg held 12 s, left 26 s. The right arch drops as he loses balance.", why: "Every stair, run and kick is single leg balance.", work: "Strengthening the right foot and leg.", related: ["Short foot hold"] },
        { key: "squat", observed: "Heels lift and the right knee drifts in on all three reps.", why: "Depth comes from the ankles and hips. Without it, the lower back bends to get there.", work: "Box squat to a lower box each week, heels down.", related: ["Goblet squat to a box"] },
        { key: "tspine", observed: "Upper back turns 36° right, 44° left.", why: "The lower back makes up the difference when he turns.", work: "Upper back rotation drills before every session.", related: ["Open book"] },
      ],
      {
        assessmentId: a.id,
        kind: "BASELINE",
        authorId: shimyu.id,
        startingPoint: "You move well forwards and lose control when you turn or stand on your right leg. Everything starts with the right hip.",
        sections: {
          bigPicture: "You move well forwards and lose control when you turn or stand on the right leg.",
          frontView: "Right knee drifts in on the squat. Right arch drops on one leg.",
          sideView: "Heels lift at the bottom of the squat. Ankles are stiff, which pushes the knees forward.",
          backView: "Weight shifts left. Right glute switches on late.",
          muscleStrategy: "Left side and lower back carry what the right hip should share.",
          keyObservations: "Right hip rotation 9° short of the left. Right leg balance less than half the left.",
          startHere: "Hip first. Then the foot. Then load.",
        },
        practitionerNote: "Your body is not broken. One hip is doing less than the other, and everything else is working around it. That is very trainable.",
        recommendedPath: "PERSONAL_TRAINING",
        pathReason: "The right side needs one to one loading before group work.",
      },
    );
    // Capture and follow up photos were reviewed before the report was written.
    for (const moduleKey of ["capture", "photos"]) await db.captureReview.upsert({ where: { clientId_moduleKey: { clientId: kabir.id, moduleKey } }, create: { clientId: kabir.id, moduleKey, finishedAt: d("2026-10-07 12:30"), reviewerName: "Shimyu" }, update: {} });
  }

  // ── Vikram Joshi: report returned by the head coach (author Jayraj) ──
  const vikram = await byEmail("vikram@example.com");
  if (vikram && !(await db.report.count({ where: { clientId: vikram.id, status: { in: ["RETURNED", "PENDING_APPROVAL", "RELEASED"] } } }))) {
    const a = await ensureAssessment(vikram.id, { kind: "BASELINE", format: "ONLINE", date: d("2026-10-04 19:00"), practitionerId: jayraj.id, submittedAt: d("2026-10-04 19:00"), testKeys: ["hipIR", "ankle", "tspine", "squat", "balance", "knee", "hold", "nasal", "sleep", "stress", "pushup", "plank"] });
    await measures(vikram.id, a.id, [
      { key: "ankle", side: "LEFT", value: 38, priority: true },
      { key: "ankle", side: "RIGHT", value: 29, priority: true },
      { key: "hipIR", side: "LEFT", value: 34 },
      { key: "hipIR", side: "RIGHT", value: 31 },
      { key: "tspine", side: "LEFT", value: 42 },
      { key: "tspine", side: "RIGHT", value: 40 },
      { key: "squat", value: 2, priority: true, obs: ["Knee drifts in"] },
      { key: "knee", value: 4, source: "intake", tag: "SELF_REPORTED", priority: true },
      { key: "balance", side: "LEFT", value: 30, source: "self_test" },
      { key: "balance", side: "RIGHT", value: 22, source: "self_test" },
      { key: "hold", value: 24, source: "self_test" },
      { key: "nasal", text: "Yes", source: "self_test" },
      { key: "sleep", value: 7, source: "intake", tag: "SELF_REPORTED" },
      { key: "stress", value: 5, source: "intake", tag: "SELF_REPORTED" },
      { key: "pushup", value: 18, source: "self_test" },
      { key: "plank", value: 60, source: "self_test" },
    ]);
    if (!(await db.mediaAsset.count({ where: { clientId: vikram.id, moduleKey: "capture" } }))) await media(vikram.id, "capture", capturePhotos("2026-10-03 20:00"));
    await db.captureReview.upsert({ where: { clientId_moduleKey: { clientId: vikram.id, moduleKey: "capture" } }, create: { clientId: vikram.id, moduleKey: "capture", finishedAt: d("2026-10-06 17:00"), reviewerName: "Jayraj" }, update: {} });
    const existing = await db.report.findFirst({ where: { clientId: vikram.id, status: "DRAFT" } });
    const r = existing ?? (await db.report.create({ data: { clientId: vikram.id, assessmentId: a.id, kind: "BASELINE", status: "DRAFT", authorId: jayraj.id, createdAt: d("2026-10-06 17:00") } }));
    await writeReport(
      r.id,
      [
        { key: "ankle", observed: "Right ankle bends 29°, left 38°, knee to wall.", why: "A stiff ankle sends the knee forward and in on every step down.", work: "Opening the right ankle, then loading it on a slope.", related: ["Knee to wall rocks"] },
        { key: "squat", observed: "Right knee drifts in at the bottom of the squat. Heels stay down.", why: "The knee takes the load the ankle and hip do not.", work: "Split squat with the knee tracking the toes.", related: ["Split squat"] },
        { key: "knee", observed: "Knee pain 4 of 10 at the bottom of a deep squat.", why: "", work: "Box squat lowered week by week, pain under 3.", related: ["Box squat"] },
      ],
      {
        status: "RETURNED", assessmentId: a.id, authorId: jayraj.id, submittedAt: d("2026-10-07 18:40"), dueAt: d("2026-10-08 18:40"),
        sections: { bigPicture: "Strong and steady, with a stiff right ankle the knee pays for.", frontView: "Right knee drifts in on squat and step down.", sideView: "", backView: "Weight sits evenly. Right calf is tight.", muscleStrategy: "The right knee works harder than it needs to.", keyObservations: "Right ankle 9° short of the left.", startHere: "Ankle first. Then the knee under load." },
        practitionerNote: "Nothing here is a problem you cannot fix. The ankle is the key, and it moves quickly with daily work.",
        recommendedPath: "EITHER",
        pathReason: "Either works once the ankle routine is in place.",
      },
    );
    await db.reviewComment.create({ data: { reportId: r.id, authorId: shimyu.id, action: "RETURNED", body: "Priority 3 needs a plain reason why it matters for him. And add the ankle to Side View, it explains the knee.", createdAt: d("2026-10-07 19:12") } });
    await db.activityLog.create({ data: { clientId: vikram.id, actorName: "Shimyu", action: "Returned report to Jayraj with a comment", createdAt: d("2026-10-07 19:12") } });
  }

  // ── Rhea Kulkarni: capture ready to review ──
  const rhea = await byEmail("rhea@example.com");
  if (rhea) {
    const cap = await db.planModule.findFirst({ where: { plan: { clientId: rhea.id }, key: "capture", status: "SUBMITTED" } });
    if (cap) {
      if (!cap.dueAt) await db.planModule.update({ where: { id: cap.id }, data: { dueAt: d("2026-10-08 11:00") } });
      await media(rhea.id, "capture", capturePhotos("2026-10-07 09:20"));
    }
  }
}
