// Setup links and the paid page signature. No "server-only" so the seed can mint the demo token.
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SETUP_TTL_MS = 48 * 3600 * 1000;

/** Only the sha256 of a setup token is stored (SetupToken.tokenHash). */
export const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");
export const newRawToken = () => randomBytes(24).toString("base64url");

/** Temporary password for the login details email: readable, works once, 48 hours. */
export function newTempPassword() {
  const abc = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(10), (x) => abc[x % abc.length]).join("");
}

const secret = () => process.env.AUTH_SECRET_CLIENT ?? "dev";

/** Signature for /setup/paid?order=…&k=… so an order summary is only shown with the link we gave out. */
export const orderSig = (orderNumber: string) => createHmac("sha256", secret()).update("paid:" + orderNumber.replace(/^#/, "")).digest("base64url").slice(0, 22);

export function checkOrderSig(orderNumber: string, sig: string | undefined | null) {
  if (!sig) return false;
  const a = Buffer.from(orderSig(orderNumber));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const paidUrl = (orderNumber: string) => {
  const n = orderNumber.replace(/^#/, "");
  return `/setup/paid?order=${encodeURIComponent(n)}&k=${orderSig(n)}`;
};
