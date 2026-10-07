import Link from "next/link";
import { prisma } from "@/server/db";
import { dayLabel } from "@/lib/format";
import { coverageRows } from "@/lib/assessment/plan";
import { ToastProvider } from "@/components/ui/Toast";
import { remindNextStep, requestBooking } from "@/server/client/plan/actions";
import { findBaselinePlan, clientModules } from "@/server/client/plan/view";
import { DsAction, LinkButton } from "./clientParts";
import { CoverageAside, VisitingMumbai } from "./parts";
import s from "./plan.module.css";

type Raw = {
  name?: string;
  family?: string;
  priceLabel?: string;
  price?: string;
  why?: string;
  reason?: string;
  by?: string;
  action?: string;
};
type Kind = "add" | "remind" | "book";

/** Report.nextSteps action → button. Accepts "add_and_book", "Add and book", "remind", "book"… */
function kindOf(r: Raw): Kind {
  const a = (r.action ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (a.includes("remind")) return "remind";
  if (a.includes("add") || r.family === "inperson") return "add";
  return "book";
}

const LABEL: Record<Kind, string> = {
  add: "ADD AND BOOK →",
  remind: "REMIND ME",
  book: "BOOK A TIME →",
};

// CONTRACT (owned by the Plan area): "Recommended next assessment steps" (06 report
// screen). Rendered inside the report view (Results area) and at /assessment/next-steps.
// Only released reports are shown: draft next steps stay staff side until release.
/** `embedded`: inside the report view (no page title, lead or coverage grid; the report shows those). */
export async function NextSteps({
  clientId,
  reportId,
  readOnly,
  embedded,
}: {
  clientId: string;
  reportId?: string;
  readOnly?: boolean;
  embedded?: boolean;
}) {
  const [client, report] = await Promise.all([
    prisma.clientProfile.findUnique({
      where: { id: clientId },
      include: { primaryPractitioner: { include: { user: true } } },
    }),
    prisma.report.findFirst({
      where: {
        clientId,
        status: "RELEASED",
        ...(reportId ? { id: reportId } : {}),
      },
      orderBy: { releasedAt: "desc" },
      include: {
        approver: { include: { user: true } },
        author: { include: { user: true } },
      },
    }),
  ]);
  if (!client) return null;
  const plan = await findBaselinePlan(clientId);
  const mods = plan ? await clientModules(plan.id) : [];
  const rows = coverageRows(
    mods.map((m) => ({ status: m.status, coverage: m.coverage })),
  );
  // "From finished steps": only what is done counts in the report view.
  const reportRows = rows.map((r) => ({ ...r, change: false }));
  const steps = ((report?.nextSteps as Raw[]) ?? []).filter((r) => r && r.name);
  const practitioner =
    report?.author?.user.name ??
    client.primaryPractitioner?.user.name ??
    "Jayraj";
  const reviewer = report?.approver?.user.name;

  return (
    <ToastProvider bottom={88}>
      <div className={embedded ? undefined : s.two}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minWidth: 0,
          }}
        >
          {!embedded && (
            <>
              <span className={s.kicker}>
                {report?.releasedAt
                  ? `Report · released ${dayLabel(report.releasedAt)}${reviewer ? ` · reviewed by ${reviewer}` : ""}`
                  : "Report · not released yet"}
              </span>
              <h1 className={s.h1}>Recommended next assessment steps.</h1>
              <span
                style={{
                  font: "400 16px/1.5 var(--font-sans)",
                  color: "var(--grey-700)",
                }}
              >
                {report
                  ? "Your report is built from the steps you finished. These would fill the gaps. Each one is optional."
                  : "Your practitioner attaches these to your report. They appear here once it is released."}
              </span>
            </>
          )}
          {report && steps.length === 0 && (
            <span style={{ font: "400 15px/1.5 var(--font-sans)" }}>
              No extra steps were recommended. Your report covers what you need
              to start.
            </span>
          )}
          {report &&
            steps.map((n, i) => {
              const kind = kindOf(n);
              const price =
                n.priceLabel ??
                n.price ??
                (kind === "add" ? "Paid · ₹X,XXX" : "Included");
              const why = n.why ?? n.reason;
              return (
                <article
                  key={i}
                  style={{
                    border: "2px solid var(--ink)",
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <h2
                      style={{ margin: 0, font: "600 18px var(--font-sans)" }}
                    >
                      {n.name}
                    </h2>
                    <span
                      style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        color: "var(--grey-600)",
                      }}
                    >
                      {price}
                    </span>
                  </span>
                  {why && (
                    <span style={{ font: "400 15px/1.5 var(--font-sans)" }}>
                      “{why}”
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      color: "var(--grey-600)",
                    }}
                  >
                    Attached by {n.by ?? practitioner}
                  </span>
                  <div>
                    {kind === "add" ? (
                      client.inMumbaiArea ? (
                        <LinkButton
                          href="/assessment/in-person?step=pay"
                          variant="outline"
                          size="sm"
                          readOnly={readOnly}
                        >
                          {LABEL.add}
                        </LinkButton>
                      ) : (
                        <VisitingMumbai />
                      )
                    ) : (
                      <DsAction
                        action={(kind === "remind"
                          ? remindNextStep
                          : requestBooking
                        ).bind(null, report.id, i)}
                        variant="outline"
                        size="sm"
                        disabled={readOnly}
                      >
                        {LABEL[kind]}
                      </DsAction>
                    )}
                  </div>
                </article>
              );
            })}
          {!embedded && (
            <Link href="/reports" className={s.textBtn}>
              Open the full report →
            </Link>
          )}
        </div>
        {!embedded && (
          <CoverageAside
            rows={reportRows}
            title="What this report covers"
            legend="From finished steps"
          />
        )}
      </div>
    </ToastProvider>
  );
}
