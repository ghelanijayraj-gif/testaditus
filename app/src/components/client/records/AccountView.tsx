import Link from "next/link";
import { getAccountView } from "@/server/client/records/account";
import { requestDeletion, requestExport, setConsent, signOutAll, toggleNotify } from "@/server/client/records/actions";
import { PageHead } from "./parts";
import { ActBtn, ActRaw, Toggle } from "./ui";
import { CentreCard, DetailsCard, SignInCard } from "./AccountCards";
import s from "./records.module.css";

export async function AccountView({ clientId }: { clientId: string }) {
  const v = await getAccountView(clientId);
  const head = (title: string, right?: React.ReactNode) => (
    <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }} className={s.rowLine}>
      <b className={s.label}>{title}</b>
      {right}
    </div>
  );
  return (
    <div className={s.page} style={{ maxWidth: 1120 }}>
      <PageHead kicker={v.kicker} title="Account." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <DetailsCard rows={v.rows} details={v.details} email={v.email} />
          <SignInCard method={v.method} hasPassword={v.hasPassword} />
          <CentreCard centres={v.centres} centreId={v.centreId} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div className={s.card}>
            {head("Notifications")}
            {v.notify.map(([key, t, d, on]) => (
              <ActRaw key={key} action={toggleNotify.bind(null, key)} className={s.toggleRow} label={`${t}: ${on ? "on" : "off"}`}>
                <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span className={s.toggleTitle}>{t}</span>
                  <span style={{ fontSize: 11, color: "var(--grey-700)" }}>{d}</span>
                </span>
                <Toggle on={on} />
              </ActRaw>
            ))}
          </div>
          <div className={s.card}>
            {head("Consents", <span style={{ fontSize: 11, color: "var(--grey-600)" }}>Change any time</span>)}
            {v.consents.map((c) => (
              <ActRaw key={c.kind} action={setConsent.bind(null, c.kind, !c.on)} confirm={c.on ? c.confirm : null} className={s.toggleRow} label={`${c.t}: ${c.on ? "given" : "not given"}`}>
                <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span className={s.toggleTitle}>{c.t}</span>
                  <span style={{ fontSize: 11, color: "var(--grey-700)" }}>{c.d}</span>
                  <span style={{ fontSize: 10, textTransform: "uppercase", color: c.on ? "var(--ink)" : "var(--grey-600)" }}>{c.date}</span>
                </span>
                <Toggle on={c.on} />
              </ActRaw>
            ))}
          </div>
          <div className={s.card}>
            {head(
              "Connected apps",
              <Link href="/health" className={s.blueLink}>
                Manage
              </Link>,
            )}
            {v.sources.map((sr) => (
              <div key={sr.name} style={{ padding: "11px 18px", display: "flex", justifyContent: "space-between", gap: 12 }} className={s.rowLine}>
                <span style={{ font: "600 14px var(--font-sans)" }}>{sr.name}</span>
                <span style={{ fontSize: 10, textTransform: "uppercase", textAlign: "right", color: sr.tone === "on" ? "var(--ink)" : sr.tone === "error" ? "var(--blue)" : "var(--grey-600)" }}>{sr.status}</span>
              </div>
            ))}
          </div>
          <div className={s.card} style={{ padding: 18, gap: 12 }}>
            <b className={s.label}>Your data</b>
            <span style={{ font: "400 14px/1.45 var(--font-sans)", color: "var(--grey-700)" }}>Download everything we hold, or ask us to delete it. Deletion requests are confirmed by email within 7 days.</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <ActBtn action={requestExport} variant="outline" size="sm">
                EXPORT MY DATA
              </ActBtn>
              <ActBtn action={requestDeletion} variant="outline" size="sm" confirm="Ask us to delete your ADITUS data? We confirm by email within 7 days. Records the law requires us to keep are deleted when that period ends.">
                REQUEST DELETION
              </ActBtn>
              <ActBtn action={signOutAll} variant="ink" size="sm" confirm="Sign out on every phone and computer, including this one?">
                SIGN OUT OF ALL DEVICES
              </ActBtn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
