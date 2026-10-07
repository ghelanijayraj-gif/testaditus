import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { storage } from "@/server/integrations/storage";
import { clientIdOrNull } from "@/server/client/day/load";

export const dynamic = "force-dynamic";

/** The client's own guided capture photo (retake preview). Only the owner can read it here. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientId = await clientIdOrNull();
  if (!clientId) return new NextResponse("Signed out", { status: 401 });
  const m = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!m || m.clientId !== clientId || !m.storageKey) return new NextResponse("Not found", { status: 404 });
  const buf = await storage.get(m.storageKey);
  if (!buf) return new NextResponse("Not found", { status: 404 });
  const type = m.storageKey.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": type, "Cache-Control": "private, no-store" } });
}
