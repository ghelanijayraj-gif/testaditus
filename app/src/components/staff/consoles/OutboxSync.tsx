"use client";

import { saveMeasures } from "@/server/consoles/actions";
import { useOutbox } from "./outbox";

/** Keeps replaying the tablet's offline queue while another tab is open. */
export function OutboxSync({ assessmentId }: { assessmentId: string }) {
  useOutbox(assessmentId, (ops) => saveMeasures(assessmentId, ops));
  return null;
}
