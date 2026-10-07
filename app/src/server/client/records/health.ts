import "server-only";
import type { HealthProvider, HealthSource } from "@prisma/client";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";
import { dateShort, dayLabel, timeLabel } from "@/components/client/records/fmt";
import { METRICS, SOURCES, SYSTEMS, metricShareType, seriesValue, sourceByProvider, type SysId } from "@/components/client/records/catalog";
import { calendarDaysUntil, istDay, isReadOnlyStage } from "./common";

/** "today 6:40 AM" / "Fri 2 Oct, 9:14 PM" */
export function syncLabel(d: Date | null | undefined) {
  if (!d) return "not yet";
  return istDay(d) === istDay(now()) ? `today ${timeLabel(d)}` : `${dayLabel(d)}, ${timeLabel(d)}`;
}

export function sourceStatus(s: Pick<HealthSource, "status" | "lastSyncAt"> | undefined) {
  if (!s || s.status === "NOT_CONNECTED") return { label: "Not connected", tone: "off" as const };
  if (s.status === "ERROR") return { label: `Sync error · last sync ${s.lastSyncAt ? dayLabel(s.lastSyncAt) : "never"}`, tone: "error" as const };
  return { label: `Connected · last sync ${syncLabel(s.lastSyncAt)}`, tone: "on" as const };
}

/** All six sources with their stored state (Account → Connected apps uses this too). */
export async function getSources(clientId: string) {
  const rows = await prisma.healthSource.findMany({ where: { clientId } });
  return SOURCES.map((def) => {
    const row = rows.find((r) => r.provider === def.provider);
    const st = sourceStatus(row);
    return {
      ...def,
      status: st.label,
      tone: st.tone,
      on: st.tone !== "off",
      types: def.types.map((t) => ({ t, shared: row ? row.sharedWithCoach.includes(t) : true })),
      lastSyncAt: row?.lastSyncAt ?? null,
    };
  });
}

/** Write 90 days of samples (dev stand in for the first sync), skipping days already stored. */
export async function syncSamples(clientId: string, provider: HealthProvider, days = 90) {
  const def = sourceByProvider(provider);
  if (!def.metrics.length) return 0;
  const today = Date.parse(istDay(now()) + "T00:00:00+05:30");
  const from = new Date(today - (days - 1) * 86_400_000);
  const have = await prisma.healthSample.findMany({ where: { clientId, provider, date: { gte: from } }, select: { metric: true, date: true } });
  const seen = new Set(have.map((h) => h.metric + "|" + h.date.getTime()));
  const data = [];
  for (const id of def.metrics) {
    const m = METRICS.find((x) => x.id === id)!;
    for (let k = 0; k < days; k++) {
      const date = new Date(today - (days - 1 - k) * 86_400_000);
      if (seen.has(id + "|" + date.getTime())) continue;
      data.push({ clientId, provider, metric: id, date, value: Number(seriesValue(m, 89 - (days - 1 - k)).toFixed(3)) });
    }
  }
  if (data.length) await prisma.healthSample.createMany({ data });
  return data.length;
}

export async function getHealthView(clientId: string, opts: { sys?: string; metric?: string; range?: string }) {
  const client = await prisma.clientProfile.findUniqueOrThrow({ where: { id: clientId } });
  const sources = await getSources(clientId);
  const rows = await prisma.healthSource.findMany({ where: { clientId } });
  const live = rows.filter((r) => r.status !== "NOT_CONNECTED");
  const anyOn = live.length > 0;
  const range = [7, 30, 90].includes(Number(opts.range)) ? Number(opts.range) : 90;
  const sys = (SYSTEMS.find((s) => s.id === opts.sys)?.id ?? "movement") as SysId;

  // Metric → which live source provides it (Apple first).
  const providerFor = (metricId: string) => live.find((r) => sourceByProvider(r.provider).metrics.includes(metricId));
  const today = Date.parse(istDay(now()) + "T00:00:00+05:30");
  const from = new Date(today - 89 * 86_400_000);
  const samples = anyOn ? await prisma.healthSample.findMany({ where: { clientId, date: { gte: from }, provider: { in: live.map((r) => r.provider) } }, orderBy: { date: "asc" } }) : [];

  const series = (metricId: string, provider: HealthProvider) => samples.filter((s) => s.metric === metricId && s.provider === provider);
  const metrics = METRICS.filter((m) => m.sys === sys).flatMap((m) => {
    const src = providerFor(m.id);
    if (!src) return [];
    const pts = series(m.id, src.provider);
    if (!pts.length) return [];
    const def = sourceByProvider(src.provider);
    const via = src.provider === "APPLE_HEALTH" ? m.via : def.name;
    const shareType = metricShareType(m.id, src.provider);
    return [{ ...m, via, latest: pts[pts.length - 1].value, provider: src.provider, sync: syncLabel(src.lastSyncAt), shared: shareType ? src.sharedWithCoach.includes(shareType) : false }];
  });
  const cur = metrics.find((m) => m.id === opts.metric) ?? metrics[0] ?? null;

  let chart = null;
  if (cur) {
    const pts = series(cur.id, cur.provider).filter((p) => p.date.getTime() >= today - (range - 1) * 86_400_000);
    const start = today - (range - 1) * 86_400_000;
    const idx = (d: Date) => Math.round((Date.parse(istDay(d) + "T00:00:00+05:30") - start) / 86_400_000);
    const baseline = await prisma.assessment.findFirst({ where: { clientId, kind: "BASELINE" }, orderBy: { date: "asc" } });
    const sessions = await prisma.session.findMany({ where: { clientId, status: "DONE", startsAt: { gte: new Date(start), lte: now() } }, select: { startsAt: true } });
    let window: { opens: Date; closes: Date } | null = null;
    if (baseline) window = { opens: new Date(baseline.date.getTime() + 56 * 86_400_000), closes: new Date(baseline.date.getTime() + 84 * 86_400_000) };
    const winOpen = window && calendarDaysUntil(window.opens) <= 0 && calendarDaysUntil(window.closes) >= 0;
    chart = {
      days: range,
      points: pts.map((p) => ({ i: idx(p.date), v: p.value })),
      baseline: baseline && idx(baseline.date) >= 0 && idx(baseline.date) < range ? { i: idx(baseline.date), label: `BASELINE ${dateShort(baseline.date).toUpperCase()}` } : null,
      sessionDays: [...new Set(sessions.map((s) => idx(s.startsAt)))].filter((i) => i >= 0 && i < range),
      window: winOpen && window ? { from: Math.max(0, idx(window.opens)), to: range - 1 } : null,
      rightLabel: !window ? "TODAY" : winOpen ? `TODAY · WINDOW OPEN UNTIL ${dateShort(window.closes).toUpperCase()}` : calendarDaysUntil(window.opens) > 0 ? `TODAY · WINDOW OPENS ${dateShort(window.opens).toUpperCase()} →` : "TODAY",
      legendBaseline: baseline ? `Baseline ${dateShort(baseline.date)}` : null,
      legendWindow: window ? (calendarDaysUntil(window.closes) < 0 ? null : `Reassessment window from ${dateShort(window.opens)}`) : null,
    };
  }

  const sysKey = SYSTEMS.find((s) => s.id === sys)!.key;
  const note = await prisma.coachNote.findFirst({ where: { clientId, scope: "health", OR: [{ system: sysKey }, { system: null }] }, orderBy: [{ system: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }] });
  const errored = rows.filter((r) => r.status === "ERROR");
  return {
    readOnly: isReadOnlyStage(client.stage),
    anyOn,
    sys,
    sysName: SYSTEMS.find((s) => s.id === sys)!.name,
    range,
    sources,
    metrics,
    cur,
    chart,
    errors: errored.map((r) => {
      const def = sourceByProvider(r.provider);
      const daysAgo = r.lastSyncAt ? Math.max(1, -calendarDaysUntil(r.lastSyncAt)) : null;
      return {
        provider: r.provider,
        name: def.name,
        title: `${def.name} stopped syncing${daysAgo ? ` ${daysAgo} ${daysAgo === 1 ? "day" : "days"} ago` : ""}.`,
        line: `Last sync ${r.lastSyncAt ? syncLabel(r.lastSyncAt) : "never"}. Open ${def.name === "Garmin" ? "Garmin Connect" : def.name} and allow ADITUS again.`,
      };
    }),
    note: note ? { text: note.text, by: `${note.coachName} · updated ${dateShort(note.updatedAt)}` } : null,
  };
}

export type HealthViewData = Awaited<ReturnType<typeof getHealthView>>;
