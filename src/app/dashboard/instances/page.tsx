import { InstancesClient } from "@midori/components/instances/InstancesClient";
import { requireServerSession } from "@midori/lib/server-auth";

export default async function InstancesPage() {
  const { role } = await requireServerSession();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Instances</h1>
          <p className="text-muted-foreground">
            Manage your virtual machine instances
          </p>
        </div>
      </div>

      <InstancesClient userRole={role} />
    </div>
  );
}
