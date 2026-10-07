import Link from "next/link";
import { Button } from "@/components/ds";
import { Block, Filters, PageHead, type Cell, type Row } from "@/components/staff/Page";
import { AvailabilityDrawer, BookDrawer, SessionDrawer } from "@/components/staff/admin/ScheduleDrawers";
import { outlineSmall } from "@/components/staff/admin/styles";
import a from "@/components/staff/admin/admin.module.css";
import { canOnClient, clientScope, requireStaff } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";
import { dateShort, dayLabel, dayTime, timeLabel } from "@/lib/format";
import { isoDay, istDay, SESSION_SHORT, staffName } from "@/server/staff/common";
import { addSlot, bookForClient, confirmSession, removeSlot, rescheduleSession, saveExtraInfo } from "@/server/staff/actions/schedule";

export const metadata = { title: "Schedule" };

const hhmm = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: false }).format(d).replace(/^0/, "");
const STATUS: Record<string, string> = { SCHEDULED: "Scheduled · not confirmed", CONFIRMED: "Confirmed", DONE: "Done", CANCELLED: "Cancelled", MISSED: "Missed", RESCHEDULED: "Rescheduled" };

type SP = { date?: string; centre?: string; session?: string; book?: string; avail?: string; coach?: string };

export default async function Schedule({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireStaff({ section: "schedule" });
  const sp = await searchParams;
  const { start, end, iso } = istDay(sp.date);
  const centres = await prisma.centre.findMany({ orderBy: { name: "desc" } });
  const centre = centres.find((c) => c.slug === sp.centre);
  const prac = ctx.role === "PRACTITIONER";

  const qs = (o: Partial<SP>) => {
    const p = new URLSearchParams();
    const m = { date: iso === isoDay(now()) ? undefined : iso, centre: sp.centre, ...o };
    for (const [k, v] of Object.entries(m)) if (v) p.set(k, v);
    const s = p.toString();
    return `/staff/schedule${s ? `?${s}` : ""}`;
  };

  const coachesAll = await prisma.staffProfile.findMany({ where: { role: { in: ["FOUNDER", "HOD", "PRACTITIONER"] }, user: { disabled: false } }, include: { user: true }, orderBy: { createdAt: "asc" } });
  const coaches = prac ? coachesAll.filter((c) => c.id === ctx.staff.id) : coachesAll;
  const sessions = await prisma.session.findMany({
    where: { startsAt: { gte: start, lt: end }, status: { notIn: ["CANCELLED", "RESCHEDULED"] }, ...(centre ? { centreId: centre.id } : {}), ...(prac ? { OR: [{ coachId: ctx.staff.id }, { clientId: null }] } : {}) },
    include: { client: true, coach: { include: { user: true } }, centre: true },
    orderBy: { startsAt: "asc" },
  });
  const slots = await prisma.availabilitySlot.findMany({ where: { startsAt: { gte: start, lt: end }, taken: false, staffId: { in: coaches.map((c) => c.id) }, ...(centre ? { centreId: centre.id } : {}) }, orderBy: { startsAt: "asc" } });

  const times = [...new Set([...sessions.map((s) => hhmm(s.startsAt)), ...slots.map((s) => hhmm(s.startsAt))])].sort((x, y) => {
    const [ah, am] = x.split(":").map(Number);
    const [bh, bm] = y.split(":").map(Number);
    return ah * 60 + am - (bh * 60 + bm);
  });
  const group = (s: (typeof sessions)[number]) => !s.clientId;
  const label = (s: (typeof sessions)[number]) =>
    s.client
      ? `${s.client.firstName} ${s.client.lastName} · ${SESSION_SHORT[s.type]}${s.status === "SCHEDULED" && (s.type === "PERSONAL_TRAINING" || s.type === "GROUP_TRAINING") ? " · unconfirmed" : ""}`
      : `${s.title}${s.booked != null && s.capacity ? ` · ${s.booked} of ${s.capacity}` : ""}`;

  const cell = (list: (typeof sessions)[number][], free: boolean): Cell => {
    if (!list.length) return free ? { v: "Available", muted: true } : "·";
    return (
      <span style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
        {list.map((s) => {
          const t = label(s);
          const flag = /unconfirmed/.test(t);
          return (
            <Link key={s.id} href={qs({ session: s.id })} scroll={false} className={a.slot} style={{ font: flag ? "400 11px var(--font-mono)" : "400 13px var(--font-sans)" }}>
              <span className={flag ? a.slotFlag : a.slotFill} style={flag ? undefined : undefined}>
                {t}
              </span>
            </Link>
          );
        })}
      </span>
    );
  };

  const rows: Row[] = times.map((t) => ({
    key: t,
    cells: [
      { v: t, b: true },
      ...coaches.map((c) => cell(sessions.filter((s) => !group(s) && s.coachId === c.id && hhmm(s.startsAt) === t), slots.some((x) => x.staffId === c.id && hhmm(x.startsAt) === t))),
      cell(sessions.filter((s) => group(s) && hhmm(s.startsAt) === t), false),
    ],
  }));

  // Room use per centre: peak number of overlapping in centre sessions that day.
  const allDay = centre ? sessions : await prisma.session.findMany({ where: { startsAt: { gte: start, lt: end }, status: { notIn: ["CANCELLED", "RESCHEDULED"] } } });
  const peak = (cid: string) => {
    const list = allDay.filter((s) => s.centreId === cid && !s.online);
    let best = 0;
    for (const s of list) {
      const st = s.startsAt.getTime();
      best = Math.max(best, list.filter((o) => o.startsAt.getTime() <= st && o.startsAt.getTime() + o.durationMin * 60000 > st).length);
    }
    return best;
  };
  const kicker = `${dayLabel(start)} · ${centres.map((c, i) => `${c.name} ${Math.min(peak(c.id), c.rooms)} of ${c.rooms}${i === 0 ? " rooms" : ""}`).join(" · ")}`;
  const prev = isoDay(new Date(start.getTime() - 86_400_000));
  const next = isoDay(new Date(start.getTime() + 86_400_000));

  // Drawers
  let drawer: React.ReactNode = null;
  const closeHref = qs({});
  if (sp.session) {
    const s = await prisma.session.findUnique({ where: { id: sp.session }, include: { client: true, coach: { include: { user: true } }, centre: true, clientPlan: true } });
    if (s && (!s.clientId || (await canOnClient(ctx, "sessions.schedule", s.clientId)) || ctx.role === "HOD")) {
      const canChange = !(prac && s.coachId !== ctx.staff.id) && (!s.clientId || (await canOnClient(ctx, "sessions.schedule", s.clientId)));
      const free = s.coachId ? await prisma.availabilitySlot.findMany({ where: { staffId: s.coachId, taken: false, startsAt: { gt: now(), lt: new Date(now().getTime() + 21 * 86_400_000) } }, orderBy: { startsAt: "asc" }, take: 30 }) : [];
      const used = s.clientPlan ? s.sessionNumber ?? s.clientPlan.sessionsUsed + 1 : null;
      drawer = (
        <SessionDrawer
          key={s.id}
          title={`${hhmm(s.startsAt)} · ${s.clientId ? staffName(s.coach) : "Group room"}`}
          rows={[
            ["Session", `${label(s)} · ${dayTime(s.startsAt)}`],
            ["Status", STATUS[s.status]],
            ["Centre", s.online ? "Online" : s.centre ? `${s.centre.name} · ${s.centre.area.split(",")[0]}` : "·"],
            ["Plan", s.clientPlan ? `Session ${used} of ${s.clientPlan.sessionsTotal} · ends ${dateShort(s.clientPlan.endsAt)}` : s.planModuleId || s.assessmentId ? "Assessment" : s.clientId ? "·" : `${s.booked ?? 0} of ${s.capacity ?? 0} booked`],
            ["Extra info", s.extraInfo ?? "None yet"],
          ]}
          extraInfo={s.extraInfo ?? ""}
          late={s.startsAt.getTime() - now().getTime() < 24 * 3_600_000}
          slots={free.map((x) => ({ id: x.id, staffId: x.staffId, label: dayTime(x.startsAt) }))}
          closeHref={closeHref}
          canChange={canChange}
          actions={{ confirm: confirmSession.bind(null, s.id), resched: rescheduleSession.bind(null, s.id), info: saveExtraInfo.bind(null, s.id) }}
        />
      );
    }
  } else if (sp.book) {
    const clients = await prisma.clientProfile.findMany({ where: { AND: [clientScope(ctx), { stage: { notIn: ["ACCESS_ENDED"] } }] }, orderBy: { firstName: "asc" } });
    const free = await prisma.availabilitySlot.findMany({ where: { staffId: { in: coaches.map((c) => c.id) }, taken: false, startsAt: { gt: now(), lt: new Date(now().getTime() + 21 * 86_400_000) } }, orderBy: { startsAt: "asc" } });
    drawer = <BookDrawer clients={clients.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))} coaches={coaches.map((c) => ({ id: c.id, name: staffName(c) }))} slots={free.map((x) => ({ id: x.id, staffId: x.staffId, label: `${dayTime(x.startsAt)}${x.online ? " · online" : ""}` }))} closeHref={closeHref} book={bookForClient} />;
  } else if (sp.avail) {
    const coachId = coaches.find((c) => c.id === sp.coach)?.id ?? (coaches.some((c) => c.id === ctx.staff.id) ? ctx.staff.id : coaches[0]?.id);
    const list = coachId ? await prisma.availabilitySlot.findMany({ where: { staffId: coachId, startsAt: { gt: now(), lt: new Date(now().getTime() + 21 * 86_400_000) } }, orderBy: { startsAt: "asc" } }) : [];
    const cn = new Map(centres.map((c) => [c.id, c.name]));
    drawer = coachId ? (
      <AvailabilityDrawer
        coaches={coaches.map((c) => ({ id: c.id, name: staffName(c) }))}
        coachId={coachId}
        slots={list.map((x) => ({ id: x.id, taken: x.taken, label: `${dayLabel(x.startsAt)} · ${timeLabel(x.startsAt)} · ${x.minutes} min · ${x.online ? "Online" : cn.get(x.centreId ?? "") ?? "·"}` }))}
        centres={centres.map((c) => ({ id: c.id, name: c.name }))}
        closeHref={closeHref}
        coachHref={Object.fromEntries(coaches.map((c) => [c.id, qs({ avail: "1", coach: c.id })]))}
        add={addSlot}
        remove={removeSlot}
      />
    ) : null;
  }

  return (
    <>
      <PageHead
        kicker={kicker}
        title="Schedule"
        actions={
          <>
            <Button variant="blue" size="sm" href={qs({ book: "1" })}>
              BOOK FOR CLIENT
            </Button>
            <Button variant="outline" size="sm" href={qs({ avail: "1" })}>
              AVAILABILITY
            </Button>
          </>
        }
      />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <Filters items={[{ label: "All centres", href: qs({ centre: undefined }), on: !centre }, ...centres.map((c) => ({ label: c.name, href: qs({ centre: c.slug }), on: centre?.id === c.id }))]} />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Link href={qs({ date: prev })} style={outlineSmall} scroll={false} aria-label="Previous day">
            ← {dayLabel(new Date(start.getTime() - 86_400_000))}
          </Link>
          {iso !== isoDay(now()) && (
            <Link href={qs({ date: isoDay(now()) })} style={outlineSmall} scroll={false}>
              Today
            </Link>
          )}
          <Link href={qs({ date: next })} style={outlineSmall} scroll={false} aria-label="Next day">
            {dayLabel(new Date(start.getTime() + 86_400_000))} →
          </Link>
        </div>
      </div>
      <Block
        title={iso === isoDay(now()) ? "Today by coach" : `${dayLabel(start)} by coach`}
        sub="Tap a session to confirm or reschedule for the client"
        head={["Time", ...coaches.map((c) => staffName(c)), "Group room"]}
        cols={`70px ${coaches.map(() => "1fr").join(" ")} 1fr`}
        rows={rows}
        minW={`${Math.max(640, 70 + (coaches.length + 1) * 190)}px`}
        empty="Nothing booked and no availability on this day."
      />
      {drawer}
    </>
  );
}
