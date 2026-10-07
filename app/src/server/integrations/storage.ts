import "server-only";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * File storage. Dev: local disk under .uploads/. Real: S3 or GCS with signed URLs.
 * Files are only ever served through /api/files/[key], which checks permissions
 * and writes to the access log.
 */
export interface Storage {
  put(file: File, prefix: string): Promise<{ key: string; size: number }>;
  get(key: string): Promise<Buffer | null>;
}

const root = path.join(process.cwd(), ".uploads");

export const storage: Storage = {
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

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const ALLOWED_UPLOAD = ["application/pdf", "image/jpeg", "image/png"];
