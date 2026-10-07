// CONTRACT (owned by the Plan area): the client's Assessment plan screen (06 "plan"):
// module cards, system steps, coverage grid, recommendation card, reopen strip.
// Rendered at /assessment/plan, inside /assessment before the report is released,
// and by staff "Preview as client".
export async function PlanScreen({ clientId, readOnly }: { clientId: string; readOnly?: boolean }) {
  void readOnly;
  return <div data-stub="PlanScreen">Assessment plan for {clientId} (not built yet)</div>;
}
