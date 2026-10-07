import { NextResponse, type NextRequest } from "next/server";
import { sessionClient } from "@/server/onboarding/session";
import { saveClientUpload } from "@/server/onboarding/upload";

/** Setup 4 · Bring your documents: one file per request (multipart field "file"). */
export async function POST(req: NextRequest) {
  const client = await sessionClient();
  if (!client) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const fd = await req.formData().catch(() => null);
  const file = fd?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  const r = await saveClientUpload(client.id, `${client.firstName} ${client.lastName}`.trim(), file);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 415 });
  return NextResponse.json(r.doc);
}
