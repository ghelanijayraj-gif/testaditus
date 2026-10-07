// Smoke crawl: sign in as each demo account and load the main routes; report status and errors.
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3100";
const plan = [
  ["client", "aarav@example.com", ["/", "/assessment", "/assessment/plan", "/assessment/steps/gait", "/assessment/in-person?step=booked", "/calendar", "/plan", "/documents", "/orders", "/account", "/health", "/reports"]],
  ["client", "ishaan@example.com", ["/", "/assessment/plan", "/assessment/steps/capture", "/assessment/steps/mri"]],
  ["client", "diya@example.com", ["/", "/assessment/steps/capture"]],
  ["client", "neel@example.com", ["/welcome", "/"]],
  ["client", "kavya@example.com", ["/intake", "/"]],
  ["client", "tara@example.com", ["/assessment/plan", "/assessment/in-person?step=pay"]],
  ["client", "vikram@example.com", ["/", "/assessment/plan"]],
  ["client", "rhea@example.com", ["/", "/assessment/plan"]],
  ["client", "sana@example.com", ["/", "/reveal", "/reveal/walkthrough?step=3", "/reports", "/plan", "/assessment", "/assessment/next-steps"]],
  ["client", "ananya@example.com", ["/", "/assessment", "/assessment?sys=breathwork", "/assessment?sys=recovery", "/assessment?sys=performance", "/calendar", "/calendar?view=week", "/calendar?view=agenda", "/plan", "/plan?tab=products", "/plan?tab=coaches", "/health", "/documents", "/orders", "/account", "/reports", "/search?q=blood"]],
  ["client", "rohan@example.com", ["/", "/plan", "/health"]],
  ["client", "ishita@example.com", ["/", "/assessment?mode=compare", "/reports"]],
  ["client", "farah@example.com", ["/", "/export", "/assessment"]],
  ["client", "omar@example.com", ["/", "/ended"]],
  ["client", "meera@example.com", ["/"]],
  ["client", "dhruv@example.com", ["/"]],
  ["client", "nikhil@example.com", ["/"]],
  ["client", "zara@example.com", ["/setup"]],
  ["staff", "jayraj@aditus.in", ["/staff", "/staff/clients", "/staff/assessments", "/staff/schedule", "/staff/modules", "/staff/reports", "/staff/billing", "/staff/team", "/staff/settings", "/staff/settings?tab=roles", "/staff/settings?tab=audit", "/staff/review", "/staff/photo-review"]],
  ["staff", "shimyu@aditus.in", ["/staff", "/staff/clients", "/staff/review"]],
  ["staff", "sahil@aditus.in", ["/staff", "/staff/clients", "/staff/schedule", "/staff/billing"]],
  ["staff", "arjun@aditus.in", ["/staff", "/staff/billing"]],
];
const browser = await chromium.launch();
let bad = 0;
for (const [kind, email, paths] of plan) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push("pageerror " + e.message.slice(0, 200)));
  page.on("console", (m) => m.type() === "error" && !/Download the React DevTools|favicon/.test(m.text()) && errs.push("console " + m.text().slice(0, 200)));
  await page.request.get(`${base}/api/dev/login?kind=${kind}&email=${encodeURIComponent(email)}`);
  for (const p of paths) {
    errs.length = 0;
    let st = 0;
    try {
      const r = await page.goto(base + p, { waitUntil: "networkidle", timeout: 90000 });
      st = r?.status() ?? 0;
    } catch (e) { errs.push("goto " + e.message.slice(0, 120)); }
    const body = await page.locator("body").innerText().catch(() => "");
    if (/not built yet|Unhandled Runtime Error|Application error/i.test(body)) errs.push("body: stub/error text");
    const ok = st > 0 && st < 400 && errs.length === 0;
    if (!ok) bad++;
    console.log(`${ok ? "ok " : "BAD"} ${st} ${email.split("@")[0]} ${p} → ${new URL(page.url()).pathname}${errs.length ? "\n     " + errs.join("\n     ") : ""}`);
  }
  await ctx.close();
}
await browser.close();
console.log(bad ? `${bad} problems` : "all ok");
