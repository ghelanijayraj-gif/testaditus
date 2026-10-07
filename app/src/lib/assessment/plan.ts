import type { ModuleStatus } from "@prisma/client";
import type { CoverageRow } from "@/components/shared/CoverageGrid";

/** Plan logic (06.5), pure functions shared by the client portal, admin console and report. */
export const ACTIONABLE: ModuleStatus[] = ["NOT_STARTED", "IN_PROGRESS", "MORE_NEEDED", "WAITING_FOR_PAYMENT"];
export const DONEISH: ModuleStatus[] = ["DONE", "SUBMITTED"];

export const STATUS_LABEL: Record<ModuleStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  MORE_NEEDED: "More needed",
  WAITING_FOR_PAYMENT: "Waiting for payment",
  BOOKED: "Booked",
  DONE: "Done",
  SKIPPED_BY_PRACTITIONER: "Skipped by practitioner",
};

export const TYPE_LABEL = {
  FORM: "Form",
  CAPTURE: "Capture",
  SELF_TESTS: "Self tests",
  UPLOAD: "Upload",
  LIVE_VIDEO: "Live video session",
  IN_PERSON: "In person session",
  REVIEW_CALL: "Review call",
  CONNECT_HEALTH: "Connect health data",
  SYSTEM: "System",
} as const;

/** Chip colours: Done blue; Submitted/Booked/In progress ice; More needed/Waiting blue outline; else grey outline. */
export function statusChip(s: ModuleStatus): { bg: string; fg: string; ring: string } {
  if (s === "DONE") return { bg: "var(--blue)", fg: "#fff", ring: "none" };
  if (s === "SUBMITTED" || s === "BOOKED" || s === "IN_PROGRESS") return { bg: "var(--ice)", fg: "var(--ink)", ring: "none" };
  if (s === "MORE_NEEDED" || s === "WAITING_FOR_PAYMENT") return { bg: "#fff", fg: "var(--blue)", ring: "inset 0 0 0 1.5px var(--blue)" };
  return { bg: "#fff", fg: "var(--ink)", ring: "inset 0 0 0 1px var(--grey-400)" };
}

export type CoverageEntry = { system: "MOVEMENT" | "BREATH" | "RECOVERY" | "PERFORMANCE"; level: number; tag: string; why: string };
type ModLike = { status: ModuleStatus; coverage: unknown; removed?: boolean; draft?: boolean };

const SYS: [CoverageEntry["system"], string][] = [["MOVEMENT", "Movement"], ["BREATH", "Breath"], ["RECOVERY", "Recovery"], ["PERFORMANCE", "Performance"]];
const LV = ["Not covered", "Partial", "Full"];
const FILL = ["0%", "50%", "100%"];

/**
 * Coverage rows: "now" from done/submitted modules, "next" from every module in the plan
 * (including Booked and Waiting for payment). Skipped and unsent draft modules are excluded.
 */
export function coverageRows(mods: ModLike[]): CoverageRow[] {
  const live = mods.filter((m) => !m.removed && !m.draft && m.status !== "SKIPPED_BY_PRACTITIONER");
  return SYS.map(([key, sys]) => {
    let now = 0,
      next = 0,
      why = "Not covered yet",
      whyNext = "";
    const tags = new Set<string>();
    for (const m of live) {
      const c = ((m.coverage as CoverageEntry[]) ?? []).find((x) => x.system === key);
      if (!c) continue;
      if (DONEISH.includes(m.status)) {
        if (c.level >= now) {
          now = c.level;
          why = c.why;
        }
        tags.add(c.tag);
      }
      if (c.level > next) {
        next = c.level;
        whyNext = c.why;
      }
    }
    next = Math.max(next, now);
    return {
      sys,
      nowL: LV[now],
      nowFill: FILL[now],
      nextL: LV[next],
      nextFill: FILL[next],
      change: next > now,
      why: next > now && now === 0 ? "Planned: " + whyNext : why,
      tags: tags.size ? [...tags].join(" · ") : "Nothing captured yet",
    };
  });
}
