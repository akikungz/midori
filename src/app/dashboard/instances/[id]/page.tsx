import { InstanceDetailClient } from "@midori/components/instances/InstanceDetailClient";
import { requireServerSession } from "@midori/lib/server-auth";

interface InstanceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InstanceDetailPage({
  params,
}: InstanceDetailPageProps) {
  const { role } = await requireServerSession();
  const { id } = await params;
  const instanceId = Number(id);

  return <InstanceDetailClient instanceId={instanceId} userRole={role} />;
}
