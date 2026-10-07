import type { ReactNode } from "react";
import { AditusMark } from "@/components/ds";
import s from "./signin.module.css";

export function SignInShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={s.wrap}>
      <div className={s.col}>
        <span className={s.brand}>
          <AditusMark size={28} color="#FFFFFF" />
          <span className={s.word}>ADITUS</span>
          <span className={s.badge}>Staff</span>
        </span>
        <span className={s.addr}>staff.aditus.in · invite only</span>
        <h1 className={s.title}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

export { s as signinStyles };
