// Dev helper: sign in (dev provider) and screenshot pages.
// node scripts/shot.mjs --base http://localhost:3100 --as staff:jayraj@aditus.in --out /tmp/x --w 1400 /staff /staff/clients
// node scripts/shot.mjs --as client:aarav@example.com / /assessment
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf("--" + k);
  if (i < 0) return d;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const base = opt("base", "http://localhost:3100");
const as = opt("as", "");
const out = opt("out", "/tmp/shots");
const w = Number(opt("w", "1400"));
const h = Number(opt("h", "900"));
const full = opt("full", "1") === "1";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: w, height: h } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => m.type() === "error" && console.log("CONSOLE", m.text()));

if (as) {
  const [kind, email] = as.split(":");
  const r = await page.request.get(`${base}/api/dev/login?kind=${kind}&email=${encodeURIComponent(email)}`);
  if (!r.ok()) console.log("login failed", r.status(), await r.text());
}
for (const p of args) {
  const res = await page.goto(base + p, { waitUntil: "networkidle" });
  const file = `${out}/${p.replace(/[^\w]+/g, "_") || "root"}_${w}.png`;
  await page.screenshot({ path: file, fullPage: full });
  console.log(res?.status(), p, "→", file);
}
await browser.close();
