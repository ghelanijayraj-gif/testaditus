"use client";

import { useRouter } from "next/navigation";
import s from "./records.module.css";

/** A select whose options are URLs (filters live in search params). */
export function LinkSelect({ value, options, label }: { value: string; options: { value: string; label: string; href: string }[]; label: string }) {
  const router = useRouter();
  return (
    <select aria-label={label} className={s.select} value={value} onChange={(e) => router.push(options.find((o) => o.value === e.target.value)!.href, { scroll: false })}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
