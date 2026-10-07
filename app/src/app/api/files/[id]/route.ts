import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/server/db";
import { clientAuth } from "@/server/auth/client";
import { staffAuth } from "@/server/auth/staff";
import { canOnClient, logAccess } from "@/server/auth/guards";
import { storage } from "@/server/integrations/storage";
import { now } from "@/lib/clock";
import { DOC_TYPE_LABEL } from "@/components/client/records/catalog";
import { dateLong } from "@/components/client/records/fmt";
import { docMime } from "@/server/client/records/documents";
import { placeholderPdf, placeholderSvg } from "@/server/client/records/files";

/**
 * GET /api/files/[id] streams a Document (or MediaAsset) file.
 * Clients: only their own files. Staff (staff session with MFA): only with media.view on that client;
 * every staff fetch is written to the access log (VIEWED), refusals too (DENIED → 403).
 * ?download=1 sends it as an attachment; ?preview=1 asks for an image preview.
 * Seeded samples have nothing stored: a generated placeholder (SVG preview or a one page PDF) is returned.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const download = req.nextUrl.searchParams.get("download") === "1";
  const preview = req.nextUrl.searchParams.get("preview") === "1";

  const doc = await prisma.document.findUnique({ where: { id } });
  const media = doc ? null : await prisma.mediaAsset.findUnique({ where: { id } });
  if (!doc && !media) return new NextResponse("Not found", { status: 404 });
  const clientId = (doc ?? media)!.clientId;
  const name = doc ? doc.title : media!.label;
  const resource = { type: doc ? "document" : "media", id, name };

  let allowed = false;
  let signedIn = false;
  const cs = await clientAuth();
  if (cs?.user?.id && cs.user.kind === "CLIENT") {
    signedIn = true;
    const me = await prisma.clientProfile.findUnique({ where: { userId: cs.user.id } });
    if (me?.id === clientId) {
      allowed = true;
      if (doc && download) await prisma.documentView.create({ data: { clientId, documentId: doc.id, createdAt: now() } });
    }
  }
  if (!allowed) {
    const ss = await staffAuth();
    if (ss?.user?.id && ss.user.kind === "STAFF" && ss.user.mfa) {
      signedIn = true;
      const staff = await prisma.staffProfile.findUnique({ where: { userId: ss.user.id }, include: { user: true } });
      if (staff && !staff.user.disabled) {
        const ctx = { staff, role: staff.role, userId: staff.userId, name: staff.user.name ?? staff.user.email };
        const ok = await canOnClient(ctx, "media.view", clientId);
        await logAccess(ctx, clientId, resource, ok ? "VIEWED" : "DENIED");
        if (!ok) return new NextResponse("Forbidden", { status: 403 });
        allowed = true;
      }
    }
  }
  if (!allowed) return new NextResponse(signedIn ? "Forbidden" : "Sign in to view this file", { status: signedIn ? 403 : 401 });

  const filename = doc?.filename ?? `${media!.label}.${media!.kind === "VIDEO" ? "mp4" : "jpg"}`;
  const headers = (type: string, fname: string) => ({
    "Content-Type": type,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fname.replace(/[^\x20-\x7E]|"/g, "_")}"; filename*=UTF-8''${encodeURIComponent(fname)}`,
  });

  const key = doc?.storageKey ?? media?.storageKey;
  const stored = key ? await storage.get(key) : null;
  if (stored && !(preview && !/^image\//.test(docMime(filename)))) {
    return new NextResponse(new Uint8Array(stored), { headers: headers(docMime(filename), filename) });
  }

  // Placeholder for seeded samples (or a preview of a stored PDF).
  const kind = doc ? DOC_TYPE_LABEL[doc.type] : media!.kind === "VIDEO" ? "Video" : "Photo";
  const pdfLike = /\.pdf$/i.test(filename) && !preview;
  if (pdfLike) {
    const client = await prisma.clientProfile.findUnique({ where: { id: clientId } });
    const values = doc && Array.isArray(doc.recordedValues) ? (doc.recordedValues as { name: string; value: string; unit?: string }[]) : [];
    const lines = [
      name,
      `${kind}${doc?.testDate ? " · " + dateLong(doc.testDate) : ""}`,
      client ? `${client.firstName} ${client.lastName} · ${client.code}` : "",
      "",
      ...(values.length ? ["Recorded values, as written in the report:", ...values.map((v) => `  ${v.name}: ${v.value}${v.unit ? " " + v.unit : ""}`), ""] : []),
      "ADITUS sample file. The original is not stored in this demo.",
    ];
    return new NextResponse(new Uint8Array(placeholderPdf(lines)), { headers: headers("application/pdf", filename) });
  }
  const svg = placeholderSvg(name, kind);
  return new NextResponse(svg, { headers: headers("image/svg+xml", filename.replace(/\.[^.]+$/, "") + ".svg") });
}
