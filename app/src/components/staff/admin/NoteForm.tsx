"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ds";
import { useToast } from "@/components/ui/Toast";
import { textarea } from "./styles";

type Act = { toast?: string; error?: string } | void;

/** Internal notes: staff only, never shown to the client. */
export function NoteForm({ add }: { add: (body: string) => Promise<Act> }) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <form
      style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await add(body);
          if (r?.error) return toast(r.error);
          if (r?.toast) toast(r.toast);
          setBody("");
          router.refresh();
        });
      }}
    >
      <label htmlFor="note-body" style={{ fontSize: 9, textTransform: "uppercase", color: "var(--grey-600)" }}>
        Add note · staff only · not shown to client
      </label>
      <textarea id="note-body" value={body} onChange={(e) => setBody(e.target.value)} style={textarea} placeholder="Watch right knee on single leg work." />
      <div>
        <Button variant="ink" size="sm" type="submit" disabled={pending || !body.trim()}>
          ADD NOTE
        </Button>
      </div>
    </form>
  );
}
