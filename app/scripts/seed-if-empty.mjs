// Runs during the Vercel build (DEMO_MODE=1 only). Seeds the fictional sample data when the database is empty,
// or reseeds it (wiping demo data) when SEED_VERSION below changes. Bump SEED_VERSION when the demo data changes.
import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";

const SEED_VERSION = "2026-10-07 coach assignment";

if (process.env.DEMO_MODE !== "1") {
  console.log("seed-if-empty: DEMO_MODE is not 1, skipping.");
  process.exit(0);
}
const db = new PrismaClient();
const users = await db.user.count();
const meta = await db.appMeta.findUnique({ where: { key: "seedVersion" } }).catch(() => null);
await db.$disconnect();
if (users > 0 && meta?.value === SEED_VERSION) {
  console.log(`seed-if-empty: demo data is current (${SEED_VERSION}), skipping.`);
  process.exit(0);
}
console.log(users ? `seed-if-empty: demo data is out of date (${meta?.value ?? "no version"}), reseeding…` : "seed-if-empty: empty database, seeding demo data…");
const r = spawnSync("npx", ["tsx", "prisma/seed/index.ts"], { stdio: "inherit", env: process.env });
if (r.status !== 0) process.exit(r.status ?? 1);
const db2 = new PrismaClient();
await db2.appMeta.upsert({ where: { key: "seedVersion" }, create: { key: "seedVersion", value: SEED_VERSION }, update: { value: SEED_VERSION } });
await db2.$disconnect();
console.log("seed-if-empty: done.");
