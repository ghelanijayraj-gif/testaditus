"use client";

import { useState } from "react";
import { Button } from "@/components/ds";
import { markExportDownloaded } from "@/server/client/records/actions";
import { useRun } from "./ui";

/** DOWNLOAD ALL: records the download, toasts the real counts, opens the printable index (zip is out of scope). */
export function ExportDownload() {
  const [done, setDone] = useState(false);
  const { run, pending } = useRun();
  return (
    <Button
      variant="white"
      size="md"
      disabled={pending}
      onClick={() => {
        window.open("/export/index", "_blank", "noopener");
        run(markExportDownloaded, { onDone: (r) => !r?.error && setDone(true) });
      }}
    >
      {done ? "✓ DOWNLOADED" : "DOWNLOAD ALL →"}
    </Button>
  );
}
