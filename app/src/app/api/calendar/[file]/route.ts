import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/server/db";
import { clientAuth } from "@/server/auth/client";
import { now } from "@/lib/clock";

/** GET /api/calendar/<sessionId>.ics: one session as an iCalendar file (Apple Calendar and others). Client's own sessions only. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const id = file.replace(/\.ics$/i, "");
  const session = await clientAuth();
  if (!session?.user?.id || session.user.kind !== "CLIENT") return new NextResponse("Sign in first", { status: 401 });
  const s = await prisma.session.findFirst({ where: { id, client: { userId: session.user.id } }, include: { centre: true, coach: { include: { user: true } } } });
  if (!s) return new NextResponse("Not found", { status: 404 });
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
  const end = new Date(s.startsAt.getTime() + s.durationMin * 60_000);
  const where = s.online ? s.joinUrl ?? "Online" : s.centre ? `${s.centre.name}, ${s.centre.address}` : s.room ?? "";
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ADITUS//Client portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${s.id}@aditus.in`,
    `DTSTAMP:${stamp(now())}`,
    `DTSTART:${stamp(s.startsAt)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc("ADITUS · " + s.title)}`,
    `LOCATION:${esc(where)}`,
    `DESCRIPTION:${esc(`With ${s.coach?.user.name ?? "ADITUS team"}.${s.online && s.joinUrl ? " Join: " + s.joinUrl : ""}`)}`,
    ...(s.status === "CANCELLED" ? ["STATUS:CANCELLED"] : ["STATUS:CONFIRMED"]),
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(s.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new NextResponse(body, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="aditus-${s.id}.ics"`, "Cache-Control": "no-store" } });
}
