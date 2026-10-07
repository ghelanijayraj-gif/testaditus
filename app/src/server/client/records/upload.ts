import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ClientProfile } from "@prisma/client";
import { prisma } from "@/server/db";
import { storage, ALLOWED_UPLOAD, MAX_UPLOAD_BYTES } from "@/server/integrations/storage";
import { now } from "@/lib/clock";
import { SYSTEMS, UPLOAD_TYPES } from "@/components/client/records/catalog";
import { isReadOnlyStage } from "./common";

const zUpload = z.object({
  type: z.enum(UPLOAD_TYPES.map(([l]) => l) as [string, ...string[]]),
  testDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]),
  link: z.string().max(40),
});

/** Validate and store a client upload: storage.put, then a Document row (Added by you). */
export async function saveUpload(client: ClientProfile, actor: string, form: FormData): Promise<{ toast?: string; error?: string }> {
  if (isReadOnlyStage(client.stage)) return { error: "Your plan has ended. You can still read and download everything." };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  if (!ALLOWED_UPLOAD.includes(file.type)) return { error: "That file type is not supported. Use PDF, JPG or PNG." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "That file is over 20 MB. Try a smaller file or a photo of each page." };
  const parsed = zUpload.safeParse({ type: form.get("type"), testDate: String(form.get("testDate") ?? ""), link: String(form.get("link") ?? "") });
  if (!parsed.success) return { error: "Pick a type for this file." };
  const type = UPLOAD_TYPES.find(([l]) => l === parsed.data.type)![1];
  const sys = SYSTEMS.find((s) => s.id === parsed.data.link);
  let key: string;
  try {
    ({ key } = await storage.put(file, `clients/${client.id}/documents`));
  } catch {
    return { error: "Upload failed. Nothing was saved. Try again." };
  }
  const title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Document";
  await prisma.document.create({
    data: {
      clientId: client.id,
      source: "CLIENT",
      type,
      title,
      filename: file.name,
      storageKey: key,
      sizeBytes: file.size,
      testDate: parsed.data.testDate ? new Date(parsed.data.testDate + "T00:00:00+05:30") : null,
      linkedSystem: sys?.key ?? null,
      uploadedByName: `${client.firstName} ${client.lastName}`,
      status: "READY",
      createdAt: now(),
    },
  });
  await prisma.activityLog.create({ data: { clientId: client.id, actorName: actor, action: `Uploaded ${file.name}`, createdAt: now() } });
  revalidatePath("/documents");
  return { toast: "File saved." };
}
