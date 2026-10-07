import type { Metadata } from "next";
import { consoleCtx, openClient } from "@/server/consoles/access";
import { loadPhotoReview } from "@/server/consoles/data";
import { NoAccess, NotFound } from "@/components/staff/consoles/Bits";
import { PhotoReview } from "@/components/staff/consoles/PhotoReview";
import { prisma } from "@/server/db";

export const metadata: Metadata = { title: "Photo review" };

/** 11 review: annotate photos, step through videos, score the squat, request a retake, finish. */
export default async function PhotoReviewPage({ params, searchParams }: { params: Promise<{ clientId: string }>; searchParams: Promise<{ module?: string }> }) {
  const { clientId } = await params;
  const ctx = await consoleCtx();
  if (!(await prisma.clientProfile.count({ where: { id: clientId } }))) return <NotFound what="This client does not exist." />;
  if (!(await openClient(ctx, clientId, { type: "media", id: `capture:${clientId}`, name: "Online Capture photos and videos" }))) return <NoAccess />;
  const d = await loadPhotoReview(clientId, (await searchParams).module);
  if (!d) return <NotFound what="This client does not exist." />;
  return <PhotoReview d={d} />;
}
