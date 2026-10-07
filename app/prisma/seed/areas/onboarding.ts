import type { Prisma, PrismaClient } from "@prisma/client";
import { d, type Base } from "../base";
import { provisionCore, createDefaultPlan } from "../../../src/server/onboarding/provisionCore";
import { welcomeEmail, appUrl } from "../../../src/server/onboarding/emails";
import { paidUrl } from "../../../src/server/onboarding/tokens";
import { SAFETY_ITEMS, type IntakeAnswers } from "../../../src/server/onboarding/intakeDefs";

/**
 * Access (01) and Intake (03) demo states. Enriches roster clients by email.
 *  - Zara Khan: paid on Shopify, account not set up. Deterministic setup link /setup/zara-setup-demo
 *    (valid 48 h from the order), Order + Invoice + default plan, login details email in the outbox.
 *  - Kavya Menon: intake half done (steps 0 to 5 answered, resumes at 6), plan intake In progress.
 *  - Aarav, Ishaan, Diya, Meera: complete intake answers for the staff Intake tab (upsert by [clientId, key]).
 */

const ZARA_TOKEN = "zara-setup-demo";
const ZARA_TEMP_PASSWORD = "zaratemp2026";

type Sections = Record<string, IntakeAnswers>;

async function upsertSections(db: PrismaClient, clientId: string, sections: Sections, at: Date, skipped: string[] = []) {
  for (const [key, answers] of Object.entries(sections)) {
    const prev = await db.intakeSection.findUnique({ where: { clientId_key: { clientId, key } } });
    const merged = { ...((prev?.answers as object) ?? {}), ...answers } as Prisma.InputJsonValue;
    await db.intakeSection.upsert({
      where: { clientId_key: { clientId, key } },
      create: { clientId, key, answers: merged, skipped: skipped.includes(key), completedAt: at },
      update: { answers: merged, completedAt: prev?.completedAt ?? at },
    });
  }
  for (const key of skipped) {
    await db.intakeSection.upsert({ where: { clientId_key: { clientId, key } }, create: { clientId, key, answers: {}, skipped: true, completedAt: at }, update: {} });
  }
}

const byEmail = (db: PrismaClient, email: string) => db.clientProfile.findFirst({ where: { user: { email } }, include: { user: true } });

async function zara(db: PrismaClient) {
  const c = await byEmail(db, "zara@example.com");
  if (!c) return;
  const at = d("2026-10-07 17:42");
  await db.clientProfile.update({
    where: { id: c.id },
    data: { accountSetupDone: false, setupStep: 1, stage: "ASSESSMENT_PURCHASED", assessmentStatus: "PURCHASED", whatsappUpdates: false, preferredCentreId: null, mobile: "+91 98765 43210", city: "Andheri, Mumbai", pin: "400053" },
  });
  // Pick an order number nobody else seeded.
  let n = 4495;
  while (await db.order.findUnique({ where: { number: `#ADT${n}` } })) n++;
  const r = await provisionCore(
    db,
    { email: "zara@example.com", name: "Zara Khan", mobile: "9876543210", city: "Andheri, Mumbai", pin: "400053", productSlug: "online-assessment", orderNumber: `ADT${n}`, paymentMethod: "UPI" },
    { at, rawToken: ZARA_TOKEN, tempPassword: ZARA_TEMP_PASSWORD },
  );
  if (!r.rawToken) return;
  const mail = welcomeEmail({ first: "Zara", email: "zara@example.com", item: r.order.item, productLine: r.order.productLine, setupUrl: appUrl(`/setup/${ZARA_TOKEN}`), tempPassword: ZARA_TEMP_PASSWORD, orderNumber: r.order.number });
  await db.outboxMessage.create({ data: { clientId: c.id, toAddress: "zara@example.com", channel: "EMAIL", template: "welcome_setup", subject: mail.subject, body: mail.body, status: "SENT", createdAt: at } });
  console.log(`    Zara setup link: ${appUrl(`/setup/${ZARA_TOKEN}`)}  (temporary password ${ZARA_TEMP_PASSWORD})`);
  console.log(`    Zara paid page:  ${appUrl(paidUrl(r.order.number))}`);
}

async function kavya(db: PrismaClient) {
  const c = await byEmail(db, "kavya@example.com");
  if (!c) return;
  const setupAt = d("2026-10-06 18:05");
  await db.clientProfile.update({
    where: { id: c.id },
    data: { intakeStep: 6, intakeCompletedAt: null, assessmentStatus: "INTAKE_REQUIRED", stage: "ONBOARDING", whatsappUpdates: true, mobile: "+91 98200 11223", dateOfBirth: d("1994-07-21"), emergencyName: "Arun Menon, brother", emergencyPhone: "+91 98XXX XXXXX" },
  });
  await upsertSections(
    db,
    c.id,
    {
      goals: { groups: { "Pick any": ["Carry my kids without a sore back", "Get stronger"] }, text: "Pick up my daughter without my back locking up." },
      activity: { groups: { "Days you move on purpose": ["2"], "What you do": ["Walking", "Yoga"] } },
      history: { groups: { "Have you trained with a coach?": ["A little"], "Longest you have trained without a break": ["3 to 12 months"] } },
      concerns: { summary: "Lower back · 4 of 10 · Sitting long, Mornings" },
      injuries: { summary: "Left ankle sprain · Nov 2024 · Left · Rest, Physio", sides: {} },
      sleep: { groups: { "Hours on a normal night": ["6 to 7"], "How do you wake up?": ["Okay"] } },
    },
    d("2026-10-06 18:30"),
  );
  if (!(await db.bodyConcern.count({ where: { clientId: c.id } }))) await db.bodyConcern.create({ data: { clientId: c.id, region: "C:lowback", side: "NONE", intensity: 4, when: ["Sitting long", "Mornings"] } });
  if (!(await db.injury.count({ where: { clientId: c.id } }))) await db.injury.create({ data: { clientId: c.id, description: "Left ankle sprain", occurredOn: "2024-11", side: "LEFT", treatments: ["REST", "PHYSIO"], treatmentNote: "Rest, Physio", createdAt: d("2026-10-06 18:20") } });
  const plan = await createDefaultPlan(db, c.id, setupAt);
  await db.planModule.updateMany({ where: { planId: plan.id, key: "intake" }, data: { status: "IN_PROGRESS", progressDone: 6, progressTotal: 10, extraLine: "6 of 10 sections done. Everything so far is saved." } });
  // Intake reminders from account setup: 24 h WhatsApp already sent, 72 h email still queued.
  const wa = await db.outboxMessage.create({ data: { clientId: c.id, toAddress: "+91 98200 11223", channel: "WHATSAPP", template: "intake_unfinished_24h", body: `Hi Kavya, your intake is saved where you left it. It takes about XX min to finish: ${appUrl("/intake")}`, status: "SENT", sendAt: d("2026-10-07 18:05"), createdAt: setupAt } });
  const em = await db.outboxMessage.create({ data: { clientId: c.id, toAddress: "kavya@example.com", channel: "EMAIL", template: "intake_unfinished_72h", subject: "Your intake is waiting", body: `Hi Kavya,\n\nYour intake is saved where you left it. Finish it and you can book your assessment.\n\nContinue →\n${appUrl("/intake")}`, status: "QUEUED", sendAt: d("2026-10-09 18:05"), createdAt: setupAt } });
  await db.scheduledReminder.createMany({ data: [{ outboxMessageId: wa.id, clientId: c.id, kind: "intake_24h" }, { outboxMessageId: em.id, clientId: c.id, kind: "intake_72h" }] });
}

const FULL: Record<string, { sections: Sections; at: string; concern?: [string, "LEFT" | "RIGHT" | "NONE", number, string[]]; injury?: [string, string, "LEFT" | "RIGHT" | "NONE", string[], string] }> = {
  "aarav@example.com": {
    at: "2026-08-26 20:05",
    sections: {
      goals: { groups: { "Pick any": ["Run without knee pain", "Lift overhead"] }, text: "Run a 10 km without my knee hurting." },
      activity: { groups: { "Days you move on purpose": ["3"], "What you do": ["Gym", "Running", "Football"] } },
      history: { groups: { "Have you trained with a coach?": ["A little"], "Longest you have trained without a break": ["3 to 12 months"] } },
      concerns: { summary: "Right knee · 6 of 10 · Squatting, Running" },
      injuries: { summary: "Right knee, meniscus tear · Mar 2023 · Right · Physio, 8 weeks" },
      sleep: { groups: { "Hours on a normal night": ["6 to 7"], "How do you wake up?": ["Tired"] } },
      recovery: { groups: { "The morning after hard exercise": ["A bit sore"], "Soreness usually lasts": ["2 days"] } },
      stress: { groups: { "A typical work week feels": ["Heavy"], "Hours sitting on a work day": ["Over 8"] } },
      sport: { groups: { "Pick any": ["Football", "Running events"], "How often": ["Weekly"] } },
      better: { groups: { "Pick one": ["Move without pain"] }, text: "My knee swells after football on Sundays." },
      safety: { items: { surgery: "no", chest: "no", heart: "no", preg: "no", meds: "no", knee: "yes" }, notes: { knee: "Right meniscus tear 2023, physio 8 weeks." } },
      agreement: { agreed: true, photos: true, version: "2026-08" },
    },
  },
  "ishaan@example.com": {
    at: "2026-09-29 09:55",
    concern: ["R:knee", "RIGHT", 4, ["Stairs", "Running"]],
    injury: ["Right knee, patellar tendon pain", "2025-03", "RIGHT", ["PHYSIO"], "Physio, MRI in 2025"],
    sections: {
      goals: { groups: { "Pick any": ["Play football without niggles", "Get stronger"] }, text: "Play a full 5 a side game again." },
      activity: { groups: { "Days you move on purpose": ["4"], "What you do": ["Gym", "Football"] } },
      history: { groups: { "Have you trained with a coach?": ["Yes, recently"], "Longest you have trained without a break": ["Over a year"] } },
      concerns: { summary: "Right knee · 4 of 10 · Stairs, Running" },
      injuries: { summary: "Right knee, patellar tendon pain · Mar 2025 · Right · Physio" },
      sleep: { groups: { "Hours on a normal night": ["7 to 8"], "How do you wake up?": ["Okay"] } },
      recovery: { groups: { "The morning after hard exercise": ["A bit sore"], "Soreness usually lasts": ["A day"] } },
      stress: { groups: { "A typical work week feels": ["Steady"], "Hours sitting on a work day": ["4 to 8"] } },
      sport: { groups: { "Pick any": ["Football", "Badminton"], "How often": ["Weekly"] } },
      better: { groups: { "Pick one": ["Play my sport better"] } },
      safety: { items: { surgery: "no", chest: "no", heart: "no", preg: "no", meds: "no", knee: "yes" }, notes: { knee: "Knee MRI in 2025, patellar tendon." } },
      agreement: { agreed: true, photos: true, version: "2026-08" },
    },
  },
  "diya@example.com": {
    at: "2026-10-02 07:55",
    concern: ["C:neck", "NONE", 3, ["Sitting long", "Mornings"]],
    sections: {
      goals: { groups: { "Pick any": ["Sleep better", "Get stronger"] }, text: "Feel less stiff after long flights." },
      activity: { groups: { "Days you move on purpose": ["2"], "What you do": ["Yoga", "Walking"] } },
      history: { groups: { "Have you trained with a coach?": ["Never"], "Longest you have trained without a break": ["Under 3 months"] } },
      concerns: { summary: "Neck · 3 of 10 · Sitting long, Mornings" },
      sleep: { groups: { "Hours on a normal night": ["5 to 6"], "How do you wake up?": ["Tired"] } },
      recovery: { groups: { "The morning after hard exercise": ["Very sore"], "Soreness usually lasts": ["3 days or more"] } },
      stress: { groups: { "A typical work week feels": ["Very heavy"], "Hours sitting on a work day": ["Over 8"] } },
      sport: { groups: { "Pick any": ["Swimming"], "How often": ["Now and then"] } },
      better: { groups: { "Pick one": ["Have more energy"] } },
      safety: { items: { surgery: "no", chest: "no", heart: "no", preg: "no", meds: "no", knee: "no" }, notes: {} },
      agreement: { agreed: true, photos: true, version: "2026-08" },
    },
  },
  "meera@example.com": {
    at: "2026-09-21 09:55",
    concern: ["L:delt", "LEFT", 5, ["After training"]],
    injury: ["Left shoulder, rotator cuff strain", "2024-06", "LEFT", ["PHYSIO", "INJECTION"], "Physio, Injection"],
    sections: {
      goals: { groups: { "Pick any": ["Lift overhead", "Trek in the hills"] }, text: "Trek to Kedarkantha in December." },
      activity: { groups: { "Days you move on purpose": ["5"], "What you do": ["Gym", "Running", "Cycling"] } },
      history: { groups: { "Have you trained with a coach?": ["Yes, for years"], "Longest you have trained without a break": ["Over a year"] } },
      concerns: { summary: "Left shoulder · 5 of 10 · After training" },
      injuries: { summary: "Left shoulder, rotator cuff strain · Jun 2024 · Left · Physio, Injection" },
      sleep: { groups: { "Hours on a normal night": ["7 to 8"], "How do you wake up?": ["Rested"] } },
      recovery: { groups: { "The morning after hard exercise": ["Fine"], "Soreness usually lasts": ["A day"] } },
      stress: { groups: { "A typical work week feels": ["Steady"], "Hours sitting on a work day": ["4 to 8"] } },
      sport: { groups: { "Pick any": ["Trekking", "Running events"], "How often": ["Monthly"] } },
      better: { groups: { "Pick one": ["Feel stronger"] } },
      safety: { items: { surgery: "no", chest: "no", heart: "no", preg: "no", meds: "no", knee: "yes" }, notes: { knee: "Left shoulder injection in 2024." } },
      agreement: { agreed: true, photos: false, version: "2026-08" },
    },
  },
};

async function fullIntakes(db: PrismaClient) {
  for (const [email, f] of Object.entries(FULL)) {
    const c = await byEmail(db, email);
    if (!c) continue;
    const at = d(f.at);
    await upsertSections(db, c.id, f.sections, at, f.sections.injuries ? [] : ["injuries"]);
    if (f.concern && !(await db.bodyConcern.count({ where: { clientId: c.id } }))) {
      const [region, side, intensity, when] = f.concern;
      await db.bodyConcern.create({ data: { clientId: c.id, region, side, intensity, when } });
    }
    if (f.injury && !(await db.injury.count({ where: { clientId: c.id } }))) {
      const [description, occurredOn, side, treatments, treatmentNote] = f.injury;
      await db.injury.create({ data: { clientId: c.id, description, occurredOn, side, treatments, treatmentNote, createdAt: at } });
    }
    const yes = Object.entries(f.sections.safety?.items ?? {}).filter(([, v]) => v === "yes");
    if (yes.length && !(await db.safetyFlag.count({ where: { clientId: c.id } }))) {
      for (const [k] of yes) await db.safetyFlag.create({ data: { clientId: c.id, item: SAFETY_ITEMS.find((i) => i.key === k)?.q ?? k, note: f.sections.safety?.notes?.[k], createdAt: at } });
    }
    const agr = f.sections.agreement;
    if (agr) {
      for (const [kind, granted] of [["ASSESSMENT_AGREEMENT", !!agr.agreed], ["ASSESSMENT_MEDIA", !!agr.photos]] as const) {
        await db.consent.upsert({ where: { clientId_kind: { clientId: c.id, kind } }, create: { clientId: c.id, kind, granted, source: "intake", version: "2026-08", changedAt: at }, update: {} });
      }
    }
  }
}

export default async function seedOnboarding(db: PrismaClient, base: Base) {
  void base;
  await zara(db);
  await kavya(db);
  await fullIntakes(db);
}
