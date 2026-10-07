import { NextResponse, type NextRequest } from "next/server";

/**
 * Two interfaces, two addresses. When STAFF_HOST is set (e.g. staff.aditus.in),
 * that host serves the console at its root and the client host refuses /staff.
 * In development both live on localhost: /staff for staff, / for clients.
 */
export function middleware(req: NextRequest) {
  // Hosted demo: one shared password for the whole site (HTTP basic auth, any username).
  const demoPassword = process.env.DEMO_PASSWORD;
  if (demoPassword) {
    const auth = req.headers.get("authorization") ?? "";
    let given = "";
    try {
      given = auth.startsWith("Basic ") ? atob(auth.slice(6)).split(":").slice(1).join(":") : "";
    } catch {
      given = "";
    }
    if (given !== demoPassword) {
      return new NextResponse("ADITUS demo: password required.", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="ADITUS demo", charset="UTF-8"' } });
    }
  }
  const host = req.headers.get("host")?.split(":")[0];
  const staffHost = process.env.STAFF_HOST;
  const { pathname } = req.nextUrl;
  if (!staffHost) return NextResponse.next();
  const passthrough = pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.startsWith("/staff");
  if (host === staffHost && !passthrough) {
    const url = req.nextUrl.clone();
    url.pathname = "/staff" + (pathname === "/" ? "" : pathname);
    return NextResponse.rewrite(url);
  }
  if (host !== staffHost && pathname.startsWith("/staff")) return new NextResponse("Not found", { status: 404 });
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
