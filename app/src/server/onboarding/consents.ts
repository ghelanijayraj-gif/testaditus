// Setup 3 consents (01), verbatim. No "server-only": the setup form renders these.
import type { ConsentKind } from "@prisma/client";

export const SETUP_CONSENTS: { kind: ConsentKind; label: string; desc: string }[] = [
  { kind: "HEALTH_DOCUMENTS", label: "Store my health documents", desc: "Blood tests, scans and notes you upload. Seen only by you, your coach and the head coach." },
  { kind: "PHOTOS_VIDEOS", label: "Progress photos and videos", desc: "We film you at baseline and reassessment to compare. Only you and your coach see them." },
  { kind: "HEALTH_APP_SYNC", label: "Sync data from health apps", desc: "If you connect Apple Health or similar, we read sleep, heart rate and activity. You choose what your coach sees." },
  { kind: "TESTIMONIAL", label: "Share my story as a testimonial", desc: "We may ask to publish your progress. We always show you the final version first." },
  { kind: "COMMUNITY", label: "Add me to the ADITUS community", desc: "A WhatsApp group for events, Run and Plunge, and open practice." },
];
