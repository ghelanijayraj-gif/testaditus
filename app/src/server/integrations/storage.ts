import "server-only";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { get as blobGet, put as blobPut } from "@vercel/blob";

/**
 * File storage. Vercel Blob (private store) when BLOB_READ_WRITE_TOKEN is set, else local
 * disk under .uploads/ (development; Vercel's filesystem is read only).
 * Files are only ever served through /api/files/[key], which checks permissions
 * and writes to the access log.
 */
export interface Storage {
  put(file: File, prefix: string): Promise<{ key: string; size: number }>;
  get(key: string): Promise<Buffer | null>;
}

const root = path.join(process.cwd(), ".uploads");

const localStorage: Storage = {
  async put(file, prefix) {
    const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
    const key = `${prefix}/${randomUUID()}-${safe}`;
    const full = path.join(root, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, Buffer.from(await file.arrayBuffer()));
    return { key, size: file.size };
  },
  async get(key) {
    if (key.includes("..")) return null;
    try {
      return await readFile(path.join(root, key));
    } catch {
      return null;
    }
  },
};

/** Private Vercel Blob store; keys are blob pathnames. */
const blobStorage: Storage = {
  async put(file, prefix) {
    const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
    const b = await blobPut(`${prefix}/${safe}`, file, { access: "private", addRandomSuffix: true, contentType: file.type || undefined });
    return { key: b.pathname, size: file.size };
  },
  async get(key) {
    try {
      const r = await blobGet(key, { access: "private" });
      if (!r?.stream) return null;
      return Buffer.from(await new Response(r.stream).arrayBuffer());
    } catch {
      return null;
    }
  },
};

export const storage: Storage = process.env.BLOB_READ_WRITE_TOKEN ? blobStorage : localStorage;

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const ALLOWED_UPLOAD = ["application/pdf", "image/jpeg", "image/png"];
