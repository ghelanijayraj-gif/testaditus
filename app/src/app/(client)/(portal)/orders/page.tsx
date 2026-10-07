import type { Metadata } from "next";
import { requireClient } from "@/server/auth/guards";
import { ToastProvider } from "@/components/ui/Toast";
import { OrdersView } from "@/components/client/records/OrdersView";
import { settlePaidInvoice } from "@/server/client/records/orders";

export const metadata: Metadata = { title: "Orders and invoices" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const { client } = await requireClient();
  const { paid } = await searchParams;
  if (paid) await settlePaidInvoice(client.id, paid);
  return (
    <ToastProvider>
      <OrdersView clientId={client.id} />
    </ToastProvider>
  );
}
