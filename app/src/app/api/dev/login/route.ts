import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/server/db";
import { devAuthEnabled } from "@/server/auth/factory";
import { clientSignIn } from "@/server/auth/client";
import { staffSignIn } from "@/server/auth/staff";

/** Dev only: GET /api/dev/login?kind=client|staff&email=…[&to=/path] signs in without a password. */
export async function GET(req: NextRequest) {
  if (!devAuthEnabled()) return new NextResponse("Not found", { status: 404 });
  const kind = req.nextUrl.searchParams.get("kind");
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase() ?? "";
  const to = req.nextUrl.searchParams.get("to");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.kind !== (kind === "staff" ? "STAFF" : "CLIENT")) return new NextResponse("No such " + kind, { status: 404 });
  if (kind === "staff") await staffSignIn("dev", { userId: user.id, redirect: false });
  else await clientSignIn("dev", { userId: user.id, redirect: false });
  return to ? NextResponse.redirect(new URL(to, req.url)) : NextResponse.json({ ok: true, user: user.email });
}
