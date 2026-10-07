"use client";

import { useRef } from "react";
import s from "./signin.module.css";

/** Six boxes; typing advances, paste fills all, backspace goes back. */
export function CodeInput() {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  return (
    <div className={s.code}>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          name={"d" + i}
          className={s.digit}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          autoFocus={i === 0}
          onChange={(e) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(-1);
            if (e.target.value && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !e.currentTarget.value && i > 0) refs.current[i - 1]?.focus();
          }}
          onPaste={(e) => {
            const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (t.length < 2) return;
            e.preventDefault();
            t.split("").forEach((c, j) => {
              const el = refs.current[j];
              if (el) el.value = c;
            });
            refs.current[Math.min(t.length, 5)]?.focus();
          }}
        />
      ))}
    </div>
  );
}
