// Mumbai area rule (brief PART 3). Admin defines it in Settings → `mumbai_area`
// ({ cities: string[], pinPrefixes: string[] }). No "server-only" import so seeds can reuse it.
import type { PrismaClient, RecommendationState } from "@prisma/client";

export type MumbaiRule = { cities: string[]; pinPrefixes: string[] };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Pure check: the city mentions a listed city (e.g. "Andheri, Mumbai"), or the PIN starts with a listed prefix. */
export function matchMumbaiArea(rule: MumbaiRule, city?: string | null, pin?: string | null) {
  const c = city ? ` ${norm(city)} ` : "";
  if (c && rule.cities.some((x) => c.includes(` ${norm(x)} `))) return true;
  const p = (pin ?? "").replace(/\D/g, "");
  if (p.length >= 3 && rule.pinPrefixes.some((x) => p.startsWith(x))) return true;
  return false;
}

export async function mumbaiRule(db: Pick<PrismaClient, "setting">): Promise<MumbaiRule> {
  const row = await db.setting.findUnique({ where: { key: "mumbai_area" } });
  const v = (row?.value ?? {}) as Partial<MumbaiRule>;
  return { cities: Array.isArray(v.cities) ? v.cities : [], pinPrefixes: Array.isArray(v.pinPrefixes) ? v.pinPrefixes : [] };
}

/** Reads the Settings rule and answers for a city and PIN. */
export async function inMumbaiArea(db: Pick<PrismaClient, "setting">, city?: string | null, pin?: string | null) {
  return matchMumbaiArea(await mumbaiRule(db), city, pin);
}

/**
 * Recommendation state after a location change: outside → NOT_ELIGIBLE; inside and previously
 * not eligible → NOT_SHOWN. Later states (shown, dismissed, added, booked) are kept.
 */
export function nextRecommendation(current: RecommendationState, inside: boolean): RecommendationState {
  if (!inside) return current === "NOT_SHOWN" || current === "NOT_ELIGIBLE" ? "NOT_ELIGIBLE" : current;
  return current === "NOT_ELIGIBLE" ? "NOT_SHOWN" : current;
}
