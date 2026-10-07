"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { AditusMark } from "@/components/ds";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import s from "./staff.module.css";

type Nav = { key: string; label: string; href: string };
type Props = {
  nav: Nav[];
  me: { name: string; roleLabel: string };
  dense: boolean;
  devRoles?: { key: string; label: string; title: string; on: boolean }[];
  actions: { toggleDensity: () => Promise<void>; signOut: () => Promise<void>; devSwitch?: (key: string) => Promise<void> };
  children: ReactNode;
};

export function StaffChrome(props: Props) {
  return (
    <ToastProvider>
      <Chrome {...props} />
    </ToastProvider>
  );
}

function Chrome({ nav, me, dense, devRoles, actions, children }: Props) {
  const path = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [, start] = useTransition();
  const [q, setQ] = useState("");
  const active = (n: Nav) => (n.href === "/staff" ? path === "/staff" : path.startsWith(n.href));

  // Keys 1 to 9 switch sections, D switches density, / focuses search.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (/input|textarea|select/i.test(el.tagName) || el.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= nav.length) router.push(nav[n - 1].href);
      else if (e.key === "d" || e.key === "D") start(() => actions.toggleDensity());
      else if (e.key === "/") {
        e.preventDefault();
        document.getElementById("staff-search")?.focus();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [nav, router, actions]);

  return (
    <div className={s.root + (dense ? " " + s.dense : "")}>
      <header className={s.header}>
        <Link href="/staff" className={s.brand}>
          <AditusMark size={22} color="#FFFFFF" />
          <span className={s.wordmark}>ADITUS</span>
          <span className={s.badge}>Staff</span>
        </Link>
        <form
          className={s.search}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) router.push(`/staff/clients?q=${encodeURIComponent(q.trim())}`);
          }}
        >
          <input id="staff-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients, sessions, invoices" aria-label="Search clients, sessions, invoices" />
          <span aria-hidden>/</span>
        </form>
        <div className={s.roles}>
          {devRoles?.map((r) => (
            <button key={r.key} type="button" title={r.title + " · dev sign in"} className={s.roleBtn + (r.on ? " " + s.roleOn : "")} onClick={() => start(async () => { await actions.devSwitch?.(r.key); toast("Signed in as " + r.title); router.refresh(); })}>
              {r.label}
            </button>
          ))}
        </div>
        <button type="button" title="Density (D)" className={s.density} onClick={() => start(() => actions.toggleDensity())}>
          {dense ? "Compact" : "Comfortable"}
        </button>
      </header>
      <div className={s.body}>
        <aside className={s.rail}>
          {nav.map((n, i) => (
            <Link key={n.key} href={n.href} className={s.navItem + (active(n) ? " " + s.navOn : "")} aria-current={active(n) ? "page" : undefined}>
              <span>{n.label}</span>
              <span className={s.navKey}>{i + 1}</span>
            </Link>
          ))}
          <div className={s.me}>
            <b className={s.meName}>{me.name}</b>
            <span className={s.meMeta}>{me.roleLabel}</span>
            <span style={{ fontSize: 9, color: "var(--grey-600)", marginTop: 4 }}>Keys 1 to {nav.length} · D density</span>
            <button type="button" className={s.signOut} onClick={() => start(() => actions.signOut())}>
              Sign out
            </button>
          </div>
        </aside>
        <main className={s.main}>{children}</main>
      </div>
    </div>
  );
}
