"use client";

export type Uploaded = { id: string; name: string; size: number };

export const UPLOAD_URL = "/assessment/steps/upload";
export const mediaUrl = (id: string) => `${UPLOAD_URL}?id=${encodeURIComponent(id)}`;

/** Upload one file with progress (XHR so the bar can move). Rejects with a client message. */
export function uploadFile(fields: { file: Blob; name: string; module: string; field: string; kind: "photo" | "video" | "document"; durationS?: number }, onProgress?: (pct: number) => void): Promise<Uploaded> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", fields.file instanceof File ? fields.file : new File([fields.file], fields.name, { type: fields.file.type }));
    fd.append("module", fields.module);
    fd.append("field", fields.field);
    fd.append("kind", fields.kind);
    if (fields.durationS) fd.append("durationS", String(Math.round(fields.durationS)));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", UPLOAD_URL);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body: { id?: string; name?: string; size?: number; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && body.id) resolve({ id: body.id, name: body.name ?? fields.name, size: body.size ?? fields.file.size });
      else reject(new Error(body.error ?? "Upload failed. Try again."));
    };
    xhr.onerror = () => reject(new Error("connection dropped"));
    xhr.send(fd);
  });
}

export const mb = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** Extension for a recorded/selected blob. */
export const extFor = (type: string) => (type.includes("mp4") ? "mp4" : type.includes("quicktime") ? "mov" : type.includes("webm") ? "webm" : type.includes("png") ? "png" : "jpg");

/** Best MediaRecorder type this browser supports. */
export function recorderType() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const t of ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"]) if (MediaRecorder.isTypeSupported?.(t)) return t;
  return "";
}

export const canUseCamera = () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
