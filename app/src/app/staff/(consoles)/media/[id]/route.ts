import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/server/db";
import { storage } from "@/server/integrations/storage";
import { consoleCtx, openClient } from "@/server/consoles/access";

/** Serves a client photo or video to staff in scope; every open is logged (VIEWED or DENIED). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!m?.storageKey) return new NextResponse("Not found", { status: 404 });
  const ctx = await consoleCtx();
  if (!(await openClient(ctx, m.clientId, { type: "media", id: m.id, name: m.label }))) return new NextResponse("No access", { status: 403 });
  const buf = await storage.get(m.storageKey);
  if (!buf) return new NextResponse("Not found", { status: 404 });
  const type = /\.png$/i.test(m.storageKey) ? "image/png" : /\.webm$/i.test(m.storageKey) ? "video/webm" : /\.mp4$/i.test(m.storageKey) ? "video/mp4" : "image/jpeg";
  return new NextResponse(new Uint8Array(buf), { headers: { "content-type": type, "cache-control": "private, max-age=300" } });
}
