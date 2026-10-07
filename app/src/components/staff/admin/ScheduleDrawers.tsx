"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ds";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/Toast";
import { chipBtn, fieldLabel, input, squareBtn, textarea } from "./styles";
import a from "./admin.module.css";

type Act = { toast?: string; error?: string; redirect?: string } | void;
type Slot = { id: string; label: string; staffId: string };

function useRun() {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (fn: () => Promise<Act>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r?.error) return void toast(r.error);
      if (r?.toast) toast(r.toast);
      after?.();
      if (r?.redirect) router.push(r.redirect);
      else router.refresh();
    });
  return { pending, run, toast, router };
}

const KVRow = ({ k, v }: { k: string; v: string }) => (
  <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--grey-200)", display: "grid", gridTemplateColumns: "100px minmax(0,1fr)", gap: 10 }}>
    <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--grey-600)" }}>{k}</span>
    <span style={{ font: "500 13px/1.4 var(--font-sans)" }}>{v}</span>
  </div>
);

/** Session drawer: confirm or reschedule on the client's behalf, edit extra info. */
export function SessionDrawer({ title, rows, extraInfo, late, slots, closeHref, canChange, actions }: {
  title: string;
  rows: [string, string][];
  extraInfo: string;
  late: boolean;
  slots: Slot[];
  closeHref: string;
  canChange: boolean;
  actions: { confirm: () => Promise<Act>; resched: (slotId: string) => Promise<Act>; info: (text: string) => Promise<Act> };
}) {
  const { pending, run, toast, router } = useRun();
  const [mode, setMode] = useState<null | "resched" | "info">(null);
  const [text, setText] = useState(extraInfo);
  const close = () => router.push(closeHref, { scroll: false });
  return (
    <Drawer
      open
      title={title}
      onClose={close}
      footer={
        canChange ? (
          <>
            <Button variant="blue" size="sm" full disabled={pending} onClick={() => run(actions.confirm, close)}>
              CONFIRM ON CLIENT’S BEHALF
            </Button>
            <Button
              variant="outline"
              size="sm"
              full
              onClick={() => {
                setMode(mode === "resched" ? null : "resched");
                if (mode !== "resched") toast("24 hour rule applies. Pick a new slot.");
              }}
            >
              RESCHEDULE
            </Button>
            {mode === "resched" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 0" }}>
                <span style={{ fontSize: 10, color: late ? "var(--blue)" : "var(--grey-600)" }}>{late ? "Inside 24 hours: this change counts against the plan." : "More than 24 hours away: free to move."}</span>
                {slots.length === 0 && <span style={{ fontSize: 11, color: "var(--grey-600)" }}>No free slots for this coach in the next 3 weeks. Add availability first.</span>}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {slots.map((s) => (
                    <button key={s.id} type="button" style={chipBtn(false, 30)} disabled={pending} onClick={() => run(() => actions.resched(s.id), close)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button variant="outline" size="sm" full onClick={() => setMode(mode === "info" ? null : "info")}>
              EDIT EXTRA INFO
            </Button>
            {mode === "info" && (
              <form
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => actions.info(text), () => setMode(null));
                }}
              >
                <label style={fieldLabel}>
                  Extra info · client sees it in Before you come
                  <textarea value={text} onChange={(e) => setText(e.target.value)} style={textarea} />
                </label>
                <Button variant="ink" size="sm" type="submit" disabled={pending}>
                  SAVE
                </Button>
              </form>
            )}
          </>
        ) : (
          <span style={{ fontSize: 11, color: "var(--grey-600)" }}>View only. Ask the coach or front desk to change this session.</span>
        )
      }
    >
      {rows.map(([k, v]) => (
        <KVRow key={k} k={k} v={v} />
      ))}
    </Drawer>
  );
}

const TYPES: [string, string][] = [
  ["PERSONAL_TRAINING", "Personal Training"],
  ["IN_PERSON_ASSESSMENT", "In person session"],
  ["LIVE_VIDEO", "Live video session"],
  ["BREATH_SESSION", "Breath Session"],
  ["TRIAL_TRAINING", "Trial Training"],
  ["REVIEW_CALL", "Review call"],
  ["REASSESSMENT", "Reassessment"],
];

/** BOOK FOR CLIENT: client, coach and slot. */
export function BookDrawer({ clients, coaches, slots, closeHref, book }: {
  clients: { id: string; name: string }[];
  coaches: { id: string; name: string }[];
  slots: Slot[];
  closeHref: string;
  book: (i: { clientId: string; slotId: string; type: "PERSONAL_TRAINING" }) => Promise<Act>;
}) {
  const { pending, run, router } = useRun();
  const [clientId, setClient] = useState("");
  const [coach, setCoach] = useState(coaches[0]?.id ?? "");
  const [slotId, setSlot] = useState("");
  const [type, setType] = useState("PERSONAL_TRAINING");
  const mine = slots.filter((s) => s.staffId === coach);
  return (
    <Drawer open title="Book for client" onClose={() => router.push(closeHref, { scroll: false })}>
      <form
        className={a.form}
        onSubmit={(e) => {
          e.preventDefault();
          run(() => book({ clientId, slotId, type: type as "PERSONAL_TRAINING" }));
        }}
      >
        <label style={fieldLabel}>
          Client
          <select required value={clientId} onChange={(e) => setClient(e.target.value)} style={input}>
            <option value="">Pick a client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label style={fieldLabel}>
          Session
          <select value={type} onChange={(e) => setType(e.target.value)} style={input}>
            {TYPES.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <span style={fieldLabel}>Coach</span>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {coaches.map((c) => (
            <button key={c.id} type="button" style={chipBtn(coach === c.id, 30)} aria-pressed={coach === c.id} onClick={() => { setCoach(c.id); setSlot(""); }}>
              {c.name}
            </button>
          ))}
        </div>
        <span style={fieldLabel}>Slot</span>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {mine.map((s) => (
            <button key={s.id} type="button" style={chipBtn(slotId === s.id, 30)} aria-pressed={slotId === s.id} onClick={() => setSlot(s.id)}>
              {s.label}
            </button>
          ))}
          {mine.length === 0 && <span style={{ fontSize: 11, color: "var(--grey-600)" }}>No free slots in the next 3 weeks. Add availability first.</span>}
        </div>
        <Button variant="blue" size="sm" full type="submit" disabled={pending || !clientId || !slotId}>
          BOOK FOR CLIENT
        </Button>
      </form>
    </Drawer>
  );
}

/** AVAILABILITY: add and remove a coach's slots. */
export function AvailabilityDrawer({ coaches, coachId, slots, centres, closeHref, coachHref, add, remove }: {
  coaches: { id: string; name: string }[];
  coachId: string;
  slots: { id: string; label: string; taken: boolean }[];
  centres: { id: string; name: string }[];
  closeHref: string;
  coachHref: Record<string, string>;
  add: (i: { staffId: string; date: string; time: string; minutes: number; centreId?: string }) => Promise<Act>;
  remove: (id: string) => Promise<Act>;
}) {
  const { pending, run, router } = useRun();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("07:00");
  const [minutes, setMinutes] = useState(60);
  const [centre, setCentre] = useState(centres[0]?.id ?? "online");
  return (
    <Drawer open title="Availability" onClose={() => router.push(closeHref, { scroll: false })}>
      <div className={a.form}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {coaches.map((c) => (
            <button key={c.id} type="button" style={chipBtn(coachId === c.id, 30)} aria-pressed={coachId === c.id} onClick={() => router.push(coachHref[c.id], { scroll: false })}>
              {c.name}
            </button>
          ))}
        </div>
        <form
          style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--grey-200)", paddingTop: 10 }}
          onSubmit={(e) => {
            e.preventDefault();
            run(() => add({ staffId: coachId, date, time, minutes, centreId: centre }));
          }}
        >
          <div className={a.row2}>
            <label style={fieldLabel}>
              Date
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} style={input} />
            </label>
            <label style={fieldLabel}>
              Time
              <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} style={input} />
            </label>
            <label style={fieldLabel}>
              Minutes
              <input type="number" min={15} max={240} step={15} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} style={input} />
            </label>
            <label style={fieldLabel}>
              Where
              <select value={centre} onChange={(e) => setCentre(e.target.value)} style={input}>
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="online">Online</option>
              </select>
            </label>
          </div>
          <Button variant="ink" size="sm" type="submit" disabled={pending || !date}>
            ADD SLOT
          </Button>
        </form>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Next 3 weeks</span>
        <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--grey-200)" }}>
          {slots.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "6px 10px", borderBottom: "1px solid var(--grey-200)", fontSize: 11 }}>
              <span>{s.label}</span>
              {s.taken ? (
                <span style={{ fontSize: 9, textTransform: "uppercase", color: "var(--grey-600)" }}>Booked</span>
              ) : (
                <button type="button" style={squareBtn} aria-label={`Remove ${s.label}`} disabled={pending} onClick={() => run(() => remove(s.id))}>
                  ×
                </button>
              )}
            </div>
          ))}
          {slots.length === 0 && <span style={{ padding: "8px 10px", fontSize: 11, color: "var(--grey-600)" }}>No slots yet.</span>}
        </div>
      </div>
    </Drawer>
  );
}
