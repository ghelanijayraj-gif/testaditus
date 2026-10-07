import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { clientIdOrNull, liveState, loadDaySession } from "@/server/client/day/load";

export const dynamic = "force-dynamic";

/** Polled by the live and day screens every 3 to 5 s: phases, counts, pushed cue and timer. Never values. */
export async function GET(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const clientId = await clientIdOrNull();
  if (!clientId) return NextResponse.json({ error: "signed out" }, { status: 401 });
  const s = await prisma.session.findUnique({ where: { id: sessionId }, select: { clientId: true } });
  if (!s || s.clientId !== clientId) return NextResponse.json({ error: "not found" }, { status: 404 });
  const d = await loadDaySession(clientId, sessionId);
  return NextResponse.json(await liveState(d), { headers: { "Cache-Control": "no-store" } });
}
