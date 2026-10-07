import "server-only";
import { generateSync, verifySync } from "otplib";

/** TOTP (Google Authenticator compatible) for the staff second step. */
export const totpNow = (secret: string) => generateSync({ secret });
export const totpCheck = (code: string, secret: string) => {
  try {
    return verifySync({ token: code, secret }).valid;
  } catch {
    return false;
  }
};
