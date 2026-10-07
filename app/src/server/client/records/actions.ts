"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ConsentKind, HealthProvider } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireClient } from "@/server/auth/guards";
import { clientSignOut } from "@/server/auth/client";
import { shopify } from "@/server/integrations/shopify";
import { notifier } from "@/server/integrations/notify";
import { now } from "@/lib/clock";
import { SOURCES, sourceByProvider } from "@/components/client/records/catalog";
import { currentPlan, inMumbaiArea, isReadOnlyStage } from "./common";
import { syncSamples } from "./health";
import { prepareExport } from "./exportpkg";
import { saveUpload } from "./upload";

type Result = { toast?: string; error?: string; redirect?: string };
const PROVIDERS = SOURCES.map((s) => s.provider) as [HealthProvider, ...HealthProvider[]];
const zProvider = z.enum(PROVIDERS);

async function activity(clientId: string, actorName: string, action: string) {
  await prisma.activityLog.create({ data: { clientId, actorName, action, createdAt: now() } });
}

const READ_ONLY = "Your plan has ended. You can still read and download everything.";

// ─────────────── My plan ───────────────

/** Start training / Renew plan / Reactivate → simulated Shopify checkout. */
export async function startCheckout(productSlug: string, purpose: "training_plan" | "renewal"): Promise<Result> {
  const { client } = await requireClient();
  const slug = z.string().min(1).max(60).parse(productSlug);
  const p = z.enum(["training_plan", "renewal"]).parse(purpose);
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product || !product.active) return { error: "That plan is not available right now." };
  if (p === "training_plan" && !["REPORT", "TRAINING", "PLAN_ENDED", "GRACE"].includes(client.stage)) return { error: "Plans open after your report." };
  const { url } = await shopify.createCheckout({ clientId: client.id, productSlug: slug, purpose: p, returnTo: "/" });
  return { redirect: url };
}

/** Renew the current (or most recent) plan. */
export async function renewPlan(): Promise<Result> {
  const { client } = await requireClient();
  const { current } = await currentPlan(client.id);
  return startCheckout(current?.product.slug ?? "pt-12", "renewal");
}

export async function dismissSuggestion(id: string): Promise<Result> {
  const { client, user } = await requireClient();
  const s = await prisma.productSuggestion.findFirst({ where: { id: z.string().parse(id), clientId: client.id } });
  if (!s) return { error: "Not found." };
  await prisma.productSuggestion.update({ where: { id: s.id }, data: { dismissed: true } });
  await prisma.suggestionDetail.upsert({ where: { suggestionId: s.id }, update: { dismissedAt: now() }, create: { suggestionId: s.id, meta: "", dismissedAt: now() } });
  await activity(client.id, user.name ?? "Client", `Dismissed suggestion · ${s.name}`);
  revalidatePath("/plan");
  return {};
}

// ─────────────── Health data ───────────────

/** Consent prompt → connect. No real OAuth in dev: mark connected and run a first sync of sample data. */
export async function connectSource(provider: HealthProvider): Promise<Result> {
  const { client, user } = await requireClient();
  if (isReadOnlyStage(client.stage)) return { error: READ_ONLY };
  const def = sourceByProvider(zProvider.parse(provider));
  await prisma.consent.upsert({ where: { clientId_kind: { clientId: client.id, kind: "HEALTH_APP_SYNC" } }, update: { granted: true, source: "account", changedAt: now() }, create: { clientId: client.id, kind: "HEALTH_APP_SYNC", granted: true, source: "account", changedAt: now() } });
  await prisma.consentEvent.create({ data: { clientId: client.id, kind: "HEALTH_APP_SYNC", granted: true, source: "health_connect", createdAt: now() } });
  await prisma.healthSource.upsert({
    where: { clientId_provider: { clientId: client.id, provider: def.provider } },
    update: { status: "CONNECTED", lastSyncAt: now(), dataTypes: def.types },
    create: { clientId: client.id, provider: def.provider, status: "CONNECTED", lastSyncAt: now(), dataTypes: def.types, sharedWithCoach: def.types },
  });
  await syncSamples(client.id, def.provider);
  await activity(client.id, user.name ?? "Client", `Connected ${def.name} (read only)`);
  revalidatePath("/health");
  revalidatePath("/account");
  return { toast: `${def.name} connected. First sync in a few minutes.` };
}

export async function disconnectSource(provider: HealthProvider): Promise<Result> {
  const { client, user } = await requireClient();
  const def = sourceByProvider(zProvider.parse(provider));
  await prisma.healthSource.updateMany({ where: { clientId: client.id, provider: def.provider }, data: { status: "NOT_CONNECTED" } });
  await activity(client.id, user.name ?? "Client", `Disconnected ${def.name}`);
  revalidatePath("/health");
  revalidatePath("/account");
  return { toast: `${def.name} disconnected. Nothing more is read.` };
}

export async function retrySource(provider: HealthProvider): Promise<Result> {
  const { client } = await requireClient();
  if (isReadOnlyStage(client.stage)) return { error: READ_ONLY };
  const def = sourceByProvider(zProvider.parse(provider));
  await prisma.healthSource.updateMany({ where: { clientId: client.id, provider: def.provider }, data: { status: "CONNECTED", lastSyncAt: now() } });
  await syncSamples(client.id, def.provider);
  revalidatePath("/health");
  return { toast: `${def.name} reconnected. Syncing now.` };
}

export async function toggleShare(provider: HealthProvider, type: string): Promise<Result> {
  const { client, user } = await requireClient();
  const def = sourceByProvider(zProvider.parse(provider));
  if (!def.types.includes(type)) return { error: "Unknown data type." };
  const row = await prisma.healthSource.findUnique({ where: { clientId_provider: { clientId: client.id, provider: def.provider } } });
  if (!row) return { error: "Connect this app first." };
  const on = row.sharedWithCoach.includes(type);
  await prisma.healthSource.update({ where: { id: row.id }, data: { sharedWithCoach: on ? row.sharedWithCoach.filter((t) => t !== type) : [...row.sharedWithCoach, type] } });
  await activity(client.id, user.name ?? "Client", `${def.name} · ${type} · ${on ? "only you" : "shared with coach"}`);
  revalidatePath("/health");
  return {};
}

// ─────────────── Documents ───────────────

export async function uploadDocument(form: FormData): Promise<Result> {
  const { client, user } = await requireClient();
  return saveUpload(client, user.name ?? "Client", form);
}

// ─────────────── Orders ───────────────

/** Pay now on a Due or Overdue invoice → simulated Shopify checkout (purpose invoice_payment). */
export async function payInvoice(number: string): Promise<Result> {
  const { client } = await requireClient();
  const inv = await prisma.invoice.findFirst({ where: { clientId: client.id, number: z.string().max(40).parse(number) } });
  if (!inv) return { error: "Invoice not found." };
  if (inv.status === "PAID") return { toast: "This invoice is already paid." };
  const { url } = await shopify.createCheckout({ clientId: client.id, productSlug: "invoice", purpose: "invoice_payment", returnTo: `/orders?paid=${encodeURIComponent(inv.number)}` });
  return { redirect: url };
}

// ─────────────── Account ───────────────

const zDetails = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  mobile: z.string().trim().max(24).regex(/^[+\d\s()X]*$/, "Use digits only for the mobile number."),
  dob: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
  emergencyName: z.string().trim().max(80),
  emergencyPhone: z.string().trim().max(24),
  city: z.string().trim().max(60),
  pin: z.string().trim().regex(/^(\d{6})?$/, "PIN is six digits."),
});

export async function updateDetails(form: FormData): Promise<Result> {
  const { client, user } = await requireClient();
  const r = zDetails.safeParse(Object.fromEntries(["firstName", "lastName", "mobile", "dob", "emergencyName", "emergencyPhone", "city", "pin"].map((k) => [k, String(form.get(k) ?? "")])));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Check the details and try again." };
  const v = r.data;
  const mumbai = await inMumbaiArea(v.city, v.pin);
  await prisma.clientProfile.update({
    where: { id: client.id },
    data: {
      firstName: v.firstName,
      lastName: v.lastName,
      mobile: v.mobile || null,
      dateOfBirth: v.dob ? new Date(v.dob + "T00:00:00+05:30") : null,
      emergencyName: v.emergencyName || null,
      emergencyPhone: v.emergencyPhone || null,
      city: v.city || null,
      pin: v.pin || null,
      inMumbaiArea: mumbai,
      // A move out of the Mumbai area withdraws the in person recommendation; a move in makes it possible again.
      ...(mumbai !== client.inMumbaiArea ? { recommendation: mumbai ? "NOT_SHOWN" : "NOT_ELIGIBLE" } : {}),
    },
  });
  await prisma.user.update({ where: { id: user.id }, data: { name: `${v.firstName} ${v.lastName}` } });
  await activity(client.id, `${v.firstName} ${v.lastName}`, "Updated personal details");
  revalidatePath("/account");
  return { toast: "Details saved." };
}

export async function setSignInMethod(method: "EMAIL_LINK" | "PASSWORD"): Promise<Result> {
  const { user, client } = await requireClient();
  const m = z.enum(["EMAIL_LINK", "PASSWORD"]).parse(method);
  if (m === "PASSWORD" && !user.passwordHash) return { error: "Set a password first." };
  await prisma.user.update({ where: { id: user.id }, data: { signInMethod: m } });
  await activity(client.id, user.name ?? "Client", m === "PASSWORD" ? "Sign in method · password" : "Sign in method · email link");
  revalidatePath("/account");
  return { toast: m === "PASSWORD" ? "You sign in with your password now." : "We will email you a link each time you sign in." };
}

export async function setPassword(form: FormData): Promise<Result> {
  const { user, client } = await requireClient();
  const pw = String(form.get("password") ?? "");
  const again = String(form.get("confirm") ?? "");
  if (pw.length < 8) return { error: "Use at least 8 characters." };
  if (pw !== again) return { error: "The two passwords do not match." };
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(pw, 10), signInMethod: "PASSWORD", tempPasswordHash: null } });
  await activity(client.id, user.name ?? "Client", "Set a password");
  revalidatePath("/account");
  return { toast: "Password saved. Sign in with your email and this password." };
}

export async function setCentre(centreId: string): Promise<Result> {
  const { client, user } = await requireClient();
  const c = await prisma.centre.findUnique({ where: { id: z.string().parse(centreId) } });
  if (!c) return { error: "Unknown centre." };
  await prisma.clientProfile.update({ where: { id: client.id }, data: { preferredCentreId: c.id } });
  await activity(client.id, user.name ?? "Client", `Preferred centre · ${c.name}`);
  revalidatePath("/account");
  return { toast: `${c.name} is your preferred centre.` };
}

export async function toggleNotify(key: "whatsappUpdates" | "notifyEmailReport" | "notifyReassessWindow"): Promise<Result> {
  const { client } = await requireClient();
  const k = z.enum(["whatsappUpdates", "notifyEmailReport", "notifyReassessWindow"]).parse(key);
  await prisma.clientProfile.update({ where: { id: client.id }, data: { [k]: !client[k] } });
  revalidatePath("/account");
  return {};
}

const ACCOUNT_KINDS = ["HEALTH_DOCUMENTS", "PHOTOS_VIDEOS", "HEALTH_APP_SYNC", "TESTIMONIAL", "COMMUNITY"] as const;

/** Consent toggle: current value in Consent, every change appended to ConsentEvent. */
export async function setConsent(kind: ConsentKind, granted: boolean): Promise<Result> {
  const { client, user } = await requireClient();
  const k = z.enum(ACCOUNT_KINDS).parse(kind);
  const g = z.boolean().parse(granted);
  await prisma.consent.upsert({ where: { clientId_kind: { clientId: client.id, kind: k } }, update: { granted: g, source: "account", changedAt: now() }, create: { clientId: client.id, kind: k, granted: g, source: "account", changedAt: now() } });
  await prisma.consentEvent.create({ data: { clientId: client.id, kind: k, granted: g, source: "account", createdAt: now() } });
  if (k === "HEALTH_APP_SYNC" && !g) await prisma.healthSource.updateMany({ where: { clientId: client.id, status: { not: "NOT_CONNECTED" } }, data: { status: "NOT_CONNECTED" } });
  await activity(client.id, user.name ?? "Client", `Consent ${g ? "given" : "withdrawn"} · ${k.toLowerCase().replace(/_/g, " ")}`);
  revalidatePath("/account");
  revalidatePath("/health");
  return { toast: g ? "Consent given." : "Consent withdrawn." };
}

export async function requestExport(): Promise<Result> {
  const { client, user } = await requireClient();
  await prisma.dataRequest.create({ data: { clientId: client.id, kind: "export", status: "done", createdAt: now() } });
  const pkg = await prepareExport(client.id);
  await notifier.send({ clientId: client.id, to: user.email, channel: "EMAIL", template: "export_ready", subject: "Your ADITUS export is ready", body: `Hi ${client.firstName},\n\nYour export is ready: ${pkg.fileCount} files. Download it from the portal under Account, or from this link.\n\nOpen your export →` });
  await activity(client.id, user.name ?? "Client", "Requested a data export");
  revalidatePath("/export");
  return { redirect: "/export", toast: "Your export is ready." };
}

export async function requestDeletion(): Promise<Result> {
  const { client, user } = await requireClient();
  const open = await prisma.dataRequest.findFirst({ where: { clientId: client.id, kind: "deletion", status: "requested" } });
  if (!open) {
    await prisma.dataRequest.create({ data: { clientId: client.id, kind: "deletion", status: "requested", createdAt: now() } });
    await notifier.send({ clientId: client.id, to: user.email, channel: "EMAIL", template: "deletion_request", subject: "We received your deletion request", body: `Hi ${client.firstName},\n\nWe received your request to delete your ADITUS data. We confirm by email within 7 days. Records the law requires us to keep are deleted when that period ends.\n\nIf you did not ask for this, reply to this email.` });
    await notifier.send({ to: "privacy@aditus.in", channel: "EMAIL", template: "deletion_request_staff", subject: `Deletion request · ${client.code}`, body: `${client.firstName} ${client.lastName} (${client.code}) asked us to delete their data. Confirm within 7 days.` });
    await activity(client.id, user.name ?? "Client", "Requested deletion of their data");
  }
  return { toast: "Deletion requested. We confirm by email within 7 days." };
}

/** Sign out of all devices: every client JWT issued before now is invalid (enforced by the auth callback). */
export async function signOutAll(): Promise<Result> {
  const { client, user } = await requireClient();
  await prisma.dataRequest.create({ data: { clientId: client.id, kind: "sign_out_all", status: "done", createdAt: now() } });
  await prisma.clientSessionPolicy.upsert({ where: { userId: user.id }, update: { sessionsValidAfter: new Date() }, create: { userId: user.id, sessionsValidAfter: new Date() } });
  await activity(client.id, user.name ?? "Client", "Signed out of all devices");
  await clientSignOut({ redirectTo: "/signin" });
  return {};
}

// ─────────────── Export and access ended ───────────────

export async function markExportDownloaded(): Promise<Result> {
  const { client, user } = await requireClient();
  const pkg = await prisma.exportPackage.findFirst({ where: { clientId: client.id, status: "ready" }, orderBy: { createdAt: "desc" } });
  if (!pkg) return { error: "Your export is still being prepared." };
  await prisma.clientProfile.update({ where: { id: client.id }, data: { exportedAt: now() } });
  await activity(client.id, user.name ?? "Client", "Downloaded the export");
  const mb = Math.max(1, Math.round((pkg.sizeBytes ?? 0) / (1024 * 1024)));
  return { toast: `Download started. ${pkg.fileCount ?? 0} files, ${mb} MB.` };
}

export async function exportAgain(): Promise<Result> {
  const { client, user } = await requireClient();
  const pkg = await prepareExport(client.id);
  await prisma.dataRequest.create({ data: { clientId: client.id, kind: "export", status: "done", createdAt: now() } });
  await notifier.send({ clientId: client.id, to: user.email, channel: "EMAIL", template: "export_ready", subject: "Your ADITUS export", body: `Hi ${client.firstName},\n\nHere is a fresh download link for your export: ${pkg.fileCount} files.\n\nDownload →` });
  await activity(client.id, user.name ?? "Client", "Asked for the export again");
  return { toast: "We emailed you a new download link." };
}
