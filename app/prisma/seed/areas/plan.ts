import type { Prisma, PrismaClient, ModuleStatus } from "@prisma/client";
import { d, type Base } from "../base";

/**
 * Plan area (06 Client Assessment Plan): the 06 client states on roster clients, Jayraj's
 * in person availability, and capture wizard state for Diya (resume) and Ishaan (retake).
 *   Neel   → aarav_welcome   (intake + capture Not started, Mumbai, recommendation shown)
 *   Rhea   → aarav_submitted (capture Submitted Mon 5 Oct, recommendation shown with Jayraj's note)
 *   Tara   → aarav_payment   (in person module Waiting for payment)
 *   Vikram → aarav_dismissed (continue online only on Tue 6 Oct)
 *   Kavya  → intake in progress (answers are the Access area's)
 *   Dhruv  → in person Booked today · Nikhil → live video session Booked today
 */
export default async function seedPlan(db: PrismaClient, base: Base) {
  const { jayraj, tic, samyah } = base;
  const byEmail = (email: string) => db.clientProfile.findFirst({ where: { user: { email } } });
  const NOTE = "Your videos show the right hip turning less than the left. I would like to measure it by hand before writing your report.";

  async function ensurePlan(clientId: string, at = "2026-09-28 10:00") {
    const existing = await db.assessmentPlan.findFirst({ where: { clientId, kind: "BASELINE" }, orderBy: { createdAt: "desc" } });
    if (existing) return existing;
    const plan = await db.assessmentPlan.create({ data: { clientId, kind: "BASELINE", sentVersion: 1, createdAt: d(at) } });
    await db.planVersion.create({ data: { planId: plan.id, version: 1, summary: "Default plan: Intake, Online Capture", byName: "System", createdAt: d(at) } });
    return plan;
  }

  async function mod(planId: string, key: string, status: ModuleStatus, extra: Partial<Prisma.PlanModuleUncheckedCreateInput> = {}, family = key) {
    const t = await db.moduleTemplate.findFirst({ where: { family, status: "PUBLISHED" }, orderBy: { version: "desc" } });
    if (!t) return null;
    const count = await db.planModule.count({ where: { planId } });
    const data = {
      templateId: t.id,
      templateVersion: t.version,
      name: t.name,
      purpose: t.purpose,
      shortLine: t.shortLine,
      type: t.type,
      timeEstimate: t.timeEstimate,
      coverage: (t.coverage ?? []) as Prisma.InputJsonValue,
      addedBy: t.isDefault ? ("SYSTEM" as const) : ("PRACTITIONER" as const),
      locked: t.isDefault,
      paid: t.defaultPaid,
      priceLabel: t.defaultPaid ? "₹X,XXX" : null,
      status,
      ...extra,
    };
    const { planId: _p, key: _k, ...upd } = data as typeof data & { planId?: string; key?: string };
    void _p;
    void _k;
    return db.planModule.upsert({ where: { planId_key: { planId, key } }, create: { planId, key, order: key === "intake" ? 0 : key === "capture" ? 1 : count, ...data }, update: upd });
  }

  const recommended = { addedBy: "RECOMMENDED" as const, addedByName: "Jayraj", required: false, paid: true, priceLabel: "₹X,XXX" };
  const intakeDone = { intakeStep: 12, intakeCompletedAt: d("2026-09-29 20:10") };

  // ── Neel: welcome, nothing started, recommendation shown ──
  const neel = await byEmail("neel@example.com");
  if (neel) {
    const p = await ensurePlan(neel.id, "2026-10-06 10:00");
    await mod(p.id, "intake", "NOT_STARTED");
    await mod(p.id, "capture", "NOT_STARTED");
    await db.clientProfile.update({ where: { id: neel.id }, data: { recommendation: "SHOWN", recommendationAt: d("2026-10-06 10:00"), stage: "ONBOARDING", assessmentStatus: "INTAKE_REQUIRED", intakeStep: 0, intakeCompletedAt: null } });
    await consents(db, neel.id, true);
  }

  // ── Rhea: capture submitted Mon 5 Oct, recommendation shown with Jayraj's note ──
  const rhea = await byEmail("rhea@example.com");
  if (rhea) {
    const p = await ensurePlan(rhea.id);
    await mod(p.id, "intake", "DONE");
    await mod(p.id, "capture", "SUBMITTED", { submittedAt: d("2026-10-05 18:00"), progressDone: 12, progressTotal: 12, extraLine: "Submitted Mon 5 Oct. Jayraj is reviewing it." });
    await db.clientProfile.update({ where: { id: rhea.id }, data: { ...intakeDone, recommendation: "SHOWN", recommendationAt: d("2026-10-05 20:30"), recommendationNote: NOTE, assessmentStatus: "PRACTITIONER_REVIEW" } });
    await consents(db, rhea.id, true);
    await db.outboxMessage.create({
      data: { clientId: rhea.id, toAddress: rhea.mobile ?? "+91 98XXX XXXXX", channel: "WHATSAPP", template: "in_person_recommended", body: "Hi Rhea, thanks for sending your capture. Since you are near Samyah Borivali, we recommend an in person session next. It is paid and optional. See why: aditus.in/a/rhea", status: "SENT", createdAt: d("2026-10-05 20:30") },
    });
  }

  // ── Tara: in person added, waiting for payment ──
  const tara = await byEmail("tara@example.com");
  if (tara) {
    const p = await ensurePlan(tara.id);
    await mod(p.id, "intake", "DONE");
    await mod(p.id, "capture", "SUBMITTED", { submittedAt: d("2026-10-05 18:00"), progressDone: 12, progressTotal: 12, extraLine: "Submitted Mon 5 Oct. Jayraj is reviewing it." });
    await mod(p.id, "inperson", "WAITING_FOR_PAYMENT", { ...recommended, order: 2, extraLine: "Your slot is not held until payment is done." });
    await db.clientProfile.update({ where: { id: tara.id }, data: { ...intakeDone, recommendation: "WAITING_FOR_PAYMENT", recommendationAt: d("2026-10-06 19:15"), recommendationNote: NOTE, assessmentStatus: "PRACTITIONER_REVIEW" } });
    await consents(db, tara.id, true);
    await db.checkout.create({ data: { clientId: tara.id, productSlug: "in-person-session", purpose: "in_person", returnTo: "/assessment/in-person?step=centre", createdAt: d("2026-10-06 19:15") } });
  }

  // ── Vikram: recommendation dismissed Tue 6 Oct, online only ──
  const vikram = await byEmail("vikram@example.com");
  if (vikram) {
    const p = await ensurePlan(vikram.id);
    await mod(p.id, "intake", "DONE");
    await mod(p.id, "capture", "SUBMITTED", { submittedAt: d("2026-10-05 18:00"), progressDone: 12, progressTotal: 12, extraLine: "Submitted Mon 5 Oct. Jayraj is reviewing it." });
    await db.clientProfile.update({ where: { id: vikram.id }, data: { ...intakeDone, recommendation: "DISMISSED", recommendationAt: d("2026-10-06 09:40"), recommendationNote: NOTE, assessmentStatus: "PRACTITIONER_REVIEW" } });
    await consents(db, vikram.id, true);
  }

  // ── Kavya: intake in progress (Access area seeds her answers and the default plan) ──
  const kavya = await byEmail("kavya@example.com");
  if (kavya) {
    const p = await ensurePlan(kavya.id, "2026-10-06 18:05");
    const intake = await db.planModule.findFirst({ where: { planId: p.id, key: "intake" } });
    if (!intake) await mod(p.id, "intake", "IN_PROGRESS");
    if (!(await db.planModule.findFirst({ where: { planId: p.id, key: "capture" } }))) await mod(p.id, "capture", "NOT_STARTED");
  }

  // ── Dhruv: intake Done, capture Submitted, in person Booked today (Lifecycle/Day seed the session) ──
  const dhruv = await byEmail("dhruv@example.com");
  if (dhruv) {
    const p = await ensurePlan(dhruv.id);
    await mod(p.id, "intake", "DONE");
    await mod(p.id, "capture", "SUBMITTED", { submittedAt: d("2026-10-03 19:10"), progressDone: 12, progressTotal: 12 });
    const ip = await mod(p.id, "inperson", "BOOKED", { ...recommended, order: 2, dueAt: d("2026-10-07 20:30"), dueLabel: "Today · TIC Kandivali", extraLine: "Wed 7 Oct · 8:30 PM · TIC Kandivali · with Jayraj" });
    if (ip) await db.session.updateMany({ where: { clientId: dhruv.id, type: "IN_PERSON_ASSESSMENT", planModuleId: null }, data: { planModuleId: ip.id } });
    await db.clientProfile.update({ where: { id: dhruv.id }, data: { ...intakeDone, recommendation: "BOOKED", recommendationAt: d("2026-10-03 20:00") } });
  }

  // ── Nikhil (Delhi): intake Done, capture Submitted, live video session Booked today ──
  const nikhil = await byEmail("nikhil@example.com");
  if (nikhil) {
    const p = await ensurePlan(nikhil.id);
    await mod(p.id, "intake", "DONE");
    await mod(p.id, "capture", "SUBMITTED", { submittedAt: d("2026-10-04 21:00"), progressDone: 12, progressTotal: 12 });
    const live = await mod(p.id, "live", "BOOKED", { addedBy: "PRACTITIONER", addedByName: "Jayraj", order: 2, dueAt: d("2026-10-07 20:30"), dueLabel: "Today · 8:30 PM", note: "Your squat video was hard to read from one angle. I want to watch it live and talk through your knee.", extraLine: "Wed 7 Oct · 8:30 PM · Live video · with Jayraj" });
    if (live) await db.session.updateMany({ where: { clientId: nikhil.id, type: "LIVE_VIDEO", planModuleId: null }, data: { planModuleId: live.id } });
    await db.clientProfile.update({ where: { id: nikhil.id }, data: { ...intakeDone } });
  }

  // ── Diya: Online Capture in progress, resumable in the wizard ──
  const diya = await byEmail("diya@example.com");
  if (diya) {
    const cap = await db.planModule.findFirst({ where: { plan: { clientId: diya.id, kind: "BASELINE" }, key: "capture" } });
    if (cap) {
      const assessment = (await db.assessment.findFirst({ where: { clientId: diya.id, kind: "BASELINE" } })) ?? (await db.assessment.create({ data: { clientId: diya.id, kind: "BASELINE", format: "ONLINE", date: d("2026-10-06 17:00"), practitionerId: base.shimyu.id } }));
      const media: Record<string, string> = {};
      for (const [view, kind, label, at] of [
        ["front", "PHOTO", "Front photo", "2026-10-06 17:05"],
        ["left", "PHOTO", "Left side photo", "2026-10-06 17:07"],
        ["squat", "VIDEO", "Overhead squat video", "2026-10-06 17:20"],
        ["balL", "VIDEO", "Balance, left video", "2026-10-06 17:24"],
        ["balR", "VIDEO", "Balance, right video", "2026-10-06 17:26"],
      ] as const) {
        const m = await db.mediaAsset.create({ data: { clientId: diya.id, moduleKey: "capture", kind, view, label, durationS: kind === "VIDEO" ? 18 : null, capturedAt: d(at) } });
        media[view] = m.id;
      }
      const mv = (testKey: string, value: number | null, unit: string, side: "LEFT" | "RIGHT" | "NONE" = "NONE", text?: string) => ({
        clientId: diya.id,
        assessmentId: assessment.id,
        testKey,
        side,
        value,
        text,
        unit,
        tag: "SELF_REPORTED" as const,
        source: "self_test",
        method: "Self timed at home",
        capturedAt: d("2026-10-06 17:40"),
      });
      await db.measureValue.createMany({ data: [mv("hold", 24.3, "s"), mv("rate", 14, "/min"), mv("nasal", null, "", "NONE", "Partly"), mv("balance", 21.6, "s", "RIGHT")], skipDuplicates: true });
      const capture = { done: ["front", "left", "squat", "balL", "balR", "hold", "bpm", "nasal", "bal"], media, values: { hold: 24.3, bpm: 14, nasal: "Partly", bal: { R: 21.6 } } };
      await db.planModule.update({ where: { id: cap.id }, data: { progressDone: 9, progressTotal: 12, extraLine: "9 of 12 items done. Everything so far is saved.", data: { capture } } });
    }
    await consents(db, diya.id, true);
  }

  // ── Ishaan: capture More needed (retake of the side photos) ──
  const ishaan = await byEmail("ishaan@example.com");
  if (ishaan) {
    const cap = await db.planModule.findFirst({ where: { plan: { clientId: ishaan.id, kind: "BASELINE" }, key: "capture" } });
    if (cap) {
      const media: Record<string, string> = {};
      for (const [view, kind, label] of [
        ["front", "PHOTO", "Front photo"],
        ["left", "PHOTO", "Left side photo"],
        ["right", "PHOTO", "Right side photo"],
        ["back", "PHOTO", "Back photo"],
        ["squat", "VIDEO", "Overhead squat video"],
        ["balL", "VIDEO", "Balance, left video"],
        ["balR", "VIDEO", "Balance, right video"],
        ["bend", "VIDEO", "Bend forward video"],
      ] as const) {
        const m = await db.mediaAsset.create({ data: { clientId: ishaan.id, moduleKey: "capture", kind, view, label, durationS: kind === "VIDEO" ? 16 : null, status: view === "left" || view === "right" ? "RETAKE_REQUESTED" : "ACCEPTED", retakeReason: view === "left" || view === "right" ? "Blurred" : null, capturedAt: d("2026-10-04 19:00") } });
        media[view] = m.id;
      }
      const capture = { done: ["front", "left", "right", "back", "squat", "balL", "balR", "bend", "hold", "bpm", "nasal", "bal"], media, values: { hold: 31.2, bpm: 12, nasal: "Yes", bal: { L: 28.4, R: 30 } } };
      await db.planModule.update({ where: { id: cap.id }, data: { progressDone: 12, progressTotal: 12, submittedAt: d("2026-10-04 19:10"), data: { capture } } });
    }
    await consents(db, ishaan.id, true);
  }

  // ── Jayraj's in person availability (06 G, at each centre) ──
  const slots = ["2026-10-09 07:00", "2026-10-09 17:30", "2026-10-10 09:00", "2026-10-10 11:00", "2026-10-12 07:30", "2026-10-12 18:00"];
  for (const centre of [tic, samyah]) {
    for (const at of slots) {
      const exists = await db.availabilitySlot.findFirst({ where: { staffId: jayraj.id, centreId: centre.id, startsAt: d(at) } });
      // Aarav already holds Sat 10 Oct 9:00 AM at TIC Kandivali.
      const taken = centre.id === tic.id && at === "2026-10-10 09:00";
      if (!exists) await db.availabilitySlot.create({ data: { staffId: jayraj.id, centreId: centre.id, startsAt: d(at), minutes: 120, online: false, taken } });
    }
  }
}

/** Photo consents granted at setup unless an earlier area recorded a choice. */
async function consents(db: PrismaClient, clientId: string, granted: boolean) {
  for (const kind of ["PHOTOS_VIDEOS", "ASSESSMENT_MEDIA", "ASSESSMENT_AGREEMENT"] as const) {
    const has = await db.consent.findUnique({ where: { clientId_kind: { clientId, kind } } });
    if (!has) await db.consent.create({ data: { clientId, kind, granted, source: "setup", changedAt: d("2026-09-28 10:05") } });
  }
}
