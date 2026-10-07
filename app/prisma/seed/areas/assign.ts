import type { PrismaClient } from "@prisma/client";
import { d, type Base } from "../base";

/**
 * Evaluation assignments (head of department → coach).
 * Ready to assign: Aarav, Dhruv, Rhea (capture submitted, no coach yet).
 * Nikhil → Rohit, evaluation half done. Tara → Neha, not started.
 * Existing reports keep their author as the assignee (Kabir with the head coach, Vikram returned to Jayraj).
 */
export default async function seedAssign(db: PrismaClient, base: Base) {
  const { shimyu, rohit, neha } = base;
  const byEmail = (email: string) => db.clientProfile.findFirst({ where: { user: { email } } });

  for (const r of await db.report.findMany({ where: { status: { not: "RELEASED" }, authorId: { not: null } } }))
    await db.report.update({ where: { id: r.id }, data: { assignedToId: r.authorId, assignedById: shimyu.id, assignedAt: r.createdAt } });

  const assign = async (email: string, coachId: string, at: string, evaluation: object = {}) => {
    const c = await byEmail(email);
    if (!c) return;
    await db.clientCoach.createMany({ data: [{ clientId: c.id, staffId: coachId, role: "ASSESSMENT" }], skipDuplicates: true });
    const a = await db.assessment.findFirst({ where: { clientId: c.id }, orderBy: { date: "desc" } });
    await db.report.create({
      data: { clientId: c.id, assessmentId: a?.id ?? null, kind: "BASELINE", status: "DRAFT", authorId: coachId, assignedToId: coachId, assignedById: shimyu.id, assignedAt: d(at), dueAt: d("2026-10-08 20:00"), createdAt: d(at), evaluation },
    });
  };
  await assign("nikhil@example.com", rohit.id, "2026-10-06 10:15", {
    values: { "front.a1": { v: 3 }, "front.a2": { v: "Fair" }, "front.a3": { v: "Option 1" }, "side.b1": { v: 4 } },
    summary: {},
    path: null,
  });
  await assign("tara@example.com", neha.id, "2026-10-07 09:40");
}
