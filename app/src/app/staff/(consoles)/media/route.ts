import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { audit } from "@/server/auth/guards";
import { storage } from "@/server/integrations/storage";
import { actionCtx } from "@/server/consoles/access";
import { isOnline } from "@/server/consoles/data";
import { now } from "@/lib/clock";

const MAX = 40 * 1024 * 1024;
const VIEWS: Record<string, string> = { front: "Front", side: "Side", back: "Back", left: "Left", right: "Right" };

/**
 * Staff capture upload from the practitioner console (photo per view, or a photo/video
 * attached to a test). A route handler, not a server action, so short videos fit.
 * Rejected when the client's photo and video consent is off.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const assessmentId = String(form.get("assessmentId") ?? "");
  const view = String(form.get("view") ?? "");
  const label = String(form.get("label") ?? "").slice(0, 80);
  const kind = form.get("kind") === "VIDEO" ? "VIDEO" : "PHOTO";
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "File too large" }, { status: 413 });
  if (!/^(image\/(jpeg|png)|video\/(webm|mp4))/.test(file.type)) return NextResponse.json({ error: "Photos and videos only" }, { status: 415 });
  const a = await prisma.assessment.findUnique({ where: { id: assessmentId }, include: { client: { include: { consents: true } } } });
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let ctx;
  try {
    ctx = await actionCtx(a.clientId);
  } catch {
    return NextResponse.json({ error: "No access" }, { status: 403 });
  }
  const cs = a.client.consents;
  const consent = cs.some((x) => (x.kind === "PHOTOS_VIDEOS" || x.kind === "ASSESSMENT_MEDIA") && x.granted) && !cs.some((x) => x.kind === "PHOTOS_VIDEOS" && !x.granted);
  if (!consent) return NextResponse.json({ error: `Off. ${a.client.firstName} did not consent to photos and videos.` }, { status: 403 });
  const ext = file.type.includes("png") ? ".png" : file.type.includes("webm") ? ".webm" : file.type.includes("mp4") ? ".mp4" : ".jpg";
  const named = new File([file], `${view || "capture"}${ext}`, { type: file.type });
  const put = await storage.put(named, `clients/${a.clientId}/staff`);
  const moduleKey = isOnline(a) ? "live" : "inperson";
  const row = await prisma.mediaAsset.create({
    data: { clientId: a.clientId, moduleKey, kind, view: view || "custom", label: label || VIEWS[view] || "Capture", storageKey: put.key, capturedBy: "STAFF", tag: "OBSERVED", status: "ACCEPTED", capturedAt: now() },
  });
  // A retake supersedes the earlier capture of the same view (kept, not deleted).
  if (VIEWS[view] && kind === "PHOTO")
    await prisma.mediaAsset.updateMany({ where: { clientId: a.clientId, capturedBy: "STAFF", kind: "PHOTO", view, supersededById: null, id: { not: row.id } }, data: { supersededById: row.id } });
  await audit(ctx, "MEDIA_CAPTURED", `Captured ${kind === "VIDEO" ? "video" : "photo"} · ${a.client.firstName} ${a.client.lastName} · ${row.label}`, a.clientId);
  revalidatePath(`/staff/practitioner/${a.id}`);
  return NextResponse.json({ ok: true, id: row.id, src: `/staff/media/${row.id}` });
}
