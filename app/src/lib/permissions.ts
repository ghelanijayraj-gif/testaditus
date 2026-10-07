import type { StaffRole } from "@prisma/client";

/**
 * Roles and permissions (Settings → Roles and permissions, "defaults to confirm").
 * "segment" = Head of department's segment; "own" = practitioner's own clients.
 */
export type Permission =
  | "media.view" // view client documents and media
  | "measures.edit"
  | "reports.approve"
  | "templates.edit"
  | "modules.add"
  | "sessions.schedule"
  | "billing.view"
  | "program.view"
  | "staff.manage";

export type Scope = "all" | "segment" | "own" | "limited" | false;

export const PERMISSIONS: { key: Permission; label: string; grid: Record<StaffRole, string> }[] = [
  { key: "media.view", label: "View client documents and media", grid: { FOUNDER: "✓", HOD: "Segment", PRACTITIONER: "Own", OPS: "·", FINANCE: "·" } },
  { key: "measures.edit", label: "Edit assessment measures", grid: { FOUNDER: "✓", HOD: "Segment", PRACTITIONER: "Own", OPS: "·", FINANCE: "·" } },
  { key: "reports.approve", label: "Approve and release reports", grid: { FOUNDER: "✓", HOD: "Segment", PRACTITIONER: "·", OPS: "·", FINANCE: "·" } },
  { key: "templates.edit", label: "Edit module templates", grid: { FOUNDER: "✓", HOD: "Segment", PRACTITIONER: "·", OPS: "·", FINANCE: "·" } },
  { key: "modules.add", label: "Add modules to a client", grid: { FOUNDER: "✓", HOD: "Segment", PRACTITIONER: "Own · published", OPS: "Payment and booking", FINANCE: "·" } },
  { key: "sessions.schedule", label: "Schedule sessions", grid: { FOUNDER: "✓", HOD: "Segment", PRACTITIONER: "Own", OPS: "✓", FINANCE: "·" } },
  { key: "billing.view", label: "View billing and invoices", grid: { FOUNDER: "✓", HOD: "Segment", PRACTITIONER: "·", OPS: "✓", FINANCE: "✓" } },
  { key: "program.view", label: "View program details", grid: { FOUNDER: "✓", HOD: "Segment", PRACTITIONER: "Own", OPS: "·", FINANCE: "·" } },
  { key: "staff.manage", label: "Manage staff and roles", grid: { FOUNDER: "✓", HOD: "·", PRACTITIONER: "·", OPS: "·", FINANCE: "·" } },
];

export function scopeOf(role: StaffRole, p: Permission): Scope {
  const v = PERMISSIONS.find((x) => x.key === p)!.grid[role];
  if (v === "✓") return "all";
  if (v === "Segment") return "segment";
  if (v.startsWith("Own")) return "own";
  if (v === "·") return false;
  return "limited";
}

export const can = (role: StaffRole, p: Permission) => scopeOf(role, p) !== false;

/** Console sections and the roles that see them (left rail order = keys 1 to 9). */
export const STAFF_NAV: { key: string; label: string; href: string; roles: StaffRole[] }[] = [
  { key: "today", label: "Today", href: "/staff", roles: ["FOUNDER", "HOD", "PRACTITIONER", "OPS", "FINANCE"] },
  { key: "clients", label: "Clients", href: "/staff/clients", roles: ["FOUNDER", "HOD", "PRACTITIONER", "OPS"] },
  { key: "assessments", label: "Assessments", href: "/staff/assessments", roles: ["FOUNDER", "HOD", "PRACTITIONER"] },
  { key: "schedule", label: "Schedule", href: "/staff/schedule", roles: ["FOUNDER", "HOD", "PRACTITIONER", "OPS"] },
  { key: "modules", label: "Modules", href: "/staff/modules", roles: ["FOUNDER", "HOD", "PRACTITIONER"] },
  { key: "reports", label: "Reports", href: "/staff/reports", roles: ["FOUNDER", "HOD", "PRACTITIONER"] },
  { key: "billing", label: "Plans and billing", href: "/staff/billing", roles: ["FOUNDER", "HOD", "OPS", "FINANCE"] },
  { key: "team", label: "Team", href: "/staff/team", roles: ["FOUNDER", "HOD", "OPS"] },
  { key: "settings", label: "Settings", href: "/staff/settings", roles: ["FOUNDER"] },
];

/**
 * Phase one: the console covers assessments, documents and booking only. These sections stay built but hidden
 * until the operations OS connects. Set FULL_CONSOLE=1 to bring them back.
 */
export const PARKED_SECTIONS = ["modules", "billing", "team", "settings"];
export const isParked = (key: string) => process.env.FULL_CONSOLE !== "1" && PARKED_SECTIONS.includes(key);
export const ACTIVE_NAV = () => STAFF_NAV.filter((n) => !isParked(n.key));

export const ROLE_LABEL: Record<StaffRole, string> = {
  FOUNDER: "Founder",
  HOD: "Head of department",
  PRACTITIONER: "Practitioner",
  OPS: "Ops admin",
  FINANCE: "Finance",
};

/** Client file tabs that hold health data or media (practitioner, head coach, founder only). */
export const HEALTH_TABS = ["intake", "media", "measures", "program", "documents", "health"] as const;
