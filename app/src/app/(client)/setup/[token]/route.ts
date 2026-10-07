import { NextResponse, type NextRequest } from "next/server";
import { signInWithSetupToken } from "@/server/onboarding/setup";

/**
 * GET /setup/<token> — the private link from "Welcome to ADITUS, set up your account".
 * Valid (unused, under 48 h): opens a client session and continues account setup where it
 * was left. Expired or used: the "This link has expired" screen.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const hit = await signInWithSetupToken(token);
  if (!hit) return NextResponse.redirect(new URL("/signin/expired", req.url));
  return NextResponse.redirect(new URL(hit.client.accountSetupDone ? "/" : "/setup", req.url));
}
