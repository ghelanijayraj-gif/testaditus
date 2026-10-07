import type { ReactNode } from "react";
import { getShellModel } from "@/server/client/shell/model";
import { ShellFrame } from "./ShellFrame";

// CONTRACT (owned by the Shell area): the client portal chrome (05 §1): rail, top bar
// with the top right action, mobile header, sticky action bar, tab bar, More sheet,
// Reach us panel, toasts. `preview` renders it view only for staff.
export async function ClientShell({ clientId, preview, children }: { clientId: string; preview?: boolean; children: ReactNode }) {
  const m = await getShellModel(clientId);
  return (
    <ShellFrame m={m} preview={!!preview}>
      {children}
    </ShellFrame>
  );
}
