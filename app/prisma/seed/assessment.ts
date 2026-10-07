import type { PrismaClient } from "@prisma/client";
import { d, type Base } from "./base";
import { consentAll, makeClient, makePlan } from "./factory";

/**
 * Assessment stage clients from 06 (client plan) and 12 (admin console).
 * Aarav is the primary sample: Online Capture done, in person recommended then
 * added and booked at TIC Kandivali, "Running gait video" added by Jayraj, and a
 * staff draft ("Sport specific tests") not yet sent.
 */
export async function seedAssessment(db: PrismaClient, base: Base) {
  const { jayraj, shimyu, tic } = base;

  // ── Aarav Mehta ──
  const aarav = await makeClient(db, base, {
    email: "aarav@example.com", first: "Aarav", last: "Mehta", city: "Kandivali, Mumbai", pin: "400067", mumbai: true, created: "2026-08-25 17:40",
    profile: { code: "AD 0142", stage: "ASSESSMENT_DAY", assessmentStatus: "SESSION_BOOKED", recommendation: "BOOKED", recommendationNote: "Your videos show the right hip turning less than the left. I would like to measure it by hand before writing your report.", primaryPractitionerId: jayraj.id, preferredCentreId: tic.id, goalHeadline: "Run without knee pain", intakeStep: 12, intakeCompletedAt: d("2026-08-26 20:10"), dateOfBirth: d("1991-04-12"), emergencyName: "Riya Mehta, sister", emergencyPhone: "+91 98XXX XXXXX" },
  });
  await db.clientCoach.createMany({ data: [{ clientId: aarav.id, staffId: jayraj.id, role: "ASSESSMENT" }, { clientId: aarav.id, staffId: shimyu.id, role: "PERSONAL_TRAINING" }] });
  await db.consent.createMany({ data: consentAll(aarav.id, { HEALTH_DOCUMENTS: true, PHOTOS_VIDEOS: true, HEALTH_APP_SYNC: true, TESTIMONIAL: false, COMMUNITY: true, ASSESSMENT_AGREEMENT: true, ASSESSMENT_MEDIA: true }) });
  await makePlan(db, aarav.id, [
    { key: "intake", status: "DONE" },
    { key: "capture", status: "SUBMITTED", extra: { submittedAt: d("2026-10-05 18:00"), extraLine: "Submitted Mon 5 Oct. Jayraj is reviewing it." } },
    { key: "inperson", status: "BOOKED", extra: { addedBy: "RECOMMENDED", addedByName: "Jayraj", required: false, paid: true, priceLabel: "₹X,XXX", dueLabel: "Sat 10 Oct · TIC Kandivali", dueAt: d("2026-10-10 09:00"), note: "We recommend this because we could not measure hip rotation online.", extraLine: "Sat 10 Oct · 9:00 AM · TIC Kandivali · with Jayraj" } },
    { key: "gait", status: "NOT_STARTED", extra: { addedBy: "PRACTITIONER", addedByName: "Jayraj", required: true, dueAt: d("2026-10-09 23:59"), dueLabel: "Fri 9 Oct", note: "You said running without knee pain is your main goal. I want to see your stride before I write the report.", safetyNote: undefined } as never },
    { key: "sport", status: "NOT_STARTED", extra: { addedBy: "PRACTITIONER", addedByName: "Jayraj", required: false, draft: true, dueAt: d("2026-10-12 23:59"), dueLabel: "Mon 12 Oct", note: "You play football twice a week. Three short tests for change of direction." } },
  ], { sentVersion: 3, versions: [[1, "Default plan: Intake, Online Capture", "System", "2026-08-25 17:40"], [2, "In person session added after payment", "System", "2026-10-05 20:30"], [3, "Running gait video added", "Jayraj", "2026-10-06 18:10"]] });
  const aaravAssess = await db.assessment.create({ data: { clientId: aarav.id, kind: "BASELINE", format: "ONLINE", date: d("2026-10-05 18:00"), practitionerId: jayraj.id, testKeys: ["hipIR", "tspine", "balance", "hold", "rhr", "knee", "sleep", "stress", "selfrec", "squat"] } });
  await db.measureValue.createMany({
    data: [
      { clientId: aarav.id, assessmentId: aaravAssess.id, testKey: "hipIR", side: "RIGHT", value: 22, unit: "°", tag: "OBSERVED", source: "photo_review", capturedBy: "Jayraj", capturedAt: d("2026-10-06 18:00") },
      { clientId: aarav.id, assessmentId: aaravAssess.id, testKey: "hipIR", side: "LEFT", value: 36, unit: "°", tag: "OBSERVED", source: "photo_review", capturedBy: "Jayraj", capturedAt: d("2026-10-06 18:00") },
      { clientId: aarav.id, assessmentId: aaravAssess.id, testKey: "balance", side: "RIGHT", value: 14, unit: "s", tag: "SELF_REPORTED", source: "self_test", capturedAt: d("2026-10-05 17:50") },
      { clientId: aarav.id, assessmentId: aaravAssess.id, testKey: "balance", side: "LEFT", value: 31, unit: "s", tag: "SELF_REPORTED", source: "self_test", capturedAt: d("2026-10-05 17:50") },
      { clientId: aarav.id, assessmentId: aaravAssess.id, testKey: "hold", value: 16, unit: "s", tag: "SELF_REPORTED", source: "self_test", capturedAt: d("2026-10-05 17:52") },
      { clientId: aarav.id, assessmentId: aaravAssess.id, testKey: "knee", value: 6, unit: "/10", tag: "SELF_REPORTED", source: "intake", capturedAt: d("2026-08-26 20:10") },
      { clientId: aarav.id, assessmentId: aaravAssess.id, testKey: "sleep", value: 6.5, unit: "h", tag: "SELF_REPORTED", source: "intake", capturedAt: d("2026-08-26 20:10") },
      { clientId: aarav.id, assessmentId: aaravAssess.id, testKey: "stress", value: 7, unit: "/10", tag: "SELF_REPORTED", source: "intake", capturedAt: d("2026-08-26 20:10") },
    ],
  });
  await db.intakeSection.createMany({
    data: [
      { clientId: aarav.id, key: "goals", answers: { picked: ["Run without knee pain", "Lift overhead"], text: "Run a 10 km without my knee hurting." }, completedAt: d("2026-08-26 19:40") },
      { clientId: aarav.id, key: "concerns", answers: { summary: "Right knee · 6 of 10 on deep squat" }, completedAt: d("2026-08-26 19:50") },
      { clientId: aarav.id, key: "sleep", answers: { hours: "6.5", bedtime: "12:30 to 1:30 AM" }, completedAt: d("2026-08-26 20:00") },
      { clientId: aarav.id, key: "stress", answers: { level: 7 }, completedAt: d("2026-08-26 20:02") },
    ],
  });
  await db.bodyConcern.create({ data: { clientId: aarav.id, region: "R:knee", side: "RIGHT", intensity: 6, when: ["Squatting", "Running"] } });
  await db.injury.create({ data: { clientId: aarav.id, description: "Right knee, meniscus tear", occurredOn: "2023-03", side: "RIGHT", treatments: ["PHYSIO"], treatmentNote: "Physio, 8 weeks" } });
  await db.safetyFlag.create({ data: { clientId: aarav.id, item: "Previous knee injury", note: "Right meniscus tear 2023, physio 8 weeks.", label: "Discuss before testing" } });
  await db.mediaAsset.createMany({
    data: [
      { clientId: aarav.id, moduleKey: "capture", kind: "PHOTO", view: "front", label: "Front photo", capturedAt: d("2026-10-05 17:30") },
      { clientId: aarav.id, moduleKey: "capture", kind: "PHOTO", view: "side", label: "Side photo", capturedAt: d("2026-10-05 17:31") },
      { clientId: aarav.id, moduleKey: "capture", kind: "PHOTO", view: "back", label: "Back photo", capturedAt: d("2026-10-05 17:32") },
      { clientId: aarav.id, moduleKey: "capture", kind: "VIDEO", view: "squat", label: "Squat video", durationS: 12, capturedAt: d("2026-10-05 17:40") },
    ],
  });
  await db.document.createMany({
    data: [
      { clientId: aarav.id, source: "CLIENT", type: "XRAY", title: "Knee X ray", filename: "knee-xray-2024.jpg", testDate: d("2024-06-14"), linkedMeasureKey: "knee", uploadedByName: "Aarav Mehta", createdAt: d("2026-08-26 20:20") },
      { clientId: aarav.id, source: "CLIENT", type: "BLOOD_TEST", title: "Blood test", filename: "blood-test-aug.pdf", testDate: d("2026-08-18"), uploadedByName: "Aarav Mehta", createdAt: d("2026-08-26 20:22"), recordedValues: [{ name: "Haemoglobin", value: "14.2", unit: "g/dL" }, { name: "Vitamin D", value: "18", unit: "ng/mL" }, { name: "HbA1c", value: "5.4", unit: "%" }] },
    ],
  });
  await db.accessLog.create({ data: { clientId: aarav.id, actorUserId: jayraj.userId, actorName: "Coach Jayraj", resourceType: "document", resourceName: "knee-xray-2024.jpg", action: "VIEWED", createdAt: d("2026-10-06 18:05") } });
  await db.healthSource.create({ data: { clientId: aarav.id, provider: "APPLE_HEALTH", status: "CONNECTED", lastSyncAt: d("2026-10-07 17:52"), dataTypes: ["Steps", "Sleep", "Resting heart rate"], sharedWithCoach: ["Sleep", "Resting heart rate"] } });
  await db.order.createMany({
    data: [
      { number: "#ADT4473", clientId: aarav.id, item: "Online Assessment", amountLabel: "₹X,XXX", placedAt: d("2026-08-25 17:30"), paymentMethod: "UPI" },
      { number: "#ADT4490", clientId: aarav.id, item: "In person session", amountLabel: "₹X,XXX", placedAt: d("2026-10-05 20:25"), paymentMethod: "UPI" },
    ],
  });
  await db.invoice.createMany({
    data: [
      { number: "INV 2026 0418", clientId: aarav.id, item: "In person session", amountLabel: "₹X,XXX", status: "PAID", issuedAt: d("2026-10-05 20:25") },
      { number: "INV 2026 0391", clientId: aarav.id, item: "Online Assessment", amountLabel: "₹X,XXX", status: "PAID", issuedAt: d("2026-08-25 17:30") },
    ],
  });
  const aaravPM = await db.planModule.findFirstOrThrow({ where: { plan: { clientId: aarav.id }, key: "inperson" } });
  const ip = await db.session.create({ data: { clientId: aarav.id, type: "IN_PERSON_ASSESSMENT", title: "In person session", startsAt: d("2026-10-10 09:00"), durationMin: 120, status: "SCHEDULED", coachId: jayraj.id, centreId: tic.id, room: "Room 2", planModuleId: aaravPM.id, extraInfo: "Bring running shoes. Coach will film one set.", beforeYouCome: { wear: "Clothes you can move in. Bare feet are fine.", bring: "Running shoes, water", eat: "A light meal 2 hours before", prep: "Arrive 10 minutes early" } } });
  await db.sessionEvent.create({ data: { sessionId: ip.id, status: "SCHEDULED", byName: "Aarav Mehta", note: "Booked after payment", createdAt: d("2026-10-05 20:30") } });
  await db.internalNote.create({ data: { clientId: aarav.id, authorId: jayraj.id, body: "Watch right knee on single leg work. Not shown to client.", createdAt: d("2026-10-06 18:20") } });
  await db.programPhase.create({ data: { clientId: aarav.id, order: 1, name: "Phase 1", weeks: "Weeks 1 to 4", focus: "Hip control and ankle range", exercises: [{ name: "Goblet squat", loading: "12 kg · 3 × 8" }, { name: "90 90 hip switch", loading: "2 × 6 each side" }] } });
  for (const [at, who, what] of [
    ["2026-10-07 19:52", "Sahil", "Tried to open Media · denied · logged"],
    ["2026-10-07 18:10", "Jayraj", "Added Running gait video · sent"],
    ["2026-10-05 20:25", "Aarav Mehta", "Paid for In person session"],
    ["2026-10-05 18:00", "Aarav Mehta", "Online Capture submitted"],
  ] as const) await db.activityLog.create({ data: { clientId: aarav.id, actorName: who, action: what, createdAt: d(at) } });
  for (const [at, who, what] of [
    ["2026-10-07 19:52", "Sahil", "Tried to open Aarav Mehta · Media · denied"],
    ["2026-10-07 19:50", "Jayraj", "Preview as client · Aarav Mehta"],
    ["2026-10-07 18:12", "Jayraj", "Viewed Aarav Mehta · side photo"],
    ["2026-10-07 18:10", "Jayraj", "Sent plan v3 · Running gait video"],
  ] as const) await db.auditLog.create({ data: { actorName: who, action: "SEED", detail: what, createdAt: d(at) } });

  // ── Ishaan Rao (Bengaluru, online only, custom MRI step) ──
  const ishaan = await makeClient(db, base, { email: "ishaan@example.com", first: "Ishaan", last: "Rao", city: "Bengaluru", pin: "560038", created: "2026-09-28 11:00", profile: { stage: "ASSESSMENT_DAY", assessmentStatus: "SESSION_BOOKED", recommendation: "NOT_ELIGIBLE", primaryPractitionerId: jayraj.id, intakeStep: 12, intakeCompletedAt: d("2026-09-29 10:00") } });
  await db.clientCoach.create({ data: { clientId: ishaan.id, staffId: jayraj.id, role: "ASSESSMENT" } });
  await db.consent.createMany({ data: consentAll(ishaan.id, { HEALTH_DOCUMENTS: true, PHOTOS_VIDEOS: true, ASSESSMENT_AGREEMENT: true, ASSESSMENT_MEDIA: true }) });
  await makePlan(db, ishaan.id, [
    { key: "intake", status: "DONE" },
    { key: "capture", status: "MORE_NEEDED", extra: { extraLine: "Jayraj needs two side view photos again. They were blurred. About 3 minutes." } },
    { key: "mri", status: "SUBMITTED", extra: { addedBy: "PRACTITIONER", addedByName: "Jayraj", dueAt: d("2026-10-10 23:59"), dueLabel: "Sat 10 Oct", note: "You mentioned a knee MRI from 2025 in your intake. The written report is enough. Images are optional.", submittedAt: d("2026-10-06 21:00") } },
  ], { sentVersion: 2, versions: [[1, "Default plan: Intake, Online Capture", "System", "2026-09-28 11:00"], [2, "Upload your last MRI added", "Jayraj", "2026-10-03 12:00"]] });
  await db.retakeRequest.create({ data: { clientId: ishaan.id, step: "Side view photos", reason: "Too dark", message: "Jayraj needs two side view photos again. They were blurred. About 3 minutes.", requestedBy: "Jayraj", createdAt: d("2026-10-06 10:00") } });
  await db.order.create({ data: { number: "#ADT4472", clientId: ishaan.id, item: "Online Assessment", amountLabel: "₹X,XXX", placedAt: d("2026-09-28 10:50"), paymentMethod: "Card" } });
  await db.invoice.create({ data: { number: "INV 2026 0417", clientId: ishaan.id, item: "Online Assessment", amountLabel: "₹X,XXX", status: "PAID", issuedAt: d("2026-09-28 10:50") } });

  // ── Diya Kapoor (Dubai, capture 70%) ──
  const diya = await makeClient(db, base, { email: "diya@example.com", first: "Diya", last: "Kapoor", city: "Dubai", created: "2026-10-01 09:00", profile: { stage: "ONBOARDING", assessmentStatus: "INTAKE_COMPLETE", recommendation: "NOT_ELIGIBLE", primaryPractitionerId: shimyu.id, intakeStep: 12, intakeCompletedAt: d("2026-10-02 08:00") } });
  await db.clientCoach.create({ data: { clientId: diya.id, staffId: shimyu.id, role: "ASSESSMENT" } });
  await db.consent.createMany({ data: consentAll(diya.id, { PHOTOS_VIDEOS: true, ASSESSMENT_AGREEMENT: true, ASSESSMENT_MEDIA: true }) });
  await makePlan(db, diya.id, [
    { key: "intake", status: "DONE" },
    { key: "capture", status: "IN_PROGRESS", extra: { progressDone: 9, progressTotal: 13, extraLine: "9 of 13 items done. Everything so far is saved.", updatedAt: d("2026-10-06 17:50") } },
  ]);
  await db.order.create({ data: { number: "#ADT4480", clientId: diya.id, item: "Online Assessment", amountLabel: "₹X,XXX", placedAt: d("2026-10-01 08:50"), paymentMethod: "Card" } });

  // ── Meera Shah (Thane, capture ready to review, in person today 5:30 PM) ──
  const meera = await makeClient(db, base, { email: "meera@example.com", first: "Meera", last: "Shah", city: "Thane", pin: "400601", mumbai: true, created: "2026-09-20 10:00", profile: { stage: "ASSESSMENT_DAY", assessmentStatus: "PRACTITIONER_REVIEW", recommendation: "BOOKED", primaryPractitionerId: jayraj.id, intakeStep: 12, intakeCompletedAt: d("2026-09-21 10:00") } });
  await db.clientCoach.create({ data: { clientId: meera.id, staffId: jayraj.id, role: "ASSESSMENT" } });
  await makePlan(db, meera.id, [
    { key: "intake", status: "DONE" },
    { key: "capture", status: "SUBMITTED", extra: { submittedAt: d("2026-10-07 01:50"), extraLine: "Submitted Wed 7 Oct. Jayraj is reviewing it." } },
  ]);
  await db.session.create({ data: { clientId: meera.id, type: "IN_PERSON_ASSESSMENT", title: "In person session", startsAt: d("2026-10-07 17:30"), durationMin: 120, status: "CONFIRMED", coachId: jayraj.id, centreId: tic.id } });
  await db.report.create({ data: { clientId: meera.id, status: "DRAFT", authorId: jayraj.id, dueAt: d("2026-10-08 13:50") } });

  // ── Kabir Nair (Pune, report pending approval) ──
  const kabir = await makeClient(db, base, { email: "kabir@example.com", first: "Kabir", last: "Nair", city: "Pune", pin: "411001", created: "2026-09-15 10:00", profile: { stage: "REPORT", assessmentStatus: "REPORT_PROCESSING", recommendation: "NOT_ELIGIBLE", primaryPractitionerId: shimyu.id, intakeStep: 12, intakeCompletedAt: d("2026-09-16 10:00") } });
  await db.clientCoach.create({ data: { clientId: kabir.id, staffId: shimyu.id, role: "ASSESSMENT" } });
  await makePlan(db, kabir.id, [
    { key: "intake", status: "DONE" },
    { key: "capture", status: "DONE" },
    { key: "photos", status: "SUBMITTED", extra: { addedBy: "PRACTITIONER", addedByName: "Shimyu", note: "Retake your side photos with the phone at hip height." } },
  ]);
  await db.report.create({ data: { clientId: kabir.id, status: "PENDING_APPROVAL", authorId: shimyu.id, submittedAt: d("2026-10-07 13:50"), dueAt: d("2026-10-08 01:50") } });

  return { aarav, ishaan, diya, meera, kabir };
}
