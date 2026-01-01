import { redirect } from "next/navigation";

import { getServerSession } from "@midori/lib/server-api";
import { DashboardCards } from "@midori/components/dashboard/DashboardCards";

export default async function DashboardPage() {
  const user = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  return <DashboardCards user={user} />;
}
