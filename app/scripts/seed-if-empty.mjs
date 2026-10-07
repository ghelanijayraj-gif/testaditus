// Runs during the Vercel build: seeds the fictional sample data once, when the database
// has no users yet and DEMO_MODE=1. Never touches a database that already has data.
import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";

if (process.env.DEMO_MODE !== "1") {
  console.log("seed-if-empty: DEMO_MODE is not 1, skipping.");
  process.exit(0);
}
const db = new PrismaClient();
const users = await db.user.count();
await db.$disconnect();
if (users > 0) {
  console.log(`seed-if-empty: ${users} users present, skipping.`);
  process.exit(0);
}
console.log("seed-if-empty: empty database, seeding demo data…");
const r = spawnSync("npx", ["tsx", "prisma/seed/index.ts"], { stdio: "inherit", env: process.env });
process.exit(r.status ?? 1);
