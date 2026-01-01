import { redirect } from "next/navigation";

import { getServerSession } from "@midori/lib/server-api";
import type { Role } from "@midori/lib/roles";
import { InstanceDetailClient } from "@midori/components/instances/InstanceDetailClient";

interface InstanceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InstanceDetailPage({
  params,
}: InstanceDetailPageProps) {
  const user = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const instanceId = Number(id);
  const role = user.role as Role;

  return <InstanceDetailClient instanceId={instanceId} userRole={role} />;
}
