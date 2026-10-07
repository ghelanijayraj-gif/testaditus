import type { MouseEventHandler, ReactNode } from "react";
import s from "./ds.module.css";

/** Quiz style radio/checkbox row: ice ground + 4px blue inset bar when checked. */
export function OptionRow({ label, desc, checked, multi = false, onClick, name, value }: { label: ReactNode; desc?: ReactNode; checked?: boolean; multi?: boolean; onClick?: MouseEventHandler<HTMLButtonElement>; name?: string; value?: string }) {
  return (
    <button type="button" role={multi ? "checkbox" : "radio"} aria-checked={!!checked} onClick={onClick} name={name} value={value} className={s.option + (checked ? " " + s.optionOn : "")}>
      <span className={[s.optionMark, multi ? s.optionMarkMulti : "", checked ? s.optionMarkOn : ""].join(" ")}>{checked ? "✓" : ""}</span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span className={s.optionLabel}>{label}</span>
        {desc && <span className={s.optionDesc}>{desc}</span>}
      </span>
    </button>
  );
}
