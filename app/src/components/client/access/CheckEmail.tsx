"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ds";
import s from "./access.module.css";

const WAIT = 30;

/** 01 `check`: sent box, Open Gmail, resend with a 30 s wait. */
export function CheckEmail({ email, resend }: { email: string; resend: (email: string) => Promise<{ ok: boolean }> }) {
  const [left, setLeft] = useState(WAIT);
  const [pending, start] = useTransition();
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const gmail = `https://mail.google.com/mail/u/0/#search/${encodeURIComponent("from:aditus.in in:anywhere newer_than:1d")}`;
  return (
    <>
      <div className={s.sentBox}>
        <span className={s.sumKey}>Sent to</span>
        <span className={s.sentTo}>{email || "your email"}</span>
        <span className={s.small} style={{ lineHeight: 1.45 }}>The link works once and lasts 15 minutes. Open it on this device.</span>
      </div>
      <div className={s.grid2}>
        <Button href={gmail} variant="ink" size="md" full>OPEN GMAIL →</Button>
        <Button
          variant="outline"
          size="md"
          full
          disabled={left > 0 || pending || !email}
          onClick={() =>
            start(async () => {
              await resend(email);
              setLeft(WAIT);
            })
          }
        >
          {left > 0 ? `RESEND IN ${left} S` : "RESEND LINK"}
        </Button>
      </div>
      <div className={s.links}>
        <a href="/signin" className={s.u}>Use a different email</a>
      </div>
    </>
  );
}
