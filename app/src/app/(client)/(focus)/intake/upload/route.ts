import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/server/db";
import { sessionClient } from "@/server/onboarding/session";
import { saveClientUpload } from "@/server/onboarding/upload";

/** Intake · Injuries: optional scan or report for one injury (multipart "file", "injuryId"). */
export async function POST(req: NextRequest) {
  const client = await sessionClient();
  if (!client) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const fd = await req.formData().catch(() => null);
  const file = fd?.get("file");
  const injuryId = String(fd?.get("injuryId") ?? "");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  const injury = injuryId ? await prisma.injury.findFirst({ where: { id: injuryId, clientId: client.id } }) : null;
  if (!injury) return NextResponse.json({ error: "No injury" }, { status: 400 });
  const r = await saveClientUpload(client.id, `${client.firstName} ${client.lastName}`.trim(), file);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 415 });
  await prisma.injury.update({ where: { id: injury.id }, data: { documentId: r.doc.id } });
  return NextResponse.json(r.doc);
}
