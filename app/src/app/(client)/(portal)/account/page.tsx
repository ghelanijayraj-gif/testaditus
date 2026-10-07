import type { Metadata } from "next";
import { requireClient } from "@/server/auth/guards";
import { ToastProvider } from "@/components/ui/Toast";
import { AccountView } from "@/components/client/records/AccountView";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const { client } = await requireClient();
  return (
    <ToastProvider>
      <AccountView clientId={client.id} />
    </ToastProvider>
  );
}
