import type { PrismaClient, Prisma, ConsentKind } from "@prisma/client";
import { d, type Base } from "../base";
import { defaultPhases, type Phase } from "../../../src/components/client/day/phases";

/**
 * Day area (04 assessment day + 02 live video session).
 * Meera: in person today 5:30 PM, checked in 5:22 PM, Movement in progress, 9 of 24 captured.
 * Dhruv: in person today 8:30 PM, not checked in, photo consent off.
 * Nikhil: online only, photo consent on.
 * Ishaan: a missed live video session yesterday (missed state).
 */
export default async function seedDayof(db: PrismaClient, base: Base) {
  const { jayraj, tic } = base;
  const byEmail = (email: string) => db.clientProfile.findFirst({ where: { user: { email } } });
  const dayStart = d("2026-10-07 00:00");
  const dayEnd = d("2026-10-08 00:00");

  const consent = async (clientId: string, kinds: Partial<Record<ConsentKind, boolean>>) => {
    for (const [kind, granted] of Object.entries(kinds)) {
      await db.consent.upsert({
        where: { clientId_kind: { clientId, kind: kind as ConsentKind } },
        update: { granted: !!granted },
        create: { clientId, kind: kind as ConsentKind, granted: !!granted, source: "setup", changedAt: d("2026-09-01 10:00") },
      });
    }
  };

  /** Find the client's session today (Shell / earlier seeds may have created it) or create it. */
  const sessionToday = async (clientId: string, where: Prisma.SessionWhereInput, create: Omit<Prisma.SessionUncheckedCreateInput, "clientId">) => {
    const found = await db.session.findFirst({ where: { clientId, startsAt: { gte: dayStart, lt: dayEnd }, status: { notIn: ["CANCELLED", "RESCHEDULED"] }, ...where }, orderBy: { startsAt: "asc" } });
    return found ?? db.session.create({ data: { clientId, ...create } });
  };

  // ── Meera Shah: in person today, assessment in progress ──
  const meera = await byEmail("meera@example.com");
  if (meera) {
    const s = await sessionToday(meera.id, { online: false }, { type: "IN_PERSON_ASSESSMENT", title: "In person session", startsAt: d("2026-10-07 17:30"), durationMin: 120, status: "CONFIRMED", coachId: jayraj.id, centreId: tic.id });
    const phases: Phase[] = defaultPhases("Jayraj").map((p, i) => ({ ...p, state: i < 2 ? "DONE" : i === 2 ? "CURRENT" : "PENDING" }));
    phases[0].line = "Arrived 5:22 PM";
    phases[1].line = "Your goals and the knee";
    const a = await db.assessment.create({
      data: {
        clientId: meera.id,
        kind: "BASELINE",
        format: "IN_PERSON",
        date: s.startsAt,
        practitionerId: jayraj.id,
        centreId: tic.id,
        phase: "movement",
        measuresTotal: 24,
        phases: phases as unknown as Prisma.InputJsonValue,
        testKeys: ["hipIR", "hipER", "ankle", "tspine", "overhead", "squat", "balance", "foot", "knee", "posture", "hold", "rate", "exhale", "ribsUpper", "ribs", "nasal", "pattern", "rhr", "sleep", "stress", "goblet", "pushup", "plank", "vjump"],
      },
    });
    const at = (m: number) => new Date(d("2026-10-07 18:05").getTime() + m * 60_000);
    const mv = (testKey: string, side: "LEFT" | "RIGHT" | "NONE", value: number, unit: string, m: number) => ({ clientId: meera.id, assessmentId: a.id, testKey, side, value, unit, tag: "MEASURED" as const, method: "Inclinometer", source: "console", capturedBy: "Jayraj", capturedAt: at(m) });
    await db.measureValue.createMany({
      data: [
        mv("hipIR", "RIGHT", 24, "°", 0),
        mv("hipIR", "LEFT", 35, "°", 1),
        mv("hipER", "RIGHT", 38, "°", 3),
        mv("hipER", "LEFT", 41, "°", 4),
        mv("ankle", "RIGHT", 34, "°", 6),
        mv("ankle", "LEFT", 38, "°", 7),
        mv("tspine", "RIGHT", 40, "°", 9),
        mv("tspine", "LEFT", 46, "°", 10),
        { ...mv("squat", "NONE", 2, "/3", 13), tag: "OBSERVED" as const, method: "Watched front and side" },
      ],
    });
    await db.session.update({ where: { id: s.id }, data: { checkedInAt: d("2026-10-07 17:22"), assessmentId: a.id, status: "CONFIRMED" } });
    await consent(meera.id, { PHOTOS_VIDEOS: true, ASSESSMENT_MEDIA: true });
    await db.activityLog.create({ data: { clientId: meera.id, actorName: "Meera Shah", action: "Checked in at TIC Kandivali · I am here", createdAt: d("2026-10-07 17:22") } });
  }

  // ── Dhruv Malhotra: in person today 8:30 PM, not checked in ──
  const dhruv = await byEmail("dhruv@example.com");
  if (dhruv) {
    const s = await sessionToday(dhruv.id, { online: false }, { type: "IN_PERSON_ASSESSMENT", title: "In person session", startsAt: d("2026-10-07 20:30"), durationMin: 120, status: "CONFIRMED", coachId: jayraj.id, centreId: tic.id });
    const a = await db.assessment.create({ data: { clientId: dhruv.id, kind: "BASELINE", format: "IN_PERSON", date: s.startsAt, practitionerId: s.coachId ?? jayraj.id, centreId: s.centreId ?? tic.id, measuresTotal: 24 } });
    await db.session.update({ where: { id: s.id }, data: { assessmentId: a.id, checkedInAt: null } });
    await consent(dhruv.id, { PHOTOS_VIDEOS: false, ASSESSMENT_MEDIA: false });
  }

  // ── Nikhil Bose: online only, photo consent on (no live session) ──
  const nikhil = await byEmail("nikhil@example.com");
  if (nikhil) await consent(nikhil.id, { PHOTOS_VIDEOS: true, ASSESSMENT_MEDIA: true });

}
