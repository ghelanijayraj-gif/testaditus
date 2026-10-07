import { Block, Grid, PageHead, type Cell, type Row } from "@/components/staff/Page";
import { ActionButton } from "@/components/ui/ActionButton";
import { requireStaff } from "@/server/auth/guards";
import { loadToday } from "@/server/staff/today";
import { scopeLabel } from "@/server/staff/common";
import { nudgeClients } from "@/server/staff/actions/clients";
import { dayLabel } from "@/lib/format";
import { now } from "@/lib/clock";
import { linkBtn } from "@/components/staff/admin/styles";

export const metadata = { title: "Today" };

export default async function Today() {
  const ctx = await requireStaff({ section: "today" });
  const widgets = await loadToday(ctx);
  return (
    <>
      <PageHead kicker={`${dayLabel(now())} · ${scopeLabel(ctx)}`} title="Today" />
      <Grid variant="auto">
        {widgets.map((w) => (
          <Block
            key={w.key}
            title={w.title}
            cols="minmax(0,1.2fr) minmax(0,1.3fr) minmax(0,1fr)"
            empty="Clear. Nothing waiting."
            rows={w.rows.map(
              (r): Row => ({
                key: r.key,
                href: r.href,
                cells: r.cells.map((c, i): Cell => {
                  if (r.nudge && i === r.cells.length - 1)
                    return (
                      <ActionButton key="n" action={nudgeClients.bind(null, [r.nudge.clientId])} style={linkBtn} aria-label={`Nudge ${r.nudge.first}`}>
                        NUDGE →
                      </ActionButton>
                    );
                  return { v: c.v, sans: c.sans, b: c.b, chip: c.chip, flag: c.flag, link: c.link };
                }),
              }),
            )}
          />
        ))}
      </Grid>
    </>
  );
}
