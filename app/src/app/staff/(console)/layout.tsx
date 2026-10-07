import type { Metadata } from "next";
import { cookies } from "next/headers";
import { StaffChrome } from "@/components/staff/StaffChrome";
import { requireStaff } from "@/server/auth/guards";
import { devAuthEnabled } from "@/server/auth/factory";
import { ACTIVE_NAV, ROLE_LABEL } from "@/lib/permissions";
import { devSwitchRole, signOutStaff, toggleDensity } from "./actions";

const DENSITY_COOKIE = "aditus.staff.density";

export const metadata: Metadata = { title: { default: "ADITUS Staff", template: "%s · ADITUS Staff" }, robots: { index: false } };

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireStaff();
  const dense = (await cookies()).get(DENSITY_COOKIE)?.value === "compact";
  const nav = ACTIVE_NAV().filter((n) => n.roles.includes(ctx.role)).map(({ key, label, href }) => ({ key, label, href }));
  const devRoles = devAuthEnabled()
    ? (["FOUNDER", "HOD", "PRACTITIONER", "OPS", "FINANCE"] as const).map((k) => ({
        key: k,
        label: ROLE_LABEL[k],
        title: { FOUNDER: "Jayraj", HOD: "Shimyu", PRACTITIONER: "Jayraj", OPS: "Sahil", FINANCE: "Arjun" }[k],
        on: ctx.role === k,
      }))
    : undefined;
  return (
    <StaffChrome nav={nav} me={{ name: ctx.name, roleLabel: ROLE_LABEL[ctx.role] }} dense={dense} devRoles={devRoles} actions={{ toggleDensity, signOut: signOutStaff, devSwitch: devAuthEnabled() ? devSwitchRole : undefined }}>
      {children}
    </StaffChrome>
  );
}
