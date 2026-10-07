import type { ReactNode } from "react";
import Link from "next/link";
import { Padlock } from "./ui";
import s from "./consoles.module.css";

/** Context kicker + display title, and the privacy line on the right. */
export function TitleRow({ ctx, title, privacy = true }: { ctx: ReactNode; title: ReactNode; privacy?: boolean }) {
  return (
    <div className={s.titleRow}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className={s.ctx}>{ctx}</span>
        <h1 className={s.h1}>{title}</h1>
      </div>
      {privacy && (
        <span className={s.privacy}>
          <Padlock />
          Client, practitioner and head coach only · safety flags staff only
        </span>
      )}
    </div>
  );
}

/** Ops admin, Finance, or out of scope: no access to health media and measures. */
export function NoAccess({ what = "this client’s photos, videos and measures" }: { what?: string }) {
  return (
    <main className={s.main}>
      <div className={s.flag} style={{ maxWidth: 640, padding: 20, gap: 10 }}>
        <span className={s.kBlue}>No access</span>
        <span>You cannot open {what}. Health data and media are visible only to the client, their practitioner and the head coach. This attempt is logged.</span>
        <Link href="/staff" style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700 }}>
          Back to Today →
        </Link>
      </div>
    </main>
  );
}

export function NotFound({ what }: { what: string }) {
  return (
    <main className={s.main}>
      <div className={s.box} style={{ padding: 20, gap: 8, maxWidth: 640 }}>
        <span className={s.kicker}>Not found</span>
        <span style={{ font: "600 15px/1.4 var(--font-sans)" }}>{what}</span>
        <Link href="/staff/assessments" style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700 }}>
          Back to Assessments →
        </Link>
      </div>
    </main>
  );
}
