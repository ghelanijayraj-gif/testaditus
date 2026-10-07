// CONTRACT (owned by the Shell area): Home page body for a client (05 Home, or the
// Plan area's AssessmentHome before the report is released).
export async function HomeView({ clientId, readOnly }: { clientId: string; readOnly?: boolean }) {
  void readOnly;
  return <div data-stub="HomeView">Home for {clientId} (not built yet)</div>;
}
