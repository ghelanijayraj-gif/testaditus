import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { requireClient } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";
import { dayLabel, timeLabel } from "@/lib/format";
import { ToastProvider } from "@/components/ui/Toast";
import { BookFlow, type BookStep } from "@/components/client/plan/BookFlow";
import { Flash } from "@/components/client/plan/clientParts";
import { VisitingMumbai } from "@/components/client/plan/parts";
import s from "@/components/client/plan/plan.module.css";

export const metadata: Metadata = { title: "Add and book" };

/** 06 G. Add and book (?step=pay|centre|time|booked). The step follows the real state. */
export default async function InPersonPage({ searchParams }: { searchParams: Promise<{ step?: string; centre?: string }> }) {
  const { client } = await requireClient();
  const q = await searchParams;

  if (!client.inMumbaiArea) {
    return (
      <main className={s.main} style={{ maxWidth: 820, display: "flex", flexDirection: "column", gap: 16 }}>
        <Link href="/assessment/plan" className={s.textBtn}>
          ← Assessment plan
        </Link>
        <h1 className={s.h1} style={{ fontSize: "clamp(28px,5vw,44px)" }}>
          In person sessions are in Mumbai.
        </h1>
        <span className={s.lead}>They run at TIC Kandivali and Samyah Borivali. Your assessment continues online.</span>
        <VisitingMumbai />
      </main>
    );
  }

  const plan = await prisma.assessmentPlan.findFirst({ where: { clientId: client.id, kind: "BASELINE" }, orderBy: { createdAt: "desc" } });
  const mod = plan ? await prisma.planModule.findFirst({ where: { planId: plan.id, type: "IN_PERSON", removed: false, draft: false }, orderBy: { order: "asc" } }) : null;
  const paid = !!(mod?.data as { paidAt?: string } | null)?.paidAt;
  const booked = mod && (mod.status === "BOOKED" || mod.status === "DONE");

  let step: BookStep = (["pay", "centre", "time", "booked"] as const).find((x) => x === q.step) ?? "pay";
  if (booked) step = "booked";
  else if (!paid) step = "pay";
  else if (step === "pay" || step === "booked") step = "centre";

  const centres = await prisma.centre.findMany({ orderBy: { name: "desc" } });
  const coach = client.primaryPractitionerId ? await prisma.staffProfile.findUnique({ where: { id: client.primaryPractitionerId }, include: { user: true } }) : null;
  const jayraj = coach ?? (await prisma.staffProfile.findFirst({ where: { role: "FOUNDER" }, include: { user: true } }));
  const centreSlug = centres.find((c) => c.slug === q.centre)?.slug ?? centres.find((c) => c.id === client.preferredCentreId)?.slug ?? centres[0]?.slug ?? "";

  let days: { day: string; slots: { id: string; time: string }[] }[] = [];
  if (step === "time" && jayraj) {
    const centre = centres.find((c) => c.slug === centreSlug);
    const slots = await prisma.availabilitySlot.findMany({ where: { staffId: jayraj.id, centreId: centre?.id, online: false, taken: false, startsAt: { gt: now() } }, orderBy: { startsAt: "asc" }, take: 30 });
    const map = new Map<string, { id: string; time: string }[]>();
    for (const sl of slots) {
      const k = dayLabel(sl.startsAt);
      map.set(k, [...(map.get(k) ?? []), { id: sl.id, time: timeLabel(sl.startsAt) }]);
    }
    days = [...map.entries()].map(([day, slots]) => ({ day, slots }));
  }

  let summary: { k: string; v: string; href?: string }[] = [];
  let calendarHref: string | undefined;
  if (step === "booked" && mod) {
    const session = await prisma.session.findFirst({
      where: { clientId: client.id, OR: [{ planModuleId: mod.id }, { type: "IN_PERSON_ASSESSMENT", planModuleId: null }], status: { in: ["SCHEDULED", "CONFIRMED", "DONE"] } },
      include: { centre: true, coach: { include: { user: true } } },
      orderBy: { startsAt: "asc" },
    });
    if (session) {
      calendarHref = `/api/calendar/${session.id}.ics`;
      summary = [
        { k: "When", v: `${dayLabel(session.startsAt)} · ${timeLabel(session.startsAt)}` },
        { k: "Where", v: session.centre?.name ?? "The centre", href: session.centre?.directionsUrl },
        { k: "With", v: session.coach?.user.name ?? "Jayraj" },
        { k: "Covers", v: "Movement Assessment, Breath Session, Trial Training" },
        { k: "Wear", v: "Clothes you can move in. Bare feet are fine." },
        { k: "Changes", v: "24 hours notice to reschedule" },
      ];
    }
  }

  return (
    <ToastProvider bottom={96}>
      <Suspense>
        <Flash />
      </Suspense>
      <BookFlow
        key={step}
        step={step}
        price={mod?.priceLabel ?? "₹X,XXX"}
        centres={centres.map((c) => ({ slug: c.slug, name: c.name, area: c.area }))}
        centre={centreSlug}
        days={days}
        coach={jayraj?.user.name ?? "Jayraj"}
        summary={summary}
        calendarHref={calendarHref}
      />
    </ToastProvider>
  );
}
