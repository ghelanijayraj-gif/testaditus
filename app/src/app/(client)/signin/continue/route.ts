import { NextResponse, type NextRequest } from "next/server";
import { clientAuth } from "@/server/auth/client";
import { prisma } from "@/server/db";

/** After any client sign in: Home, or account setup when it is not finished yet. */
export async function GET(req: NextRequest) {
  const session = await clientAuth();
  const uid = session?.user?.kind === "CLIENT" ? session.user.id : null;
  const client = uid ? await prisma.clientProfile.findUnique({ where: { userId: uid } }) : null;
  const to = !client ? "/signin" : client.accountSetupDone ? "/" : "/setup";
  return NextResponse.redirect(new URL(to, req.url));
}
