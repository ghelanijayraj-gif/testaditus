import "server-only";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";
import { dateLong, dayLabel } from "@/components/client/records/fmt";
import { calendarDaysUntil } from "./common";
import { getLedger } from "./orders";

export type ExportItem = { key: string; t: string; d: string; files: { label: string; href: string }[] };

const fileHref = (id: string) => `/api/files/${id}?download=1`;
const invoiceHref = (no: string) => `/orders/${encodeURIComponent(no)}/invoice`;
const AVG_BYTES = 2.7 * 1024 * 1024;

/** Build the export manifest from what we hold (reports, documents, media, invoices, consents). */
export async function buildManifest(clientId: string) {
  const [reports, docs, media, ledger, consents] = await Promise.all([
    prisma.report.findMany({ where: { clientId, status: "RELEASED" }, orderBy: { releasedAt: "asc" } }),
    prisma.document.findMany({ where: { clientId, status: "READY" }, orderBy: { createdAt: "asc" } }),
    prisma.mediaAsset.count({ where: { clientId } }),
    getLedger(clientId),
    prisma.consent.findMany({ where: { clientId } }),
  ]);
  const items: ExportItem[] = [];
  const reportDocs = docs.filter((d) => d.type === "ASSESSMENT_REPORT" || d.type === "REASSESSMENT_REPORT");
  const base = reports.find((r) => r.kind === "BASELINE");
  const re = reports.filter((r) => r.kind === "REASSESSMENT");
  const baseDoc = reportDocs.find((d) => d.type === "ASSESSMENT_REPORT" && /baseline|assessment report/i.test(d.title));
  const reDoc = reportDocs.find((d) => d.type === "REASSESSMENT_REPORT");
  if (base || baseDoc) items.push({ key: "baseline", t: "Assessment report, baseline", d: `Includes body highlights · ${dateLong((base?.releasedAt ?? baseDoc?.createdAt)!)}`, files: baseDoc ? [{ label: baseDoc.title, href: fileHref(baseDoc.id) }] : [] });
  if (re[0] || reDoc) {
    const at = (re[re.length - 1]?.releasedAt ?? reDoc?.createdAt)!;
    items.push({ key: "reassessment", t: "Reassessment report", d: `Includes body highlights · ${dateLong(at)}`, files: reDoc ? [{ label: reDoc.title, href: fileHref(reDoc.id) }] : [] });
    items.push({ key: "compare", t: "Compare summary", d: `All four systems · ${dateLong(at)}`, files: [] });
  }
  const others = reportDocs.filter((d) => d !== baseDoc && d !== reDoc);
  if (others.length) items.push({ key: "reports", t: "All other reports", d: `${others.length} ${others.length === 1 ? "file" : "files"}`, files: others.map((d) => ({ label: d.title, href: fileHref(d.id) })) });
  const mine = docs.filter((d) => d.source === "CLIENT");
  if (mine.length) items.push({ key: "mine", t: "Documents you added", d: mine.map((d) => d.title.replace(/,.*$/, "")).join(", "), files: mine.map((d) => ({ label: d.title, href: fileHref(d.id) })) });
  const progress = docs.filter((d) => d.type === "PROGRESS_PHOTO" || d.type === "PROGRESS_VIDEO");
  if (progress.length || media) items.push({ key: "media", t: "Progress photos and videos", d: re.length ? "Baseline and reassessment" : "Baseline", files: progress.map((d) => ({ label: d.title, href: fileHref(d.id) })) });
  const invoices = ledger.filter((r) => r.src === "ADITUS invoice");
  if (invoices.length) items.push({ key: "invoices", t: "Invoices", d: `${invoices.length} GST ${invoices.length === 1 ? "invoice" : "invoices"}`, files: invoices.map((r) => ({ label: r.no, href: invoiceHref(r.no) })) });
  const consentDoc = docs.find((d) => d.type === "CONSENT");
  const firstConsent = consents.filter((c) => c.granted).sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime())[0];
  if (consentDoc || firstConsent) items.push({ key: "consents", t: "Signed consents", d: dateLong((consentDoc?.createdAt ?? firstConsent?.changedAt)!), files: consentDoc ? [{ label: consentDoc.title, href: fileHref(consentDoc.id) }] : [] });

  const fileCount = items.reduce((n, i) => n + Math.max(1, i.files.length), 0);
  const sizeBytes = Math.round(docs.reduce((n, d) => n + (d.sizeBytes ?? AVG_BYTES), 0) + Math.max(0, fileCount - docs.length) * AVG_BYTES);
  return { items, fileCount, sizeBytes };
}

export async function prepareExport(clientId: string) {
  const m = await buildManifest(clientId);
  return prisma.exportPackage.create({ data: { clientId, status: "ready", items: m.items, fileCount: m.fileCount, sizeBytes: m.sizeBytes, preparedAt: now(), storageKey: null } });
}

export async function getExportView(clientId: string) {
  const client = await prisma.clientProfile.findUniqueOrThrow({ where: { id: clientId } });
  const pkg = await prisma.exportPackage.findFirst({ where: { clientId, status: "ready" }, orderBy: { createdAt: "desc" } });
  const accessDays = client.accessEndsAt ? Math.max(0, calendarDaysUntil(client.accessEndsAt)) : null;
  const ended = client.stage === "PLAN_ENDED" || client.stage === "GRACE";
  return {
    name: `${client.firstName} ${client.lastName}`,
    stage: client.stage,
    kicker: ended && accessDays != null ? `Plan ended · access ends in ${accessDays} ${accessDays === 1 ? "day" : "days"}` : ended ? "Plan ended" : "Your data · export",
    grace: client.stage === "GRACE" && accessDays != null ? `Booking is closed. Access ends in ${accessDays} ${accessDays === 1 ? "day" : "days"}. Renew any time to pick up where you left off.` : null,
    pkg: pkg
      ? { id: pkg.id, items: (pkg.items as ExportItem[]) ?? [], count: pkg.fileCount ?? 0, mb: Math.round((pkg.sizeBytes ?? 0) / (1024 * 1024)), prepared: `${dayLabel(pkg.preparedAt ?? pkg.createdAt)} ${new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric" }).format(pkg.preparedAt ?? pkg.createdAt)}` }
      : null,
  };
}
