"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SessionDrawer } from "@/components/client/calendar/SessionDrawer";
import { ConfirmList } from "@/components/client/calendar/ConfirmList";
import { BookingModal } from "@/components/client/calendar/BookingModal";
import { LAYER_KEYS } from "./ActButton";

/**
 * Portal layers addressable by search params on any page:
 * ?session=<id>[&panel=resched|cant] · ?confirm=<id,id> · ?book=book|bookRe
 */
export function SessionLayer({ bookingClosed }: { bookingClosed: boolean }) {
  const sp = useSearchParams();
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const session = sp.get("session");
  const confirm = sp.get("confirm");
  const book = sp.get("book");

  const href = (open: Record<string, string>) => {
    const q = new URLSearchParams(sp.toString());
    for (const k of LAYER_KEYS) q.delete(k);
    for (const [k, v] of Object.entries(open)) q.set(k, v);
    const qs = q.toString();
    return `${pathname}${qs ? "?" + qs : ""}`;
  };
  const close = () => router.push(href({}), { scroll: false });

  if (session)
    return (
      <SessionDrawer
        key={session}
        id={session}
        panel={sp.get("panel") ?? "main"}
        setPanel={(p) => router.replace(href(p === "main" ? { session } : { session, panel: p }), { scroll: false })}
        onClose={close}
      />
    );
  if (confirm) return <ConfirmList ids={confirm.split(",").filter(Boolean)} onClose={close} onOpen={(id) => router.push(href({ session: id }), { scroll: false })} />;
  if ((book === "book" || book === "bookRe") && !bookingClosed) return <BookingModal kind={book} onClose={close} />;
  return null;
}
