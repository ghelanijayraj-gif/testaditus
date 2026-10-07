"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { SETUP_CONSENTS } from "@/server/onboarding/consents";
import { prisma } from "@/server/db";
import { requireClient } from "@/server/auth/guards";
import { now } from "@/lib/clock";
import { formatMobile, splitName } from "@/server/onboarding/provisionCore";
import { inMumbaiArea, nextRecommendation } from "@/server/onboarding/mumbai";
import { consumeSetupTokens } from "@/server/onboarding/setup";
import { scheduleIntakeReminders } from "@/server/onboarding/reminders";

export type FormState = { error?: string; field?: string } | null;

async function setupClient() {
  const { client, user } = await requireClient();
  if (client.accountSetupDone) redirect("/");
  return { client, user };
}

const Details = z.object({
  name: z.string().trim().min(2, "Add your full name.").max(120),
  mobile: z.string().trim().max(20).refine((v) => !v || v.replace(/\D/g, "").length === 10, "Mobile numbers have 10 digits."),
  dob: z.string().refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Pick a date of birth."),
  ecName: z.string().trim().max(120),
  ecPhone: z.string().trim().max(20),
  city: z.string().trim().max(80),
  pin: z.string().trim().refine((v) => !v || /^\d{6}$/.test(v.replace(/\s/g, "")), "PIN codes have 6 digits."),
});

/** Setup 1 · Details (incl. city and PIN, which set the Mumbai area flag). */
export async function saveDetails(_: FormState, fd: FormData): Promise<FormState> {
  const { client, user } = await setupClient();
  const p = Details.safeParse(Object.fromEntries(["name", "mobile", "dob", "ecName", "ecPhone", "city", "pin"].map((k) => [k, String(fd.get(k) ?? "")])));
  if (!p.success) return { error: p.error.issues[0].message, field: String(p.error.issues[0].path[0]) };
  const v = p.data;
  const dob = v.dob ? new Date(`${v.dob}T00:00:00+05:30`) : null;
  if (dob && (dob > now() || dob.getFullYear() < 1900)) return { error: "Pick a date of birth.", field: "dob" };
  const { first, last } = splitName(v.name);
  const pin = v.pin.replace(/\s/g, "") || null;
  const city = v.city || null;
  const inside = await inMumbaiArea(prisma, city, pin);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { name: v.name } }),
    prisma.clientProfile.update({
      where: { id: client.id },
      data: {
        firstName: first,
        lastName: last,
        mobile: formatMobile(v.mobile),
        dateOfBirth: dob,
        emergencyName: v.ecName || null,
        emergencyPhone: v.ecPhone || null,
        city,
        pin,
        inMumbaiArea: inside,
        recommendation: nextRecommendation(client.recommendation, inside),
        setupStep: Math.max(client.setupStep, 2),
        assessmentStatus: client.assessmentStatus === "PURCHASED" ? "PROFILE_REQUIRED" : client.assessmentStatus,
      },
    }),
  ]);
  redirect("/setup?step=2");
}

/** Setup 2 · Security: email link (simpler) or a password (10+ characters with a number). */
export async function saveSecurity(_: FormState, fd: FormData): Promise<FormState> {
  const { client, user } = await setupClient();
  const method = String(fd.get("method"));
  if (method === "password") {
    const pw = String(fd.get("password") ?? "");
    if (pw.length < 10 || !/\d/.test(pw)) return { error: "Your password needs at least 10 characters and one number.", field: "password" };
    await prisma.user.update({ where: { id: user.id }, data: { signInMethod: "PASSWORD", passwordHash: await bcrypt.hash(pw, 10) } });
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { signInMethod: "EMAIL_LINK" } });
  }
  await prisma.clientProfile.update({ where: { id: client.id }, data: { setupStep: Math.max(client.setupStep, 3) } });
  redirect("/setup?step=3");
}

/** Setup 3 · Preferences and consents. Nothing is pre ticked; every choice is stored with its date. */
export async function savePreferences(_: FormState, fd: FormData): Promise<FormState> {
  const { client } = await setupClient();
  const slug = String(fd.get("centre") ?? "");
  const centre = slug ? await prisma.centre.findUnique({ where: { slug } }) : null;
  const wa = fd.get("whatsapp") === "on";
  const given = new Set(fd.getAll("consent").map(String));
  const at = now();
  await prisma.$transaction([
    prisma.clientProfile.update({ where: { id: client.id }, data: { preferredCentreId: centre?.id ?? null, whatsappUpdates: wa, setupStep: Math.max(client.setupStep, 4) } }),
    ...SETUP_CONSENTS.map(({ kind }) =>
      prisma.consent.upsert({
        where: { clientId_kind: { clientId: client.id, kind } },
        create: { clientId: client.id, kind, granted: given.has(kind), source: "setup", changedAt: at },
        update: { granted: given.has(kind), source: "setup", changedAt: at },
      }),
    ),
  ]);
  redirect("/setup?step=4");
}

/** Setup 4 → Done: finishes setup, uses up the setup link and schedules the intake reminders. */
export async function completeSetup() {
  const { client, user } = await setupClient();
  const at = now();
  await prisma.clientProfile.update({
    where: { id: client.id },
    data: {
      accountSetupDone: true,
      setupStep: 4,
      stage: client.stage === "ASSESSMENT_PURCHASED" ? "ONBOARDING" : client.stage,
      assessmentStatus: ["PURCHASED", "PROFILE_REQUIRED"].includes(client.assessmentStatus) ? (client.intakeCompletedAt ? "INTAKE_COMPLETE" : "INTAKE_REQUIRED") : client.assessmentStatus,
    },
  });
  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: user.emailVerified ?? at } });
  await consumeSetupTokens(user.id);
  await prisma.activityLog.create({ data: { clientId: client.id, actorName: `${client.firstName} ${client.lastName}`.trim(), action: "Account setup finished", createdAt: at } });
  await scheduleIntakeReminders(client.id, at);
  revalidatePath("/", "layout");
  redirect("/setup/done");
}
