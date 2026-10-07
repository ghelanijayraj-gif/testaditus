"use client";

import { useState } from "react";
import { Button } from "@/components/ds";
import s from "./access.module.css";

type Props = {
  email: string;
  pw: boolean;
  error?: string;
  requestLink: (fd: FormData) => Promise<void>;
  passwordSignIn: (fd: FormData) => Promise<void>;
};

/** 01 `signin`: email link mode (default) or password mode. */
export function SignInForm({ email: initialEmail, pw: initialPw, error, requestLink, passwordSignIn }: Props) {
  const [pw, setPw] = useState(initialPw);
  const [email, setEmail] = useState(initialEmail);
  return (
    <form action={pw ? passwordSignIn : requestLink} className={s.fields} style={{ gap: 28 }}>
      <div className={s.fields}>
        {error === "email" && <span className={s.error} role="alert">Enter the email you used for your order.</span>}
        {error === "password" && pw && <span className={s.error} role="alert">That email and password do not match. Try again, or email yourself a sign in link.</span>}
        <label className={s.field}>
          <span className={s.fieldLabel}>Email</span>
          <input className={s.input} type="email" name="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {pw && (
          <div className={s.field}>
            <div className={s.labelRow}>
              <label htmlFor="pw" className={s.fieldLabel}>Password</label>
              <button type="submit" formAction={requestLink} formNoValidate className={s.linkBtn}>
                Forgot password
              </button>
            </div>
            <input id="pw" className={s.input} type="password" name="password" autoComplete="current-password" required />
          </div>
        )}
      </div>
      <div className={s.stack}>
        {pw ? (
          <>
            <Button type="submit" variant="ink" size="lg" full>SIGN IN →</Button>
            <Button variant="outline" size="lg" full onClick={() => setPw(false)}>EMAIL ME A LINK INSTEAD</Button>
          </>
        ) : (
          <>
            <Button type="submit" variant="blue" size="lg" full>EMAIL ME A SIGN IN LINK →</Button>
            <Button variant="outline" size="lg" full onClick={() => setPw(true)}>USE PASSWORD</Button>
          </>
        )}
      </div>
    </form>
  );
}
