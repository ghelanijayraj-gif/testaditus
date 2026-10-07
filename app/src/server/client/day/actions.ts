"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireClient } from "@/server/auth/guards";
import { notifier } from "@/server/integrations/notify";
import { storage, MAX_UPLOAD_BYTES } from "@/server/integrations/storage";
import { now } from "@/lib/clock";
import { timeLabel } from "@/lib/format";
import { defaultPhases, readPhases } from "@/components/client/day/phases";

type Result = { ok?: boolean; toast?: string; error?: string; redirect?: string };

const id = z.string().min(1).max(64);

/** The signed in client's own session (with coach + centre), or null. */
async function own(sessionId: string) {
  const { client } = await requireClient();
  const parsed = id.safeParse(sessionId);
  if (!parsed.success) return null;
  const s = await prisma.session.findUnique({ where: { id: parsed.data }, include: { coach: { include: { user: true } }, centre: true, assessment: true } });
  if (!s || s.clientId !== client.id) return null;
  return { client, s, coach: s.coach?.user.name?.split(" ")[0] ?? "Your practitioner" };
}

type Own = NonNullable<Awaited<ReturnType<typeof own>>>;

/** Portal message to the practitioner (outbox) + a line in the client activity log. */
async function tellStaff(o: Own, template: string, body: string, activity: string) {
  const name = `${o.client.firstName} ${o.client.lastName}`;
  await notifier.send({ clientId: o.client.id, to: o.s.coach?.user.email ?? "assessments@aditus.in", channel: "PORTAL", template, subject: `${name} · ${o.s.title}`, body });
  await prisma.activityLog.create({ data: { clientId: o.client.id, actorName: name, action: activity, createdAt: now() } });
}

/** Make sure the session has an Assessment with phases; called when the session starts (check in / join). */
async function ensureAssessment(o: Own, arrived: Date) {
  let a = o.s.assessment;
  if (!a) {
    a = await prisma.assessment.create({
      data: {
        clientId: o.client.id,
        format: o.s.online ? "LIVE_ONLINE" : "IN_PERSON",
        online: o.s.online,
        date: o.s.startsAt,
        practitionerId: o.s.coachId,
        centreId: o.s.centreId,
        measuresTotal: 24,
      },
    });
    await prisma.session.update({ where: { id: o.s.id }, data: { assessmentId: a.id } });
  }
  if (readPhases(a.phases).length === 0) {
    const phases = defaultPhases(o.coach).map((p, i) => ({ ...p, state: i === 0 ? "DONE" : i === 1 ? "CURRENT" : "PENDING", line: i === 0 ? `${o.s.online ? "Joined" : "Arrived"} ${timeLabel(arrived)}` : p.line }));
    a = await prisma.assessment.update({ where: { id: a.id }, data: { phases: phases as unknown as Prisma.InputJsonValue, phase: "conversation" } });
  }
  if (o.client.assessmentStatus === "SESSION_BOOKED") await prisma.clientProfile.update({ where: { id: o.client.id }, data: { assessmentStatus: "IN_PROGRESS" } });
  return a;
}

/** "I am here": check in, notify the practitioner, start the phase tracker. */
export async function checkIn(sessionId: string): Promise<Result> {
  const o = await own(sessionId);
  if (!o) return { error: "We could not find this session." };
  if (o.s.status === "CANCELLED" || o.s.status === "RESCHEDULED") return { error: "This session was moved. Check your calendar." };
  if (o.s.checkedInAt) return { ok: true, toast: `${o.coach} knows you are here.` };
  const t = now();
  await prisma.session.update({ where: { id: o.s.id }, data: { checkedInAt: t } });
  await prisma.sessionEvent.create({ data: { sessionId: o.s.id, status: o.s.status, note: `Checked in ${timeLabel(t)}`, byName: `${o.client.firstName} ${o.client.lastName}`, createdAt: t } });
  await ensureAssessment(o, t);
  await tellStaff(o, "staff_client_here", `${o.client.firstName} ${o.client.lastName} is here${o.s.centre ? ` at ${o.s.centre.name}` : ""}. Checked in ${timeLabel(t)} for the ${timeLabel(o.s.startsAt)} ${o.s.title.toLowerCase()}.`, `Checked in${o.s.centre ? ` at ${o.s.centre.name}` : ""} · I am here`);
  revalidatePath(`/day/${o.s.id}`);
  return { ok: true, toast: `${o.coach} knows you are here.` };
}

const TELL_KINDS = { pain: "Pain today", water: "I need water", break: "I need a break", other: "Something else" } as const;

/** "Tell your practitioner something". */
export async function tellPractitioner(sessionId: string, kind: string, text: string): Promise<Result> {
  const o = await own(sessionId);
  if (!o) return { error: "We could not find this session." };
  const k = z.enum(["pain", "water", "break", "other"]).optional().safeParse(kind || undefined);
  const body = z.string().max(500).safeParse((text ?? "").trim());
  if (!k.success || !body.success) return { error: "Keep it to a few words." };
  if (!k.data && !body.data) return { error: "Pick one, or write a few words." };
  const label = k.data ? TELL_KINDS[k.data] : "Message";
  const msg = body.data ? `${label}: ${body.data}` : label;
  const t = now();
  if (o.s.assessmentId) await prisma.assessment.update({ where: { id: o.s.assessmentId }, data: { clientMessage: `${msg} · ${timeLabel(t)}` } });
  await prisma.issueReport.create({ data: { clientId: o.client.id, kind: `assessment_day_${k.data ?? "other"}`, body: msg, createdAt: t } });
  await tellStaff(o, "staff_client_message", `${o.client.firstName} ${o.client.lastName} says: ${msg}`, `Told ${o.coach}: ${msg}`);
  revalidatePath(`/day/${o.s.id}`);
  return { ok: true, toast: `Sent. ${o.coach} will see it before the next test.` };
}

export async function setPaused(sessionId: string, paused: boolean): Promise<Result> {
  const o = await own(sessionId);
  if (!o) return { error: "We could not find this session." };
  if (!o.s.assessmentId) return { error: "Your assessment has not started yet." };
  await prisma.assessment.update({ where: { id: o.s.assessmentId }, data: { paused } });
  await tellStaff(o, paused ? "staff_client_paused" : "staff_client_resumed", `${o.client.firstName} ${o.client.lastName} ${paused ? "paused" : "resumed"} the assessment.`, paused ? "Paused the assessment" : "Resumed the assessment");
  revalidatePath(`/day/${o.s.id}`);
  return { ok: true, toast: paused ? `Paused. ${o.coach} has been told.` : `Resumed. ${o.coach} has been told.` };
}

/** One tap rating with optional note; autosaves (one rating per session, updated in place). */
export async function rateSession(sessionId: string, score: number, note: string): Promise<Result> {
  const o = await own(sessionId);
  if (!o) return { error: "We could not find this session." };
  const sc = z.number().int().min(1).max(5).safeParse(score);
  const nt = z.string().max(1000).safeParse((note ?? "").trim());
  if (!sc.success || !nt.success) return { error: "Pick a number from 1 to 5." };
  const existing = await prisma.sessionRating.findFirst({ where: { clientId: o.client.id, sessionId: o.s.id } });
  if (existing) await prisma.sessionRating.update({ where: { id: existing.id }, data: { score: sc.data, note: nt.data || null } });
  else {
    await prisma.sessionRating.create({ data: { clientId: o.client.id, sessionId: o.s.id, score: sc.data, note: nt.data || null, createdAt: now() } });
    await prisma.activityLog.create({ data: { clientId: o.client.id, actorName: `${o.client.firstName} ${o.client.lastName}`, action: `Rated the ${o.s.title.toLowerCase()} ${sc.data} of 5`, createdAt: now() } });
  }
  return { ok: true };
}

/** Setup check results (camera, microphone) from getUserMedia. */
export async function saveSetupCheck(sessionId: string, cameraOk: boolean, micOk: boolean): Promise<Result> {
  const o = await own(sessionId);
  if (!o) return { error: "We could not find this session." };
  await prisma.dayCheck.upsert({ where: { sessionId: o.s.id }, update: { cameraOk: !!cameraOk, micOk: !!micOk }, create: { sessionId: o.s.id, clientId: o.client.id, cameraOk: !!cameraOk, micOk: !!micOk } });
  return { ok: true };
}

/** Join link test: the browser measured round trips to our server; we record it. */
export async function testJoinLink(sessionId: string, ms: number): Promise<Result> {
  const o = await own(sessionId);
  if (!o) return { error: "We could not find this session." };
  if (!o.s.joinUrl) return { error: "Your join link is not ready yet. The team will send it before the session." };
  const connection = Number.isFinite(ms) && ms < 800 ? "strong" : "slow";
  const t = now();
  await prisma.dayCheck.upsert({ where: { sessionId: o.s.id }, update: { linkTestedAt: t, connection }, create: { sessionId: o.s.id, clientId: o.client.id, linkTestedAt: t, connection } });
  revalidatePath(`/live/${o.s.id}`);
  return { ok: true, toast: `Join link works. See you at ${timeLabel(o.s.startsAt)}.` };
}

/** Client joins the live session: the session starts (phases), practitioner is told. */
export async function joinLive(sessionId: string): Promise<Result> {
  const o = await own(sessionId);
  if (!o) return { error: "We could not find this session." };
  const t = now();
  const check = await prisma.dayCheck.findUnique({ where: { sessionId: o.s.id } });
  if (check?.joinedAt) {
    await prisma.dayCheck.update({ where: { sessionId: o.s.id }, data: { lastSeenAt: t } });
    return { ok: true };
  }
  await prisma.dayCheck.upsert({ where: { sessionId: o.s.id }, update: { joinedAt: t, lastSeenAt: t }, create: { sessionId: o.s.id, clientId: o.client.id, joinedAt: t, lastSeenAt: t } });
  if (!o.s.checkedInAt) await prisma.session.update({ where: { id: o.s.id }, data: { checkedInAt: t } });
  await ensureAssessment(o, t);
  await tellStaff(o, "staff_client_joined", `${o.client.firstName} ${o.client.lastName} joined the live session (${timeLabel(t)}).`, "Joined the live video session");
  return { ok: true };
}

/** Rejoin after a dropped connection. Results so far are kept server side. */
export async function rejoinLive(sessionId: string): Promise<Result> {
  const o = await own(sessionId);
  if (!o) return { error: "We could not find this session." };
  const t = now();
  await prisma.dayCheck.upsert({ where: { sessionId: o.s.id }, update: { reconnects: { increment: 1 }, lastSeenAt: t }, create: { sessionId: o.s.id, clientId: o.client.id, joinedAt: t, lastSeenAt: t, reconnects: 1 } });
  if (o.s.assessmentId) await prisma.assessment.update({ where: { id: o.s.assessmentId }, data: { connectionLost: false } });
  return { ok: true, toast: `Back on. ${o.coach} can see you.` };
}

/** Mark the connection lost (best effort, called when the browser comes back after a drop). */
export async function reportConnectionLost(sessionId: string): Promise<Result> {
  const o = await own(sessionId);
  if (!o || !o.s.assessmentId) return { ok: false };
  await prisma.assessment.update({ where: { id: o.s.assessmentId }, data: { connectionLost: true } });
  return { ok: true };
}

const VIEWS = { front: "Front", side: "Side", back: "Back" } as const;

/** Guided photo capture: save to storage + MediaAsset (capturedBy CLIENT). Retake supersedes the previous one. */
export async function uploadDayPhoto(form: FormData): Promise<Result & { mediaId?: string }> {
  const o = await own(String(form.get("sessionId") ?? ""));
  if (!o) return { error: "We could not find this session." };
  const view = z.enum(["front", "side", "back"]).safeParse(form.get("view"));
  const file = form.get("file");
  if (!view.success || !(file instanceof File)) return { error: "That photo did not come through. Try again." };
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES || !["image/jpeg", "image/png"].includes(file.type)) return { error: "That photo did not come through. Try again." };
  const consents = await prisma.consent.findMany({ where: { clientId: o.client.id, kind: { in: ["PHOTOS_VIDEOS", "ASSESSMENT_MEDIA"] } } });
  const photosOn = consents.find((c) => c.kind === "PHOTOS_VIDEOS")?.granted === true && consents.find((c) => c.kind === "ASSESSMENT_MEDIA")?.granted !== false;
  if (!photosOn) return { error: "Photos are off. You can change it in Account." };
  const moduleKey = o.s.online ? "live" : "inperson";
  const put = await storage.put(file, `media/${o.client.id}`);
  const t = now();
  const prev = await prisma.mediaAsset.findMany({ where: { clientId: o.client.id, moduleKey, view: view.data, kind: "PHOTO", supersededById: null } });
  const m = await prisma.mediaAsset.create({
    data: { clientId: o.client.id, moduleKey, kind: "PHOTO", view: view.data, label: `${VIEWS[view.data]} photo`, storageKey: put.key, tag: "OBSERVED", status: "NEEDS_REVIEW", capturedBy: "CLIENT", capturedAt: t },
  });
  if (prev.length) await prisma.mediaAsset.updateMany({ where: { id: { in: prev.map((p) => p.id) } }, data: { supersededById: m.id } });
  await prisma.activityLog.create({ data: { clientId: o.client.id, actorName: `${o.client.firstName} ${o.client.lastName}`, action: `${prev.length ? "Retook" : "Took"} ${VIEWS[view.data].toLowerCase()} photo (${o.s.online ? "live online" : "in person"})`, createdAt: t } });
  revalidatePath(`/live/${o.s.id}`);
  return { ok: true, mediaId: m.id };
}
