import { PrismaClient } from "@prisma/client";
import { seedBase, type Base } from "./base";
import { seedAssessment } from "./assessment";
import { seedRoster } from "./roster";

/**
 * Dev seed. Wipes every table, then writes fictional sample data.
 * Base → primary assessment clients → roster → area seeds (in AREAS order).
 * Each area seed is `prisma/seed/areas/<name>.ts` with a default export
 * `(db, base) => Promise<void>` that enriches roster clients by email.
 * Run with a lock when several people seed at once:  flock /tmp/aditus-seed.lock npx prisma db seed
 */
const db = new PrismaClient();

const AREAS = ["lifecycle", "results", "records", "onboarding", "plan", "dayof", "staffwork", "consoles", "assign"] as const;

async function wipe() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length) await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
}

type AreaSeed = { default?: (db: PrismaClient, base: Base) => Promise<void> };

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "1") throw new Error("Refusing to seed in production.");
  await wipe();
  const base = await seedBase(db);
  await seedAssessment(db, base);
  await seedRoster(db, base);
  for (const name of AREAS) {
    let mod: AreaSeed | null = null;
    try {
      mod = (await import(`./areas/${name}`)) as AreaSeed;
    } catch (e) {
      if ((e as { code?: string }).code !== "ERR_MODULE_NOT_FOUND" && !String(e).includes("Cannot find module")) throw e;
    }
    if (mod?.default) {
      await mod.default(db, base);
      console.log(`  seeded area: ${name}`);
    }
  }
  console.log("Seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
