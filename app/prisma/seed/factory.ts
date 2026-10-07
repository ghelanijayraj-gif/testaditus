import type { Prisma, PrismaClient, ModuleStatus } from "@prisma/client";
import { d, type Base } from "./base";

let codeN = 150;

/** Create a client account + profile. Sample data is fictional. */
export async function makeClient(
  db: PrismaClient,
  base: Base,
  p: {
    email: string;
    first: string;
    last: string;
    city?: string;
    pin?: string;
    mumbai?: boolean;
    profile?: Partial<Prisma.ClientProfileUncheckedCreateInput>;
    password?: boolean;
    created?: string;
  },
) {
  codeN += 1;
  const u = await db.user.create({
    data: {
      email: p.email,
      name: `${p.first} ${p.last}`,
      kind: "CLIENT",
      emailVerified: new Date(),
      passwordHash: p.password === false ? null : base.pw,
      signInMethod: "EMAIL_LINK",
      createdAt: p.created ? d(p.created) : undefined,
      client: {
        create: {
          code: `AD ${String(codeN).padStart(4, "0")}`,
          firstName: p.first,
          lastName: p.last,
          city: p.city,
          pin: p.pin,
          inMumbaiArea: !!p.mumbai,
          accountSetupDone: true,
          setupStep: 4,
          mobile: "+91 98XXX XXXXX",
          ...(p.profile ?? {}),
        } as Prisma.ClientProfileCreateWithoutUserInput,
      },
    },
    include: { client: true },
  });
  return u.client!;
}

type Mod = {
  key: string;
  family?: string;
  status?: ModuleStatus;
  extra?: Partial<Prisma.PlanModuleUncheckedCreateInput>;
};

/** Build an assessment plan from template families (copying name/type/purpose/coverage). */
export async function makePlan(db: PrismaClient, clientId: string, mods: Mod[], opts: { kind?: "BASELINE" | "REASSESSMENT"; sentVersion?: number; versions?: [number, string, string, string][] } = {}) {
  const plan = await db.assessmentPlan.create({ data: { clientId, kind: opts.kind ?? "BASELINE", sentVersion: opts.sentVersion ?? 1 } });
  for (const [i, m] of mods.entries()) {
    const t = await db.moduleTemplate.findFirst({ where: { family: m.family ?? m.key, status: { in: ["PUBLISHED", "DRAFT"] } }, orderBy: { version: "desc" } });
    if (!t) throw new Error("No template " + (m.family ?? m.key));
    const isDefault = t.isDefault;
    await db.planModule.create({
      data: {
        planId: plan.id,
        templateId: t.id,
        templateVersion: t.version,
        key: m.key,
        order: i,
        name: t.name,
        purpose: t.purpose,
        shortLine: t.shortLine,
        type: t.type,
        timeEstimate: t.timeEstimate,
        coverage: t.coverage ?? [],
        status: m.status ?? "NOT_STARTED",
        addedBy: isDefault ? "SYSTEM" : "PRACTITIONER",
        locked: isDefault,
        paid: t.defaultPaid,
        priceLabel: t.defaultPaid ? "₹X,XXX" : null,
        ...(m.extra ?? {}),
      },
    });
  }
  for (const [v, summary, byName, at] of opts.versions ?? []) await db.planVersion.create({ data: { planId: plan.id, version: v, summary, byName, createdAt: d(at) } });
  return plan;
}

export const consentAll = (clientId: string, granted: Partial<Record<Prisma.ConsentCreateManyInput["kind"], boolean>>, at = "2026-08-25 18:00") =>
  Object.entries(granted).map(([kind, g]) => ({ clientId, kind: kind as Prisma.ConsentCreateManyInput["kind"], granted: !!g, changedAt: d(at) }));
