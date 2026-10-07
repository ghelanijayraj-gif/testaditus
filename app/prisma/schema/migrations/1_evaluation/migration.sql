-- Coach evaluation stored on the report
ALTER TABLE "Report" ADD COLUMN "evaluation" JSONB NOT NULL DEFAULT '{}';

-- App level markers (demo seed version)
CREATE TABLE "AppMeta" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "AppMeta_pkey" PRIMARY KEY ("key")
);
