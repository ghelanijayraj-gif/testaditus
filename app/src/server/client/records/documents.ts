import "server-only";
import type { Channel, Document } from "@prisma/client";
import { prisma } from "@/server/db";
import { now } from "@/lib/clock";
import { dateLong } from "@/components/client/records/fmt";
import { DOC_TYPE_LABEL, SYSTEMS, sysByKey } from "@/components/client/records/catalog";
import { isReadOnlyStage } from "./common";

export type DocFilters = { tab?: string; type?: string; source?: string; link?: string; date?: string; layout?: string; file?: string };

const isImage = (f: string) => /\.(jpe?g|png)$/i.test(f);
export const docMime = (filename: string) => (/\.pdf$/i.test(filename) ? "application/pdf" : /\.png$/i.test(filename) ? "image/png" : /\.jpe?g$/i.test(filename) ? "image/jpeg" : /\.mp4$/i.test(filename) ? "video/mp4" : /\.svg$/i.test(filename) ? "image/svg+xml" : "application/octet-stream");

/** "Recovery · Resting heart rate", "All four systems", or "" */
export async function supportsLabel(docs: Pick<Document, "linkedMeasureKey" | "linkedSystem">[]) {
  const keys = [...new Set(docs.map((d) => d.linkedMeasureKey).filter((k): k is string => !!k && k !== "all"))];
  const tests = keys.length ? await prisma.testDefinition.findMany({ where: { key: { in: keys } }, select: { key: true, name: true, system: true } }) : [];
  return (d: Pick<Document, "linkedMeasureKey" | "linkedSystem">) => {
    if (d.linkedMeasureKey === "all") return "All four systems";
    const t = tests.find((x) => x.key === d.linkedMeasureKey);
    const sys = sysByKey(d.linkedSystem ?? t?.system);
    if (t) return `${sys?.name ?? ""}${sys ? " · " : ""}${t.name}`;
    return sys?.name ?? "";
  };
}

export function docCard(d: Document, supports: string) {
  const type = DOC_TYPE_LABEL[d.type];
  const photo = d.type === "PROGRESS_PHOTO" || d.type === "PROGRESS_VIDEO" || isImage(d.filename);
  return {
    id: d.id,
    name: d.title,
    type,
    date: dateLong(d.testDate ?? d.createdAt),
    source: d.source === "CLIENT" ? "Added by you" : "Shared by ADITUS",
    mine: d.source === "CLIENT",
    supports,
    cap: `${photo ? "PHOTO" : "PDF"}: ${d.title.toUpperCase()}`,
    hasFile: !!d.storageKey,
    image: !!d.storageKey && isImage(d.filename),
    pdf: !!d.storageKey && /\.pdf$/i.test(d.filename),
    status: d.status,
  };
}

/** "Viewed by Coach Shimyu" */
const viewer = (name: string) => (/^(coach|the )/i.test(name) ? name : `Coach ${name}`);

export async function getDocumentsView(clientId: string, f: DocFilters) {
  const client = await prisma.clientProfile.findUniqueOrThrow({ where: { id: clientId }, include: { coaches: { include: { staff: { include: { user: true } } } } } });
  const all = await prisma.document.findMany({ where: { clientId, status: { not: "UPLOADING" } }, orderBy: [{ createdAt: "desc" }] });
  const sup = await supportsLabel(all);
  const type = f.type ?? "All";
  const source = f.source ?? "All";
  const link = f.link ?? "all";
  const date = f.date ?? "all";
  const since = date === "30d" ? now().getTime() - 30 * 86_400_000 : date === "6m" ? now().getTime() - 183 * 86_400_000 : 0;
  const linkKey = SYSTEMS.find((s) => s.id === link)?.key;
  const testSystems = await prisma.testDefinition.findMany({ select: { key: true, system: true } });
  const sysOf = (d: Document) => d.linkedSystem ?? testSystems.find((t) => t.key === d.linkedMeasureKey)?.system ?? null;

  const files = all
    .filter((d) => d.status !== "FAILED")
    .filter((d) => type === "All" || DOC_TYPE_LABEL[d.type] === type)
    .filter((d) => source === "All" || (source === "you" ? d.source === "CLIENT" : d.source === "ADITUS"))
    .filter((d) => link === "all" || d.linkedMeasureKey === "all" || (linkKey && sysOf(d) === linkKey))
    .filter((d) => !since || (d.testDate ?? d.createdAt).getTime() >= since)
    .map((d) => docCard(d, sup(d)));

  // File drawer
  let open = null;
  const doc = f.file ? all.find((d) => d.id === f.file) : null;
  if (doc) {
    // The client opening their own file is logged too (access log shows "Viewed by you").
    await prisma.documentView.create({ data: { clientId, documentId: doc.id, createdAt: now() } });
    const staffViews = await prisma.accessLog.findMany({
      where: { clientId, action: "VIEWED", OR: [{ resourceId: doc.id }, { resourceId: null, resourceName: { in: [doc.filename, doc.title] } }] },
      orderBy: { createdAt: "desc" },
    });
    const own = await prisma.documentView.findMany({ where: { documentId: doc.id }, orderBy: { createdAt: "asc" }, take: 1 });
    const log: { who: string; when: string; at: number }[] = staffViews.map((v) => ({ who: `Viewed by ${viewer(v.actorName)}`, when: dateLong(v.createdAt), at: v.createdAt.getTime() }));
    if (doc.source === "CLIENT") log.push({ who: "Uploaded by you", when: dateLong(doc.createdAt), at: doc.createdAt.getTime() });
    else {
      if (own[0]) log.push({ who: "Viewed by you", when: dateLong(own[0].createdAt), at: own[0].createdAt.getTime() });
      log.push({ who: `Shared by ${viewer(doc.uploadedByName)}`, when: dateLong(doc.createdAt), at: doc.createdAt.getTime() });
    }
    log.sort((a, b) => b.at - a.at);
    const values = Array.isArray(doc.recordedValues) ? (doc.recordedValues as { name: string; value: string; unit?: string }[]) : [];
    open = {
      ...docCard(doc, sup(doc)),
      rows: [
        ["Added by", doc.source === "CLIENT" ? "You" : viewer(doc.uploadedByName)],
        ["Added on", dateLong(doc.createdAt)],
        ["Supports", sup(doc) || "Not linked"],
      ] as [string, string][],
      values: doc.type === "BLOOD_TEST" ? values.map((v) => ({ k: v.name, v: [v.value, v.unit].filter(Boolean).join(" ") })) : [],
      log,
    };
  }

  // Sent to you: outbox messages that delivered a file or a document notice, grouped by item.
  const links = await prisma.outboxDocument.findMany({ where: { messageId: { in: (await prisma.outboxMessage.findMany({ where: { clientId }, select: { id: true } })).map((m) => m.id) } } });
  const SENT_TEMPLATES = ["report_ready", "export_ready", "document_shared", "invoice", "consents_copy", "welcome"];
  const msgs = await prisma.outboxMessage.findMany({
    where: { clientId, status: { not: "FAILED" }, OR: [{ id: { in: links.map((l) => l.messageId) } }, { template: { in: SENT_TEMPLATES } }], AND: [{ OR: [{ sendAt: null }, { sendAt: { lte: now() } }] }, { NOT: { template: { startsWith: "staff_" } } }, { NOT: { template: { startsWith: "coach_" } } }] },
    orderBy: { createdAt: "desc" },
  });
  const groups = new Map<string, { d: string; t: string; ch: Channel[]; docId: string | null; at: number }>();
  for (const m of msgs) {
    const l = links.find((x) => x.messageId === m.id);
    const title = l?.title ?? m.subject ?? m.template.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
    const key = dateLong(m.createdAt) + "|" + title;
    const g = groups.get(key) ?? { d: dateLong(m.createdAt), t: title, ch: [], docId: l?.documentId || null, at: m.createdAt.getTime() };
    if (!g.ch.includes(m.channel)) g.ch.push(m.channel);
    g.docId ||= l?.documentId || null;
    groups.set(key, g);
  }
  const CH: Record<Channel, string> = { PORTAL: "Portal", WHATSAPP: "WhatsApp", EMAIL: "Email" };
  const ORDER: Channel[] = ["PORTAL", "WHATSAPP", "EMAIL"];
  const sent = [...groups.values()]
    .sort((a, b) => b.at - a.at)
    .map((g) => ({ ...g, ch: [...g.ch].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)).map((c) => CH[c]) }));

  const coach = client.coaches.find((c) => c.role === "PERSONAL_TRAINING")?.staff.user.name ?? client.coaches[0]?.staff.user.name ?? "Shimyu";
  const failed = all.filter((d) => d.source === "CLIENT" && d.status === "FAILED").slice(0, 1).map((d) => ({ id: d.id, name: d.filename }));
  return { files, total: all.length, open, sent, coach, readOnly: isReadOnlyStage(client.stage), failed, filters: { tab: f.tab === "sent" ? "sent" : "files", type, source, link, date, layout: f.layout === "list" ? "list" : "grid" } };
}

export type DocumentsViewData = Awaited<ReturnType<typeof getDocumentsView>>;
