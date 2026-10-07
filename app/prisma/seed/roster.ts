import type { PrismaClient } from "@prisma/client";
import { d, type Base } from "./base";
import { makeClient } from "./factory";

/**
 * Demo clients, one per lifecycle state that the designs show. Area seeds enrich
 * these by email (never create them elsewhere). The dev sign in picker lists them
 * with `devLabel`. All data is fictional.
 */
export const ROSTER = [
  // Access and onboarding (01, 03, 06)
  { email: "zara@example.com", first: "Zara", last: "Khan", city: "Andheri, Mumbai", pin: "400053", mumbai: true, devLabel: "Account not set up (setup link)", stage: "ASSESSMENT_PURCHASED", status: "PURCHASED", setup: false },
  { email: "neel@example.com", first: "Neel", last: "Shetty", city: "Andheri, Mumbai", pin: "400058", mumbai: true, devLabel: "Welcome · plan not started · in person recommended", stage: "ONBOARDING", status: "INTAKE_REQUIRED" },
  { email: "kavya@example.com", first: "Kavya", last: "Menon", city: "Pune", pin: "411004", mumbai: false, devLabel: "Intake half done", stage: "ONBOARDING", status: "INTAKE_REQUIRED" },
  { email: "rhea@example.com", first: "Rhea", last: "Kulkarni", city: "Borivali, Mumbai", pin: "400092", mumbai: true, devLabel: "Capture submitted · recommendation shown", stage: "ASSESSMENT_DAY", status: "PRACTITIONER_REVIEW" },
  { email: "tara@example.com", first: "Tara", last: "Fernandes", city: "Goregaon, Mumbai", pin: "400063", mumbai: true, devLabel: "In person added · waiting for payment", stage: "ASSESSMENT_DAY", status: "SESSION_BOOKED" },
  { email: "vikram@example.com", first: "Vikram", last: "Joshi", city: "Malad, Mumbai", pin: "400064", mumbai: true, devLabel: "Recommendation dismissed · online only", stage: "ASSESSMENT_DAY", status: "PRACTITIONER_REVIEW" },
  // Assessment day (04, 02 live)
  { email: "nikhil@example.com", first: "Nikhil", last: "Bose", city: "Delhi", pin: "110017", mumbai: false, devLabel: "Live video session today 8:30 PM", stage: "ASSESSMENT_DAY", status: "SESSION_BOOKED" },
  // Report (04 released + reveal, 05 report ready)
  { email: "sana@example.com", first: "Sana", last: "Patel", city: "Thane", pin: "400607", mumbai: true, devLabel: "Report released · walkthrough · choose your path", stage: "REPORT", status: "REPORT_READY" },
  // Training (05)
  { email: "ananya@example.com", first: "Ananya", last: "Iyer", city: "Navi Mumbai", pin: "400703", mumbai: true, devLabel: "Training · session tomorrow unconfirmed", stage: "TRAINING", status: "REPORT_READY" },
  { email: "rohan@example.com", first: "Rohan", last: "Desai", city: "Borivali, Mumbai", pin: "400091", mumbai: true, devLabel: "Training · plan expiring", stage: "TRAINING", status: "REPORT_READY" },
  { email: "ishita@example.com", first: "Ishita", last: "Rao", city: "Kandivali, Mumbai", pin: "400067", mumbai: true, devLabel: "Reassessment done · Compare unlocked", stage: "TRAINING", status: "REPORT_READY" },
  // Plan ended (05)
  { email: "farah@example.com", first: "Farah", last: "Ali", city: "Bandra, Mumbai", pin: "400050", mumbai: true, devLabel: "Plan ended · export ready · grace period", stage: "GRACE", status: "REPORT_READY" },
  { email: "omar@example.com", first: "Omar", last: "Sheikh", city: "Kurla, Mumbai", pin: "400070", mumbai: true, devLabel: "Access ended", stage: "ACCESS_ENDED", status: "REPORT_READY" },
] as const;

export const DEV_LABELS: Record<string, string> = {
  "aarav@example.com": "In person booked · gait video added (primary sample)",
  "ishaan@example.com": "Online only · MRI step · capture more needed",
  "diya@example.com": "Online Capture 70 percent",
  "meera@example.com": "In person today · assessment in progress",
  "kabir@example.com": "Report waiting for head coach approval",
  ...Object.fromEntries(ROSTER.map((r) => [r.email, r.devLabel])),
};

export async function seedRoster(db: PrismaClient, base: Base) {
  for (const r of ROSTER) {
    await makeClient(db, base, {
      email: r.email,
      first: r.first,
      last: r.last,
      city: r.city,
      pin: r.pin,
      mumbai: r.mumbai,
      created: "2026-08-20 10:00",
      profile: {
        stage: r.stage,
        assessmentStatus: r.status,
        recommendation: r.mumbai ? "NOT_SHOWN" : "NOT_ELIGIBLE",
        primaryPractitionerId: base.jayraj.id,
        preferredCentreId: base.tic.id,
        accountSetupDone: !("setup" in r && r.setup === false),
        setupStep: "setup" in r && r.setup === false ? 1 : 4,
      },
    });
  }
  // Staff side defaults: Jayraj assesses everyone; Shimyu coaches the training clients.
  const training = await db.clientProfile.findMany({ where: { user: { email: { in: ["ananya@example.com", "rohan@example.com", "ishita@example.com", "farah@example.com", "omar@example.com", "sana@example.com"] } } } });
  for (const c of training) {
    await db.clientCoach.createMany({ data: [{ clientId: c.id, staffId: base.jayraj.id, role: "ASSESSMENT" }, { clientId: c.id, staffId: base.shimyu.id, role: "PERSONAL_TRAINING" }] });
  }
  void d;
}
