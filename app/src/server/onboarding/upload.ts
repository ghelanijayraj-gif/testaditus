import "server-only";
import type { DocumentType } from "@prisma/client";
import { prisma } from "@/server/db";
import { storage, ALLOWED_UPLOAD } from "@/server/integrations/storage";
import { now } from "@/lib/clock";
import { dateLong } from "@/lib/format";

/** The designs promise "PDF, JPG or PNG up to 25 MB". */
export const MAX_CLIENT_UPLOAD = 25 * 1024 * 1024;

export const DOC_TYPE_LABEL: Partial<Record<DocumentType, string>> = {
  BLOOD_TEST: "Blood test",
  XRAY: "Scan",
  MRI: "Scan",
  PHYSIO_NOTE: "Physio note",
  DOCTOR_NOTE: "Doctor note",
  OTHER: "Document",
};

export function guessDocType(name: string): DocumentType {
  const n = name.toLowerCase();
  if (/blood|cbc|lipid|panel|vitamin|thyroid/.test(n)) return "BLOOD_TEST";
  if (/\bmri\b|mri[ _.]/.test(n)) return "MRI";
  if (/x[ _-]?ray|xray|scan|ct[ _.]/.test(n)) return "XRAY";
  if (/physio/.test(n)) return "PHYSIO_NOTE";
  if (/doctor|ortho|prescription/.test(n)) return "DOCTOR_NOTE";
  return "OTHER";
}

export const titleFromFile = (name: string) => name.replace(/\.[a-z0-9]+$/i, "").replace(/[_]+/g, " ").trim() || "Document";

/**
 * Stores one client upload (setup step 4 or an intake injury scan) and writes the Document row.
 * Earlier FAILED rows for the same file name are cleared, so a retry removes the "did not upload" state.
 */
export async function saveClientUpload(clientId: string, uploader: string, file: File, opts: { type?: DocumentType } = {}) {
  if (!ALLOWED_UPLOAD.includes(file.type)) return { error: "PDF, JPG or PNG up to 25 MB" } as const;
  if (file.size > MAX_CLIENT_UPLOAD) return { error: "PDF, JPG or PNG up to 25 MB" } as const;
  const { key, size } = await storage.put(file, `clients/${clientId}/documents`);
  const type = opts.type ?? guessDocType(file.name);
  await prisma.document.deleteMany({ where: { clientId, filename: file.name, status: "FAILED" } });
  const doc = await prisma.document.create({
    data: { clientId, source: "CLIENT", type, title: titleFromFile(file.name), filename: file.name, storageKey: key, sizeBytes: size, status: "READY", uploadedByName: uploader, createdAt: now() },
  });
  return { doc: { id: doc.id, name: doc.filename, typeLabel: DOC_TYPE_LABEL[type] ?? "Document", date: dateLong(doc.createdAt) } } as const;
}

/** Records an upload that did not finish (connection dropped), so Home and staff can see it. */
export async function recordFailedUpload(clientId: string, uploader: string, name: string, percent: number) {
  const filename = name.slice(0, 200);
  await prisma.document.deleteMany({ where: { clientId, filename, status: "FAILED" } });
  return prisma.document.create({
    data: { clientId, source: "CLIENT", type: guessDocType(filename), title: titleFromFile(filename), filename, status: "FAILED", failedAtPercent: Math.max(0, Math.min(99, Math.round(percent))), uploadedByName: uploader, createdAt: now() },
  });
}
