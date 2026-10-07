import "server-only";
import type { ConsentKind } from "@prisma/client";
import { prisma } from "@/server/db";
import { dateLong } from "@/components/client/records/fmt";
import { istDay, monthYear } from "./common";
import { getSources } from "./health";

export const ACCOUNT_CONSENTS: [ConsentKind, string, string][] = [
  ["HEALTH_DOCUMENTS", "Store my health documents", "Blood tests, scans and notes you upload. Seen only by you, your coach and the head coach."],
  ["PHOTOS_VIDEOS", "Progress photos and videos", "Used to compare your baseline and reassessment."],
  ["HEALTH_APP_SYNC", "Sync data from health apps", "Read only. You choose what your coach sees."],
  ["TESTIMONIAL", "Share my story as a testimonial", "We always show you the final version first."],
  ["COMMUNITY", "ADITUS community", "WhatsApp group for events and open practice."],
];

/** What withdrawing means, confirmed before the change. */
export const WITHDRAW_CONFIRM: Partial<Record<ConsentKind, string>> = {
  HEALTH_DOCUMENTS: "Withdraw consent to store health documents? Your coaches will no longer see the files you uploaded. You can still see and download them, or ask us to delete them.",
  HEALTH_APP_SYNC: "Withdraw consent to sync health apps? Every connected app is disconnected and nothing more is read. Data already synced stays visible to you only.",
};

export async function getAccountView(clientId: string) {
  const c = await prisma.clientProfile.findUniqueOrThrow({ where: { id: clientId }, include: { user: true } });
  const [consents, events, centres, sources] = await Promise.all([
    prisma.consent.findMany({ where: { clientId } }),
    prisma.consentEvent.findMany({ where: { clientId, granted: true }, orderBy: { createdAt: "desc" } }),
    prisma.centre.findMany({ orderBy: { name: "asc" } }),
    getSources(clientId),
  ]);
  const emergency = [c.emergencyName, c.emergencyPhone].filter(Boolean).join(" · ");
  return {
    kicker: `ID ${c.code} · Client since ${monthYear(c.user.createdAt)}`,
    email: c.user.email,
    details: {
      firstName: c.firstName,
      lastName: c.lastName,
      mobile: c.mobile ?? "",
      dob: c.dateOfBirth ? istDay(c.dateOfBirth) : "",
      emergencyName: c.emergencyName ?? "",
      emergencyPhone: c.emergencyPhone ?? "",
      city: c.city ?? "",
      pin: c.pin ?? "",
    },
    rows: [
      ["Name", `${c.firstName} ${c.lastName}`],
      ["Email", c.user.email],
      ["Mobile", c.mobile ?? "Not given"],
      ["Date of birth", c.dateOfBirth ? dateLong(c.dateOfBirth) : "Not given"],
      ["Emergency contact", emergency || "Not given"],
      ["City", c.city ?? "Not given"],
      ["PIN", c.pin ?? "Not given"],
    ] as [string, string][],
    method: c.user.signInMethod,
    hasPassword: !!c.user.passwordHash,
    centres: centres.map((x) => ({ id: x.id, name: x.name, area: x.area.split(",").pop()!.trim() })),
    centreId: c.preferredCentreId,
    notify: [
      ["whatsappUpdates", "WhatsApp session reminders", "24 hours and 2 hours before each session", c.whatsappUpdates],
      ["notifyEmailReport", "Email when a report is ready", `Sent to ${c.user.email}`, c.notifyEmailReport],
      ["notifyReassessWindow", "Reassessment window reminder", "When the window opens, and one week before it closes", c.notifyReassessWindow],
    ] as ["whatsappUpdates" | "notifyEmailReport" | "notifyReassessWindow", string, string, boolean][],
    consents: ACCOUNT_CONSENTS.map(([kind, t, d]) => {
      const row = consents.find((x) => x.kind === kind);
      const on = !!row?.granted;
      const given = events.find((e) => e.kind === kind)?.createdAt ?? (on ? row?.changedAt : null);
      return { kind, t, d, on, date: on && given ? `Given ${dateLong(given)}` : "Not given", confirm: WITHDRAW_CONFIRM[kind] ?? null };
    }),
    sources: sources.map((s) => ({ name: s.name, status: s.status, tone: s.tone })),
  };
}

export type AccountViewData = Awaited<ReturnType<typeof getAccountView>>;
