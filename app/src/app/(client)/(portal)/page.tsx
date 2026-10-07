import type { Metadata } from "next";
import { requireClient } from "@/server/auth/guards";
import { HomeView } from "@/components/client/home/HomeView";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const { client } = await requireClient();
  return <HomeView clientId={client.id} />;
}
