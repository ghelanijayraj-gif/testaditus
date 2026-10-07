import Link from "next/link";
import type { CSSProperties, ReactNode, MouseEventHandler } from "react";
import s from "./ds.module.css";

export type ButtonVariant = "ink" | "blue" | "outline" | "white" | "outline-light";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

type Props = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  disabled?: boolean;
  full?: boolean;
  type?: "button" | "submit" | "reset";
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  /** Extra attributes for forms, e.g. formAction or name/value. */
  name?: string;
  value?: string;
  formAction?: string | ((formData: FormData) => void | Promise<void>);
  "aria-label"?: string;
};

const variantClass: Record<ButtonVariant, string> = {
  ink: s.ink,
  blue: s.blue,
  outline: s.outline,
  white: s.white,
  "outline-light": s.outlineLight,
};

/** ADITUS Button — square, Bowlby One, five variants, four sizes. */
export function Button({ variant = "ink", size = "lg", href, onClick, disabled, full, type = "button", children, style, className, ...rest }: Props) {
  const cls = [s.btn, variantClass[variant] ?? s.ink, s[size] ?? s.lg, full ? s.full : "", className ?? ""].join(" ");
  if (href && !disabled) {
    return (
      <Link href={href} className={cls} style={style} onClick={onClick} aria-label={rest["aria-label"]}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} style={style} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
