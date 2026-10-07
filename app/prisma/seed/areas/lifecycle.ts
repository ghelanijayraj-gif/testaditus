import type { Prisma, PrismaClient, SessionStatus, SessionType } from "@prisma/client";
import { d, type Base } from "../base";
import { makePlan } from "../factory";

/**
 * Shell / lifecycle area (05): training plans, sessions with history, coach availability
 * and ratings for the 05 demo clients. Results and Records add measures, reports,
 * documents and health data for the same clients. All data is fictional.
 *
 * Pinned clock: Wed 7 Oct 2026, 7:52 PM IST.
 */
export default async function seedLifecycle(db: PrismaClient, base: Base) {
  const { tic, samyah, jayraj, shimyu } = base;
  const byEmail = (email: string) => db.clientProfile.findFirst({ where: { user: { email } } });
  const pt12 = await db.product.findUnique({ where: { slug: "pt-12" } });
  if (!pt12) return;

  type S = {
    on: string;
    type: SessionType;
    title: string;
    status: SessionStatus;
    coach?: "jayraj" | "shimyu" | null;
    min?: number;
    n?: number | null;
    online?: boolean;
    centre?: "tic" | "samyah" | null;
    room?: string;
    events?: [string, SessionStatus, string, string][];
    extra?: Partial<Prisma.SessionUncheckedCreateInput>;
  };
  const staffOf = (c: S["coach"]) => (c === "jayraj" ? jayraj : c === "shimyu" ? shimyu : null);
  const DUR: Partial<Record<SessionType, number>> = { PERSONAL_TRAINING: 60, GROUP_TRAINING: 60, REASSESSMENT: 90, BREATH_SESSION: 45, REVIEW_CALL: 20, COMMUNITY_EVENT: 120, IN_PERSON_ASSESSMENT: 120, LIVE_VIDEO: 30 };

  async function sessions(clientId: string, planId: string | null, list: S[]) {
    const out: Record<string, string> = {};
    for (const s of list) {
      const coach = s.coach === undefined ? (s.type === "BREATH_SESSION" || s.type === "REASSESSMENT" ? jayraj : s.type === "COMMUNITY_EVENT" ? null : shimyu) : staffOf(s.coach);
      const online = !!s.online;
      const centre = online || s.type === "COMMUNITY_EVENT" ? null : s.centre === "samyah" ? samyah : tic;
      const counted = s.type === "PERSONAL_TRAINING";
      const row = await db.session.create({
        data: {
          clientId,
          type: s.type,
          title: s.title,
          startsAt: d(s.on),
          durationMin: s.min ?? DUR[s.type] ?? 60,
          status: s.status,
          coachId: coach?.id ?? null,
          centreId: centre?.id ?? null,
          room: s.room,
          online,
          joinUrl: online ? s.extra?.joinUrl ?? null : null,
          clientPlanId: counted ? planId : null,
          sessionNumber: counted ? s.n ?? null : null,
          countsAgainstPlan: counted && s.n != null,
          bookedBy: s.type === "PERSONAL_TRAINING" ? "coach" : "front_desk",
          confirmedAt: s.status === "CONFIRMED" ? d(s.on.slice(0, 10) + " 08:02") : null,
          ...(s.extra ?? {}),
          createdAt: d("2026-09-14 10:12"),
        },
      });
      out[s.on + " " + s.title] = row.id;
      const booked: [string, SessionStatus, string, string] = [s.type === "PERSONAL_TRAINING" ? "Booked by Shimyu" : "Booked by the front desk", "SCHEDULED", s.type === "PERSONAL_TRAINING" ? "Shimyu" : "Sahil", "2026-09-14 10:12"];
      const ev = [booked, ...(s.events ?? [])];
      if (s.status === "DONE" && !s.events?.some((e) => e[1] === "DONE")) ev.push([`Marked done by ${coach?.id === jayraj.id ? "Jayraj" : coach ? "Shimyu" : "the ADITUS team"}`, "DONE", coach?.id === jayraj.id ? "Jayraj" : "Shimyu", addMin(s.on, s.min ?? DUR[s.type] ?? 60)]);
      for (const [note, status, byName, at] of ev) await db.sessionEvent.create({ data: { sessionId: row.id, status, note, byName, createdAt: d(at) } });
    }
    return out;
  }

  // ─────────── Ananya Iyer: PT 12, 7 of 12 used, next session Thu 8 Oct unconfirmed (IN 11 H) ───────────
  const ananya = await byEmail("ananya@example.com");
  if (ananya) {
    const plan = await db.clientPlan.create({
      data: { clientId: ananya.id, productId: pt12.id, name: "Personal Training · 12 sessions", startsAt: d("2026-09-14 09:00"), endsAt: d("2026-10-29 23:59"), sessionsTotal: 12, sessionsUsed: 7, coachId: shimyu.id, status: "ACTIVE", goal: "Run 10 km without knee pain", currentPhase: "Phase 2 · Load the right side", perWeek: "2 sessions a week", focusAreas: ["Right hip rotation under load", "Single leg strength", "Lower rib breathing"] },
    });
    const box = { extraInfo: "From Shimyu: we start with the box squat at 40 cm. Bring your toe spacers.", attachments: ["Box squat setup.mp4"] };
    const ids = await sessions(ananya.id, plan.id, [
      { on: "2026-09-16 07:30", type: "PERSONAL_TRAINING", title: "Personal Training", status: "DONE", n: 1 },
      { on: "2026-09-18 07:30", type: "PERSONAL_TRAINING", title: "Personal Training", status: "DONE", n: 2 },
      { on: "2026-09-21 07:30", type: "PERSONAL_TRAINING", title: "Personal Training", status: "DONE", n: 3 },
      { on: "2026-09-24 07:30", type: "PERSONAL_TRAINING", title: "Personal Training", status: "DONE", n: 4 },
      { on: "2026-09-28 07:30", type: "PERSONAL_TRAINING", title: "Personal Training", status: "DONE", n: 5 },
      { on: "2026-10-01 07:30", type: "PERSONAL_TRAINING", title: "Personal Training", status: "CANCELLED", n: null, events: [["Cancelled by you · Work came up", "CANCELLED", "Ananya Iyer", "2026-09-30 18:40"]], extra: { cancelReason: "Work came up" } },
      { on: "2026-10-02 18:30", type: "PERSONAL_TRAINING", title: "Personal Training", status: "DONE", n: 6 },
      { on: "2026-10-03 08:00", type: "GROUP_TRAINING", title: "Mobility Lab", status: "MISSED", events: [["Marked missed by Shimyu", "MISSED", "Shimyu", "2026-10-03 09:15"]] },
      { on: "2026-10-05 07:30", type: "PERSONAL_TRAINING", title: "Personal Training", status: "DONE", n: 7 },
      { on: "2026-10-08 07:30", type: "PERSONAL_TRAINING", title: "Personal Training", status: "SCHEDULED", n: 8, events: [["Reminder sent on WhatsApp", "SCHEDULED", "ADITUS", "2026-10-05 07:30"]], extra: box },
      { on: "2026-10-10 08:00", type: "GROUP_TRAINING", title: "Mobility Lab", status: "SCHEDULED" },
      { on: "2026-10-12 07:30", type: "PERSONAL_TRAINING", title: "Personal Training", status: "SCHEDULED", n: 9, extra: box },
      { on: "2026-10-13 19:00", type: "BREATH_SESSION", title: "Breath session · online", status: "SCHEDULED", online: true, extra: { joinUrl: "https://meet.aditus.in/ananya", beforeYouCome: "A quiet room, a mat, a camera that shows you from the side. Nothing to eat for an hour before." } },
      { on: "2026-10-15 07:30", type: "PERSONAL_TRAINING", title: "Personal Training", status: "SCHEDULED", n: 10 },
      { on: "2026-10-18 06:00", type: "COMMUNITY_EVENT", title: "Run and Plunge", status: "SCHEDULED", coach: null, room: "Juhu beach, near the lifeguard tower" },
      { on: "2026-10-19 07:30", type: "PERSONAL_TRAINING", title: "Personal Training", status: "SCHEDULED", n: 11 },
      { on: "2026-10-21 18:30", type: "REVIEW_CALL", title: "Review call", status: "SCHEDULED", coach: "shimyu", online: true, extra: { joinUrl: "https://meet.aditus.in/ananya" } },
      { on: "2026-10-24 08:00", type: "GROUP_TRAINING", title: "Mobility Lab", status: "SCHEDULED" },
      { on: "2026-11-01 06:00", type: "COMMUNITY_EVENT", title: "Breathe and Plunge", status: "SCHEDULED", coach: null, room: "Juhu beach, near the lifeguard tower" },
    ]);
    await db.sessionRating.create({ data: { clientId: ananya.id, sessionId: ids["2026-10-02 18:30 Personal Training"], score: 4, note: "Hip felt better by the last set.", createdAt: d("2026-10-02 20:10") } });
    await db.outboxMessage.create({ data: { clientId: ananya.id, toAddress: ananya.mobile ?? "+91 98XXX XXXXX", channel: "WHATSAPP", template: "session_reminder", body: "Hi Ananya, your Personal Training is Thu 8 Oct · 7:30 AM at TIC Kandivali. Please arrive 10 minutes early and wear clothes you can move in. Reply here if you need to change anything.", status: "SENT", createdAt: d("2026-10-05 07:30") } });
    await db.activityLog.createMany({
      data: [
        { clientId: ananya.id, actorName: "Shimyu", action: "Booked Personal Training sessions 1 to 12", createdAt: d("2026-09-14 10:12") },
        { clientId: ananya.id, actorName: "Ananya Iyer", action: "Cancelled Personal Training · Thu 1 Oct · 7:30 AM · Work came up", createdAt: d("2026-09-30 18:40") },
      ],
    });
  }

  // ─────────── Rohan Desai: PT 12, 10 used, ends Sun 11 Oct (expiring), session Fri 9 Oct, renewal due ───────────
  const rohan = await byEmail("rohan@example.com");
  if (rohan) {
    const plan = await db.clientPlan.create({
      data: { clientId: rohan.id, productId: pt12.id, name: "Personal Training · 12 sessions", startsAt: d("2026-08-27 09:00"), endsAt: d("2026-10-11 23:59"), sessionsTotal: 12, sessionsUsed: 10, coachId: shimyu.id, status: "EXPIRING_SOON", goal: "Get stronger for trekking", currentPhase: "Phase 3 · Build", perWeek: "2 sessions a week", focusAreas: ["Single leg strength", "Ankle mobility"] },
    });
    const days = ["2026-08-28", "2026-09-01", "2026-09-04", "2026-09-08", "2026-09-11", "2026-09-15", "2026-09-18", "2026-09-22", "2026-09-29", "2026-10-06"];
    await sessions(rohan.id, plan.id, [
      ...days.map((day, i): S => ({ on: `${day} 07:30`, type: "PERSONAL_TRAINING", title: "Personal Training", status: "DONE", n: i + 1, centre: i % 3 === 2 ? "samyah" : "tic" })),
      { on: "2026-10-09 08:30", type: "PERSONAL_TRAINING", title: "Personal Training", status: "SCHEDULED", n: 11 },
    ]);
  }

  // ─────────── Ishita Rao: cycle done → compare (plan Jul to Aug completed, reassessment Sat 3 Oct done) ───────────
  const ishita = await byEmail("ishita@example.com");
  if (ishita) {
    const plan = await db.clientPlan.create({
      data: { clientId: ishita.id, productId: pt12.id, name: "Personal Training · 12 sessions", startsAt: d("2026-07-06 09:00"), endsAt: d("2026-08-19 23:59"), sessionsTotal: 12, sessionsUsed: 12, coachId: shimyu.id, status: "COMPLETED", goal: "Move without pain", currentPhase: "Complete", perWeek: "2 sessions a week", focusAreas: ["Hip rotation", "Breathing"] },
    });
    const days = ["07-07", "07-10", "07-14", "07-17", "07-21", "07-24", "07-28", "07-31", "08-04", "08-07", "08-11", "08-14"];
    await sessions(ishita.id, plan.id, [
      { on: "2026-06-20 08:00", type: "IN_PERSON_ASSESSMENT", title: "In person session", status: "DONE", coach: "jayraj", min: 120 },
      ...days.map((md, i): S => ({ on: `2026-${md} 07:30`, type: "PERSONAL_TRAINING", title: "Personal Training", status: "DONE", n: i + 1 })),
      { on: "2026-10-03 08:00", type: "REASSESSMENT", title: "Reassessment", status: "DONE", coach: "jayraj", events: [["Confirmed by you", "CONFIRMED", "Ishita Rao", "2026-10-01 09:10"]] },
    ]);
  }

  // ─────────── Farah Ali: plan expired 30 Sep, declined renewal → grace ───────────
  const farah = await byEmail("farah@example.com");
  if (farah) {
    const plan = await db.clientPlan.create({
      data: { clientId: farah.id, productId: pt12.id, name: "Personal Training · 12 sessions", startsAt: d("2026-08-16 09:00"), endsAt: d("2026-09-30 23:59"), sessionsTotal: 12, sessionsUsed: 11, coachId: shimyu.id, status: "EXPIRED", renewalDecision: "declined", goal: "Return to running", focusAreas: ["Ankle mobility"] },
    });
    const days = ["08-18", "08-21", "08-25", "08-28", "09-01", "09-04", "09-08", "09-11", "09-15", "09-18", "09-22"];
    await sessions(farah.id, plan.id, days.map((md, i): S => ({ on: `2026-${md} 18:30`, type: "PERSONAL_TRAINING", title: "Personal Training", status: "DONE", n: i + 1, centre: "samyah" })));
    await db.clientProfile.update({ where: { id: farah.id }, data: { graceEndsAt: d("2026-10-30 23:59"), accessEndsAt: d("2026-10-30 23:59") } });
  }

  // ─────────── Omar Sheikh: access ended ───────────
  const omar = await byEmail("omar@example.com");
  if (omar) {
    const plan = await db.clientPlan.create({
      data: { clientId: omar.id, productId: pt12.id, name: "Personal Training · 12 sessions", startsAt: d("2026-06-15 09:00"), endsAt: d("2026-07-30 23:59"), sessionsTotal: 12, sessionsUsed: 12, coachId: shimyu.id, status: "EXPIRED", renewalDecision: "declined" },
    });
    await sessions(omar.id, plan.id, [{ on: "2026-07-28 07:30", type: "PERSONAL_TRAINING", title: "Personal Training", status: "DONE", n: 12 }]);
    await db.clientProfile.update({ where: { id: omar.id }, data: { graceEndsAt: d("2026-09-01 23:59"), accessEndsAt: d("2026-09-01 23:59") } });
  }

  // ─────────── Sana Patel: in person assessment done; baseline report released today (Results) ───────────
  const sana = await byEmail("sana@example.com");
  if (sana) {
    await sessions(sana.id, null, [{ on: "2026-10-03 09:00", type: "IN_PERSON_ASSESSMENT", title: "In person session", status: "DONE", coach: "jayraj", min: 120 }]);
  }

  // ─────────── Nikhil Bose: capture submitted, waiting for the coach evaluation ───────────
  const nikhil = await byEmail("nikhil@example.com");
  if (nikhil) {
    await db.clientCoach.createMany({ data: [{ clientId: nikhil.id, staffId: jayraj.id, role: "ASSESSMENT" }], skipDuplicates: true });
  }

  // ─────────── Dhruv Malhotra: in person today 8:30 PM at TIC Kandivali with Jayraj, not checked in (Day adds the assessment) ───────────
  const dhruv = await byEmail("dhruv@example.com");
  if (dhruv) {
    await db.clientCoach.createMany({ data: [{ clientId: dhruv.id, staffId: jayraj.id, role: "ASSESSMENT" }], skipDuplicates: true });
    const existing = await db.assessmentPlan.findFirst({ where: { clientId: dhruv.id, kind: "BASELINE" } });
    const ap =
      existing ??
      (await makePlan(db, dhruv.id, [
        { key: "intake", status: "DONE" },
        { key: "capture", status: "SUBMITTED", extra: { submittedAt: d("2026-10-03 19:10") } },
        { key: "inperson", status: "BOOKED", extra: { addedBy: "RECOMMENDED", addedByName: "Jayraj", required: false, paid: true, priceLabel: "₹X,XXX", dueLabel: "Today · TIC Kandivali", dueAt: d("2026-10-07 20:30") } },
      ]));
    const ip = await db.planModule.findFirst({ where: { planId: ap.id, key: "inperson" } });
    await sessions(dhruv.id, null, [
      {
        on: "2026-10-07 20:30",
        type: "IN_PERSON_ASSESSMENT",
        title: "In person session",
        status: "CONFIRMED",
        coach: "jayraj",
        min: 120,
        extra: { planModuleId: ip?.id, room: "Room 2", beforeYouCome: { wear: "Shorts and a fitted T shirt. You will be barefoot", bring: "Water, glasses if you wear them, any reports you have", eat: "A light meal 2 hours before" } },
        events: [["Confirmed by you", "CONFIRMED", "Dhruv Malhotra", "2026-10-06 18:00"]],
      },
    ]);
  }

  // ─────────── Coach availability (next 3 weeks + reassessment windows) ───────────
  const slots: Prisma.AvailabilitySlotCreateManyInput[] = [];
  const startKey = "2026-10-08";
  for (let i = 0; i < 28; i++) {
    const day = addDay(startKey, i);
    const wd = weekdayOf(day); // 0 Mon … 6 Sun
    if (wd === 6) continue;
    // Shimyu (Personal Training, 60 min)
    if (wd <= 4) slots.push({ staffId: shimyu.id, centreId: tic.id, startsAt: d(`${day} 07:30`), minutes: 60 });
    if (wd === 5) slots.push({ staffId: shimyu.id, centreId: tic.id, startsAt: d(`${day} 09:00`), minutes: 60 });
    if (wd === 0 || wd === 2) slots.push({ staffId: shimyu.id, centreId: samyah.id, startsAt: d(`${day} 18:30`), minutes: 60 });
    if (wd === 1 || wd === 3) slots.push({ staffId: shimyu.id, centreId: tic.id, startsAt: d(`${day} 06:30`), minutes: 60 });
  }
  // Jayraj (assessment and reassessment, 90 min) through the reassessment windows; skips Fri 9 to Mon 12 Oct (Plan area's in person slots).
  for (let i = 0; i < 50; i++) {
    const day = addDay("2026-10-13", i);
    const wd = weekdayOf(day);
    if (wd === 0 || wd === 2 || wd === 5) slots.push({ staffId: jayraj.id, centreId: wd === 2 && i % 2 === 1 ? samyah.id : tic.id, startsAt: d(`${day} 08:00`), minutes: 90 });
  }
  // Slots that clash with a seeded session are already taken.
  const busy = await db.session.findMany({ where: { coachId: { in: [shimyu.id, jayraj.id] }, startsAt: { gte: d("2026-10-08 00:00") }, status: { in: ["SCHEDULED", "CONFIRMED"] } }, select: { coachId: true, startsAt: true } });
  for (const sl of slots) sl.taken = busy.some((b) => b.coachId === sl.staffId && b.startsAt.getTime() === new Date(sl.startsAt as Date).getTime());
  await db.availabilitySlot.createMany({ data: slots });
}

function addMin(on: string, min: number) {
  const t = new Date(d(on).getTime() + min * 60_000);
  const ist = new Date(t.getTime() + 5.5 * 3_600_000).toISOString();
  return `${ist.slice(0, 10)} ${ist.slice(11, 16)}`;
}
function addDay(key: string, n: number) {
  const [y, m, dd] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd + n)).toISOString().slice(0, 10);
}
function weekdayOf(key: string) {
  const [y, m, dd] = key.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, dd)).getUTCDay() + 6) % 7;
}
