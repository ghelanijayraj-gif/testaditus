"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { AditusMark, Button, ImageSlot } from "@/components/ds";
import { ToastProvider } from "@/components/ui/Toast";
import { ReadOnlyProvider } from "@/components/client/readonly";
import { signOutClient } from "@/server/client/shell/actions";
import type { ShellModel } from "@/server/client/shell/model";
import { ActButton } from "./ActButton";
import { ReachUs } from "./ReachUs";
import { SessionLayer } from "./SessionLayer";
import s from "./shell.module.css";

const NAV = [
  { key: "home", label: "Home", abbr: "Ho", href: "/" },
  { key: "assessment", label: "Assessment", abbr: "As", href: "/assessment" },
  { key: "calendar", label: "Calendar", abbr: "Ca", href: "/calendar" },
  { key: "myplan", label: "My plan", abbr: "Mp", href: "/plan" },
  { key: "health", label: "Health data", abbr: "Hd", href: "/health" },
  { key: "documents", label: "Documents", abbr: "Do", href: "/documents" },
  { key: "orders", label: "Orders and invoices", abbr: "Or", href: "/orders" },
  { key: "account", label: "Account", abbr: "Ac", href: "/account" },
] as const;

const MORE = [
  { label: "Health data", href: "/health" },
  { label: "Documents", href: "/documents" },
  { label: "Orders and invoices", href: "/orders" },
  { label: "Reports", href: "/reports" },
  { label: "Account", href: "/account" },
];

const MORE_PATHS = ["/health", "/documents", "/orders", "/account", "/reports", "/search", "/export"];

function activeKey(path: string) {
  if (path === "/" || path === "") return "home";
  const hit = NAV.find((n) => n.href !== "/" && (path === n.href || path.startsWith(n.href + "/")));
  return hit?.key ?? null;
}

const RAIL_KEY = "aditus_rail_collapsed";

export function ShellFrame({ m, preview = false, demoSwitch = false, children }: { m: ShellModel; preview?: boolean; demoSwitch?: boolean; children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [collapsed, setCollapsed] = useState(false);
  const [reach, setReach] = useState(false);
  const [more, setMore] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(RAIL_KEY) === "1");
    } catch {
      /* private mode */
    }
  }, []);
  // Navigation closes the More sheet and the Reach us panel.
  useEffect(() => {
    setMore(false);
  }, [pathname]);
  useEffect(() => {
    if (!reach && !more) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setReach(false);
        setMore(false);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [reach, more]);

  const toggleRail = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(RAIL_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const act = activeKey(pathname);
  const moreActive = more || MORE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  // Module and booking screens carry their own sticky Submit/Book bar; hide the shell's mobile bar there.
  const ownBar = pathname.startsWith("/assessment/steps") || pathname.startsWith("/assessment/in-person");
  const showAction = m.action.kind !== "hidden";

  const navLink = (n: (typeof NAV)[number]) => {
    const on = act === n.key;
    const locked = n.key === "myplan" && m.navSub === "Locked";
    const cls = [s.navItem, on ? s.active : "", locked && !on ? s.locked : ""].join(" ");
    const inner = (
      <>
        <span className={s.abbr}>{n.abbr}</span>
        <span className={`${s.navLabel} ${s.openOnly}`}>{n.label}</span>
        {n.key === "myplan" && m.navSub && <span className={`${s.navSub} ${s.openOnly}`}>{m.navSub}</span>}
      </>
    );
    return preview ? (
      <span key={n.key} title={n.label} className={cls} aria-current={on ? "page" : undefined}>
        {inner}
      </span>
    ) : (
      <Link key={n.key} href={n.href} title={n.label} className={cls} aria-current={on ? "page" : undefined}>
        {inner}
      </Link>
    );
  };

  const body = (
    <div className={s.root} data-collapsed={collapsed ? "1" : "0"}>
      <ToastProvider variant="portal">
        <aside className={s.rail} aria-label="Portal">
          <Link href={preview ? "#" : "/"} className={s.brand} aria-label="ADITUS home">
            <AditusMark size={30} />
            <span className={`${s.brandWord} ${s.openOnly}`}>ADITUS</span>
          </Link>
          <nav className={s.nav}>{NAV.map(navLink)}</nav>
          <div className={s.foot}>
            <div className={s.ident}>
              <div style={{ width: 40, height: 40, flex: "none" }}>
                <ImageSlot caption={m.initials} src={m.photoUrl ?? undefined} />
              </div>
              <div className={s.openOnly} style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span className={s.identName}>{m.fullName}</span>
                <span className={s.identCode}>ID {m.code}</span>
              </div>
            </div>
            <div className={`${s.facts} ${s.openOnly}`}>
              <span className={s.fact}>
                <span>Coach</span>
                <span>{m.coach}</span>
              </span>
              <span className={s.fact}>
                <span>Centre</span>
                <span>{m.centre}</span>
              </span>
              <span className={s.fact}>
                <span>Plan</span>
                <span>{m.planLabel}</span>
              </span>
            </div>
            <div className={s.openOnly} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Button variant="ink" size="sm" full onClick={() => setReach((r) => !r)} disabled={preview}>
                {reach ? "CLOSE ×" : "REACH US"}
              </Button>
              {!preview && (
                <form action={signOutClient}>
                  <button type="submit" className={s.signOut}>
                    Sign out
                  </button>
                </form>
              )}
              {demoSwitch && (
                <a href="/signin#dev-0" className={s.signOut} style={{ textDecoration: "none" }}>
                  Switch demo client →
                </a>
              )}
            </div>
            <button type="button" className={`${s.reBtn} ${s.closedOnly}`} title="Reach us" onClick={() => setReach((r) => !r)} disabled={preview}>
              RE
            </button>
            {!preview && (
              <form action={signOutClient} className={s.closedOnly} style={{ flexDirection: "column" }}>
                <button type="submit" className={s.soBtn} title="Sign out" style={{ display: "flex", width: "100%" }}>
                  OUT
                </button>
              </form>
            )}
            <button type="button" className={`${s.collapse} ${s.desktopOnly}`} onClick={toggleRail} title={collapsed ? "Expand menu" : "Collapse menu"} aria-expanded={!collapsed}>
              {collapsed ? "→" : "← Collapse"}
            </button>
          </div>
        </aside>

        <div className={s.col}>
          <header className={s.mHeader}>
            <Link href={preview ? "#" : "/"} className={s.mBrand}>
              <AditusMark size={26} />
              <span>ADITUS</span>
            </Link>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {m.todo > 0 && m.action.kind === "confirm" && <ActButton a={m.action} plain className={s.todo} label={`${m.todo} to do`} disabled={preview} />}
              <div style={{ width: 34, height: 34 }}>
                <ImageSlot caption={m.initials} src={m.photoUrl ?? undefined} />
              </div>
            </div>
          </header>
          <div className={s.topbar}>
            <form action="/search" className={s.search} role="search">
              <input name="q" type="search" placeholder="Search documents, reports, sessions" aria-label="Search documents, reports, sessions" disabled={preview} />
            </form>
            <span className={s.date}>{m.today}</span>
            {showAction && <ActButton a={m.action} disabled={preview} />}
          </div>
          <main id="main" className={s.main}>
            {children}
          </main>
        </div>

        {more && (
          <div className={s.scrim} onClick={() => setMore(false)}>
            <div className={s.sheet} onClick={(e) => e.stopPropagation()} role="menu">
              {MORE.map((i) => (
                <Link key={i.href} href={i.href} className={s.sheetRow} role="menuitem" onClick={() => setMore(false)}>
                  {i.label}
                  <span>→</span>
                </Link>
              ))}
              <button
                type="button"
                className={s.sheetRow}
                role="menuitem"
                onClick={() => {
                  setMore(false);
                  setReach(true);
                }}
              >
                Reach us<span>→</span>
              </button>
              <form action={signOutClient}>
                <button type="submit" className={s.sheetRow} role="menuitem">
                  Sign out<span>→</span>
                </button>
              </form>
              {demoSwitch && (
                <a href="/signin#dev-0" className={s.sheetRow} role="menuitem" style={{ textDecoration: "none" }}>
                  Switch demo client<span>→</span>
                </a>
              )}
            </div>
          </div>
        )}

        <div className={s.reachWrap}>{reach && !preview && <ReachUs m={m} onClose={() => setReach(false)} />}</div>

        {showAction && !ownBar && (
          <div className={s.mAct}>
            <ActButton a={m.action} disabled={preview} />
          </div>
        )}

        <nav className={s.tabs} aria-label="Portal tabs">
          {[
            { key: "home", label: "Home", href: "/" },
            { key: "assessment", label: "Assessment", href: "/assessment" },
            { key: "calendar", label: "Calendar", href: "/calendar" },
            { key: "myplan", label: "My plan", href: "/plan" },
          ].map((t) => {
            const on = !more && act === t.key;
            return preview ? (
              <span key={t.key} className={`${s.tab} ${on ? s.tabOn : ""}`}>
                {t.label}
              </span>
            ) : (
              <Link key={t.key} href={t.href} className={`${s.tab} ${on ? s.tabOn : ""}`} aria-current={on ? "page" : undefined}>
                {t.label}
              </Link>
            );
          })}
          <button type="button" className={`${s.tab} ${moreActive ? s.tabOn : ""}`} onClick={() => !preview && setMore((v) => !v)} aria-expanded={more}>
            More
          </button>
        </nav>

        {!preview && (
          <Suspense fallback={null}>
            <SessionLayer bookingClosed={m.bookingClosed} />
          </Suspense>
        )}
      </ToastProvider>
    </div>
  );
  return preview ? <ReadOnlyProvider>{body}</ReadOnlyProvider> : body;
}
