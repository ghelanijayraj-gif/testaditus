import { Button, Label } from "@/components/ds";
import { startTraining } from "@/server/client/results/actions";
import { trainingProducts } from "@/server/client/results";

/** Training plan cards (05 My plan Choose / report 09). Start training → Shopify checkout (training_plan). */
export async function PlanCards({ recommended, coach }: { recommended: "PERSONAL_TRAINING" | "GROUP_TRAINING" | "EITHER" | null; coach: string | null }) {
  const products = await trainingProducts();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: 12 }}>
      {products.map((p) => {
        const pt = p.kind === "PERSONAL_TRAINING";
        const rec = recommended === p.kind || (recommended === "EITHER" && !pt);
        const meta = pt ? `1:1${coach ? " with " + coach : ""} · ${p.validityDays ?? "XX"} days` : `Mobility Lab and Fundamentals · ${p.validityDays ?? "XX"} days`;
        return (
          <form key={p.id} action={startTraining} style={{ border: "2px solid var(--ink)", padding: 18, display: "flex", flexDirection: "column", gap: 10, background: rec ? "var(--ice)" : "#fff", boxShadow: rec ? "6px 6px 0 #006DE0" : "none" }}>
            <input type="hidden" name="productSlug" value={p.slug} />
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>{p.name}</span>
              {rec && <Label tone="blue">RECOMMENDED</Label>}
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 0.92, textTransform: "uppercase" }}>
              {p.sessions} {pt ? "sessions" : "classes"}
            </span>
            <span style={{ fontSize: 12, color: "var(--grey-700)" }}>{meta}</span>
            <span style={{ font: "600 22px var(--font-sans)" }}>{p.priceLabel}</span>
            <Button type="submit" variant={rec ? "blue" : "outline"} size="md" full>
              START TRAINING →
            </Button>
          </form>
        );
      })}
    </div>
  );
}
