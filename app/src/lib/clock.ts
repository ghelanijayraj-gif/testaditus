/**
 * App clock. The sample data and designs are set on Wed 7 Oct 2026, 7:52 PM IST,
 * so APP_NOW pins "now" in development. Unset it to use the real time.
 */
export function now(): Date {
  const pinned = process.env.APP_NOW;
  return pinned ? new Date(pinned) : new Date();
}

export const TZ = "Asia/Kolkata";
