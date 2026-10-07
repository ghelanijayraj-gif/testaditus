/** Plan editor quick actions (12 `ED.quick`). Shared by the editor UI and the server action. */
export type QuickKey = "photos" | "document" | "question" | "live" | "recommend" | "library";

export const QUICK: { k: QuickKey; label: string; family: string | null; name: string; note: string; paid: boolean; clinical: boolean }[] = [
  { k: "photos", label: "Request more photos", family: "photos", name: "Follow up photos", note: "Please retake your side view photos with the phone at hip height.", paid: false, clinical: true },
  { k: "document", label: "Request a document", family: "blood", name: "Blood report upload request", note: "Please upload your last blood report.", paid: false, clinical: true },
  { k: "question", label: "Send a question", family: null, name: "Question from {name}", note: "How many days a week do you run?", paid: false, clinical: true },
  { k: "live", label: "Add live session", family: "live", name: "Live video session", note: "A 30 minute live call to watch your squat.", paid: true, clinical: false },
  { k: "recommend", label: "Recommend in person session", family: "inperson", name: "In person session", note: "We could not measure hip rotation online.", paid: true, clinical: false },
  { k: "library", label: "From library", family: null, name: "", note: "", paid: false, clinical: true },
];

/** Ops admin may add payment and booking modules only. */
export const OPS_TYPES = ["IN_PERSON"] as const;

export type Pending = { required?: boolean; paid?: boolean; priceLabel?: string | null; replacesCapture?: boolean; dueAt?: string | null; note?: string | null; remove?: boolean };
export type ModuleData = { pending?: Pending; paymentUrl?: string | null; checkoutId?: string | null; reviewedAt?: string; [k: string]: unknown };

/** Field types offered by the module builder ("+ field type" buttons). */
export const FIELD_TYPES: [string, string, string][] = [
  ["SHORT_TEXT", "Short text", "Text"],
  ["LONG_TEXT", "Long text", "Text"],
  ["SINGLE_CHOICE", "Single choice", "Choice"],
  ["MULTI_CHOICE", "Multiple choice", "Choices"],
  ["SCALE", "Scale", "Scale 0 to 10"],
  ["YES_NO", "Yes or no", "Yes or no"],
  ["NUMBER_UNIT", "Number with unit", "Number"],
  ["BODY_OUTLINE", "Body outline", "Body outline tap"],
  ["PHOTO", "Photo", "Photo · overlay"],
  ["VIDEO", "Video", "Video · up to 20 s"],
  ["TIMER", "Timer test", "Timer"],
  ["COUNTER", "Counter", "Counter"],
  ["UPLOAD", "Document upload", "PDF or photo"],
];
