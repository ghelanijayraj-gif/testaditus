// IST calendar helpers shared by server and client code (no server-only imports).
// Days are handled as "YYYY-MM-DD" keys in Asia/Kolkata so month grids never drift.

const TZ = "Asia/Kolkata";
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", hourCycle: "h23" });

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** IST day key for an instant: "2026-10-07". */
export const dayKey = (d: Date) => keyFmt.format(d);

/** Midnight IST of a day key as an instant. */
export const keyStart = (k: string) => new Date(`${k}T00:00:00+05:30`);

/** Noon IST of a day key (safe for weekday/label maths). */
export const keyNoon = (k: string) => new Date(`${k}T12:00:00+05:30`);

/** Add n days to a key. */
export function addDays(k: string, n: number) {
  const [y, m, d] = k.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday. */
export function weekday(k: string) {
  const [y, m, d] = k.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export const mondayOf = (k: string) => addDays(k, -weekday(k));

/** Whole days from key a to key b. */
export function keyDiff(a: string, b: string) {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

export const hourIST = (d: Date) => Number(hourFmt.format(d));

/** "7:30a" style short time for month chips: drops ":00", AM → a, PM → p. */
export function shortTime(label: string) {
  return label.replace(":00", "").replace(" AM", "a").replace(" PM", "p");
}

/** "Mon 5 Oct 2026" for the top bar. */
export function topDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(d).replace(",", "");
}
