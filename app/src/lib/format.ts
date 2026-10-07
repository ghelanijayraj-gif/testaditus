import { TZ } from "./clock";

// Copy rules: dates read "Thu 8 Oct", times "7:30 AM", middot separators, no dashes.
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...o }).format(d);

/** "Thu 8 Oct" */
export const dayLabel = (d: Date) => fmt(d, { weekday: "short", day: "numeric", month: "short" }).replace(",", "");
/** "8 Oct" */
export const dateShort = (d: Date) => fmt(d, { day: "numeric", month: "short" });
/** "8 Oct 2026" */
export const dateLong = (d: Date) => fmt(d, { day: "numeric", month: "short", year: "numeric" });
/** "7:30 AM" */
export const timeLabel = (d: Date) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(d);
/** "Thu 8 Oct · 7:30 AM" */
export const dayTime = (d: Date) => `${dayLabel(d)} · ${timeLabel(d)}`;

/** Indian grouping: ₹64,000. Placeholders (₹XX,XXX) are stored as labels and passed through. */
export const rupees = (paise: number) => "₹" + new Intl.NumberFormat("en-IN").format(Math.round(paise / 100));

export const daysBetween = (a: Date, b: Date) => Math.ceil((b.getTime() - a.getTime()) / 86_400_000);
