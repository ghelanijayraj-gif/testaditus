import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/server/db";
import { clientAuth } from "@/server/auth/client";
import { storage, MAX_UPLOAD_BYTES, ALLOWED_UPLOAD } from "@/server/integrations/storage";
import { now } from "@/lib/clock";
import { findModule } from "@/server/client/plan/common";
import { CAPTURE_ITEMS } from "@/lib/assessment/capture";

/**
 * Module and Online Capture uploads (route handler: no server action body limit, and the
 * client can show upload progress). Media → MediaAsset, documents → Document.
 * GET ?id=<mediaId>|doc_<documentId> streams the file back to its owner (previews).
 */
const MAX_MEDIA_BYTES = 200 * 1024 * 1024;

async function currentClient() {
  const session = await clientAuth();
  if (!session?.user?.id || session.user.kind !== "CLIENT") return null;
  return prisma.clientProfile.findUnique({ where: { userId: session.user.id } });
}

const DOC_TYPE: Record<string, "MRI" | "BLOOD_TEST" | "XRAY" | "OTHER"> = { mri: "MRI", blood: "BLOOD_TEST", xray: "XRAY" };

export async function POST(req: NextRequest) {
  const client = await currentClient();
  if (!client) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  const moduleKey = String(form.get("module") ?? "");
  const field = String(form.get("field") ?? "").slice(0, 64);
  const kind = String(form.get("kind") ?? "");
  const durationS = Number(form.get("durationS") ?? 0) || null;
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "No file." }, { status: 400 });
  const mod = await findModule(client.id, moduleKey);
  if (!mod || !["NOT_STARTED", "IN_PROGRESS", "MORE_NEEDED"].includes(mod.status)) return NextResponse.json({ error: "This step is no longer open." }, { status: 409 });

  if (kind === "document") {
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "That file is over 20 MB." }, { status: 413 });
    if (!ALLOWED_UPLOAD.includes(file.type)) return NextResponse.json({ error: "Use a PDF, JPG or PNG." }, { status: 415 });
    const put = await storage.put(file, `clients/${client.id}/documents`);
    const family = mod.template?.family ?? mod.key;
    const doc = await prisma.document.create({
      data: { clientId: client.id, source: "CLIENT", type: DOC_TYPE[family] ?? "OTHER", title: mod.name.replace(/^Upload (your )?/i, "").replace(/^\w/, (c) => c.toUpperCase()), filename: file.name, storageKey: put.key, sizeBytes: file.size, uploadedByName: `${client.firstName} ${client.lastName}`, createdAt: now() },
    });
    return NextResponse.json({ id: `doc_${doc.id}`, name: file.name, size: file.size });
  }

  if (kind !== "photo" && kind !== "video") return NextResponse.json({ error: "Unknown upload." }, { status: 400 });
  if (file.size > MAX_MEDIA_BYTES) return NextResponse.json({ error: "That file is too large." }, { status: 413 });
  if (!(kind === "photo" ? file.type.startsWith("image/") : file.type.startsWith("video/"))) return NextResponse.json({ error: kind === "photo" ? "Use a photo." : "Use a video." }, { status: 415 });
  if (mod.key === "capture") {
    const consents = await prisma.consent.findMany({ where: { clientId: client.id, kind: { in: ["PHOTOS_VIDEOS", "ASSESSMENT_MEDIA"] } } });
    if (!consents.length || consents.some((c) => !c.granted)) return NextResponse.json({ error: "Photo consent is off." }, { status: 403 });
  }
  const put = await storage.put(file, `clients/${client.id}/${mod.key}`);
  const item = mod.key === "capture" ? CAPTURE_ITEMS.find((c) => c.id === field) : null;
  const label = item ? `${item.label} ${kind}` : `${mod.name} · ${field}`;
  const media = await prisma.mediaAsset.create({
    data: { clientId: client.id, moduleKey: mod.key, kind: kind === "photo" ? "PHOTO" : "VIDEO", view: field || kind, label, storageKey: put.key, durationS, tag: "OBSERVED", status: "UPLOADED", capturedBy: "CLIENT", capturedAt: now() },
  });
  // A retake supersedes the earlier attempt for the same step.
  await prisma.mediaAsset.updateMany({ where: { clientId: client.id, moduleKey: mod.key, view: media.view, id: { not: media.id }, supersededById: null }, data: { supersededById: media.id } });
  return NextResponse.json({ id: media.id, name: file.name, size: file.size });
}

export async function GET(req: NextRequest) {
  const client = await currentClient();
  if (!client) return new NextResponse("Not found", { status: 404 });
  const id = req.nextUrl.searchParams.get("id") ?? "";
  let key: string | null = null;
  let type = "application/octet-stream";
  const EXT: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", webm: "video/webm", mp4: "video/mp4", mov: "video/quicktime" };
  if (id.startsWith("doc_")) {
    const d = await prisma.document.findFirst({ where: { id: id.slice(4), clientId: client.id } });
    key = d?.storageKey ?? null;
  } else {
    const m = await prisma.mediaAsset.findFirst({ where: { id, clientId: client.id } });
    key = m?.storageKey ?? null;
  }
  type = EXT[key?.split(".").pop()?.toLowerCase() ?? ""] ?? type;
  const buf = key ? await storage.get(key) : null;
  if (!buf) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600" } });
}
