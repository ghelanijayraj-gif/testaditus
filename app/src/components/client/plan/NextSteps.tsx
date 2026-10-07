// CONTRACT (owned by the Plan area): "Recommended next assessment steps" (06 report
// screen). Rendered inside the report view (Results area) and at /assessment/next-steps.
export async function NextSteps({ clientId, reportId, readOnly }: { clientId: string; reportId?: string; readOnly?: boolean }) {
  void readOnly;
  void reportId;
  return <div data-stub="NextSteps">Next steps for {clientId} (not built yet)</div>;
}
