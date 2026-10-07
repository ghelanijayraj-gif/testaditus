"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { staffSignIn, staffSignOut } from "@/server/auth/staff";
import { devAuthEnabled } from "@/server/auth/factory";
import { DEV_VIEW_AS } from "@/server/auth/guards";

const DENSITY_COOKIE = "aditus.staff.density";

export async function toggleDensity() {
  const jar = await cookies();
  jar.set(DENSITY_COOKIE, jar.get(DENSITY_COOKIE)?.value === "compact" ? "comfortable" : "compact", { path: "/staff", sameSite: "lax", maxAge: 31536000 });
}

export async function signOutStaff() {
  (await cookies()).delete(DEV_VIEW_AS);
  await staffSignOut({ redirectTo: "/staff/signin" });
}

/** Dev only: the prototype's role switch. Signs in as the seeded person for that role. */
export async function devSwitchRole(key: string) {
  if (!devAuthEnabled()) return;
  const email = { FOUNDER: "jayraj@aditus.in", PRACTITIONER: "rohit@aditus.in", HOD: "shimyu@aditus.in", OPS: "sahil@aditus.in", FINANCE: "arjun@aditus.in" }[key];
  if (!email) return;
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u) return;
  const jar = await cookies();
  jar.delete(DEV_VIEW_AS);
  await staffSignIn("dev", { userId: u.id, redirect: false });
  redirect("/staff");
}
