import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/server/db";
import { clientAuth } from "@/server/auth/client";
import { saveUpload } from "@/server/client/records/upload";

/**
 * POST /api/files: client document upload (multipart: file, type, testDate, link).
 * A route handler rather than a Server Action because Server Action bodies are capped at 1 MB
 * by default and uploads go up to 20 MB.
 */
export async function POST(req: NextRequest) {
  const s = await clientAuth();
  if (!s?.user?.id || s.user.kind !== "CLIENT") return NextResponse.json({ error: "Sign in again to upload." }, { status: 401 });
  const client = await prisma.clientProfile.findUnique({ where: { userId: s.user.id } });
  if (!client) return NextResponse.json({ error: "Sign in again to upload." }, { status: 401 });
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 21 * 1024 * 1024) return NextResponse.json({ error: "That file is over 20 MB. Try a smaller file or a photo of each page." }, { status: 413 });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Upload failed. Nothing was saved. Try again." }, { status: 400 });
  }
  const r = await saveUpload(client, s.user.name ?? "Client", form);
  return NextResponse.json(r, { status: r.error ? 400 : 200 });
}
