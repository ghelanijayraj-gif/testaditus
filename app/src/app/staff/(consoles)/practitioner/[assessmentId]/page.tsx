import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { consoleCtx, openClient } from "@/server/consoles/access";
import { loadPractitioner } from "@/server/consoles/data";
import { NoAccess, NotFound, TitleRow } from "@/components/staff/consoles/Bits";
import { Brief } from "@/components/staff/consoles/Brief";
import { Console } from "@/components/staff/consoles/Console";
import { PhotosTab } from "@/components/staff/consoles/PhotosTab";
import { Wrap } from "@/components/staff/consoles/Wrap";
import { OutboxSync } from "@/components/staff/consoles/OutboxSync";
import s from "@/components/staff/consoles/consoles.module.css";

export const metadata: Metadata = { title: "Practitioner console" };

const TABS = ["brief", "console", "photos", "wrap"] as const;
type Tab = (typeof TABS)[number];

export default async function PractitionerPage({ params, searchParams }: { params: Promise<{ assessmentId: string }>; searchParams: Promise<{ tab?: string; test?: string }> }) {
  const { assessmentId } = await params;
  const sp = await searchParams;
  const ctx = await consoleCtx();
  const head = await prisma.assessment.findUnique({ where: { id: assessmentId }, select: { clientId: true } });
  if (!head) return <NotFound what="This assessment does not exist." />;
  if (!(await openClient(ctx, head.clientId, { type: "measures", id: assessmentId, name: "Assessment measures and media" }))) return <NoAccess />;
  const d = await loadPractitioner(assessmentId);
  if (!d) return <NotFound what="This assessment does not exist." />;

  const tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : null;
  if (!tab) {
    const closing = d.a.phases.some((p) => p.key === "close" && p.state !== "PENDING");
    const def: Tab = d.wrap.returned || d.wrap.status !== "DRAFT" || closing ? "wrap" : d.a.started ? "console" : "brief";
    redirect(`/staff/practitioner/${assessmentId}?tab=${def}`);
  }
  const title = { brief: "Before you start.", console: d.a.online ? "Assessment · online." : "Assessment.", photos: "Posture photos.", wrap: "Wrap up." }[tab];

  return (
    <main className={s.main}>
      <TitleRow ctx={d.ctxLine} title={title} />
      {tab !== "console" && <OutboxSync assessmentId={d.a.id} />}
      {tab === "brief" && <Brief d={d} />}
      {tab === "console" && (
        <Console
          key={d.a.id}
          a={d.a}
          client={d.client}
          bank={d.bank}
          measures={d.measures}
          consentOn={d.consentOn}
          flags={d.flags}
          savedAt={d.savedAt}
          checkedIn={d.checkedIn}
          concern={d.brief.concerns[0]?.region ?? null}
          initialTest={sp.test ?? null}
        />
      )}
      {tab === "photos" && <PhotosTab assessmentId={d.a.id} first={d.client.first} consentOn={d.consentOn} photos={d.photos} />}
      {tab === "wrap" && <Wrap mode="prac" assessmentId={d.a.id} first={d.client.first} wrap={d.wrap} />}
    </main>
  );
}
