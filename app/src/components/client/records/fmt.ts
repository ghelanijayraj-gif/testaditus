// Date labels for the Records area. Newer ICU renders September as "Sept" in en-GB; the designs use "Sep".
import { dateLong as dl, dateShort as ds, dayLabel as dy, timeLabel } from "@/lib/format";

const sep = (s: string) => s.replace(/\bSept\b/g, "Sep");
export const dateLong = (d: Date) => sep(dl(d));
export const dateShort = (d: Date) => sep(ds(d));
export const dayLabel = (d: Date) => sep(dy(d));
export { timeLabel };
