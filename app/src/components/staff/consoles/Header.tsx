"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AditusMark } from "@/components/ds";
import { NET_EVENT, type NetState } from "./outbox";
import s from "./consoles.module.css";

/**
 * Consoles header: dark staff bar with the mark, role switch (only for staff who can
 * approve, i.e. founder and head of department), the screen's tabs, network state on the
 * practitioner console and the back link to the admin console's Assessments queue.
 */
export function ConsoleHeader({ canApprove, allowed }: { canApprove: boolean; allowed: boolean }) {
  const path = usePathname();
  const sp = useSearchParams();
  const head = path.startsWith("/staff/review");
  const prac = path.match(/^\/staff\/practitioner\/([^/]+)/);
  const photo = path.match(/^\/staff\/photo-review\/([^/]+)/);
  const review = path.match(/^\/staff\/review\/([^/]+)/);
  let tabs: { label: string; href: string; on: boolean }[] = [];
  if (prac) {
    const tab = sp.get("tab") ?? "brief";
    tabs = [["brief", "Brief"], ["console", "Console"], ["photos", "Photos"], ["wrap", "Wrap up"]].map(([k, l]) => ({ label: l, href: `/staff/practitioner/${prac[1]}?tab=${k}`, on: tab === k }));
  } else if (head) {
    tabs = [{ label: canApprove ? "Queue" : "Review queue", href: "/staff/review", on: !review }];
    if (review) tabs.push({ label: "Review", href: path, on: true });
  } else if (path.startsWith("/staff/photo-review")) {
    tabs = [{ label: "My queue", href: "/staff/photo-review", on: !photo }];
    if (photo) tabs.push({ label: "Photo review", href: path + (sp.toString() ? "?" + sp.toString() : ""), on: true });
  }
  return (
    <header className={s.header}>
      <Link href="/staff" className={s.brand} aria-label="ADITUS Staff">
        <AditusMark size={26} color="#FFFFFF" />
        <span className={s.word}>ADITUS</span>
        <span className={s.badge}>Staff</span>
      </Link>
      {allowed && canApprove && (
        <nav className={s.roles} aria-label="Role">
          <Link href="/staff/photo-review" className={s.role + (!head ? " " + s.roleOn : "")} aria-current={!head ? "page" : undefined}>
            Practitioner
          </Link>
          <Link href="/staff/review" className={s.role + (head ? " " + s.roleOn : "")} aria-current={head ? "page" : undefined}>
            Head coach
          </Link>
        </nav>
      )}
      {allowed && tabs.length > 0 && (
        <nav className={s.tabs} aria-label="Sections">
          {tabs.map((t) => (
            <Link key={t.label} href={t.href} scroll={false} className={s.tab + (t.on ? " " + s.tabOn : "")} aria-current={t.on ? "page" : undefined}>
              {t.label}
            </Link>
          ))}
        </nav>
      )}
      <div className={s.right}>
        {prac && allowed && <Net />}
        <Link href="/staff/assessments" className={s.back}>
          ← Console
        </Link>
      </div>
    </header>
  );
}

/** Network state: "Online" or "Offline · saved on tablet, syncing" (driven by the console's outbox). */
function Net() {
  const [st, setSt] = useState<NetState>({ online: true, pending: 0 });
  useEffect(() => {
    const upd = () => setSt((x) => ({ ...x, online: navigator.onLine }));
    const on = (e: Event) => setSt((e as CustomEvent<NetState>).detail);
    upd();
    window.addEventListener("online", upd);
    window.addEventListener("offline", upd);
    window.addEventListener(NET_EVENT, on);
    return () => {
      window.removeEventListener("online", upd);
      window.removeEventListener("offline", upd);
      window.removeEventListener(NET_EVENT, on);
    };
  }, []);
  const off = !st.online || st.pending > 0;
  return (
    <span className={s.net} role="status">
      <i className={s.dot} style={{ background: off ? "var(--grey-400)" : "var(--blue)" }} />
      {off ? "Offline · saved on tablet, syncing" : "Online"}
    </span>
  );
}
