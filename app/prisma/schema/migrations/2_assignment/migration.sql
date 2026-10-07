-- Evaluations are assigned to a coach by the head of department
ALTER TABLE "Report" ADD COLUMN "assignedToId" TEXT;
ALTER TABLE "Report" ADD COLUMN "assignedById" TEXT;
ALTER TABLE "Report" ADD COLUMN "assignedAt" TIMESTAMP(3);
ALTER TABLE "Report" ADD CONSTRAINT "Report_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "StaffProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
