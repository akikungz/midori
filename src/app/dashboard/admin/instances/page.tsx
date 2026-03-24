import { InstancesClient } from "@midori/components/instances/InstancesClient";
import { AccessDeniedState } from "@midori/components/shared";
import { requireServerRole } from "@midori/lib/server-auth";

export default async function AdminInstancesPage() {
  const { isAllowed, role } = await requireServerRole("ADMIN");

  if (!isAllowed) {
    return <AccessDeniedState minHeightClassName="min-h-100" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Instances</h1>
        <p className="text-muted-foreground">
          View and manage all virtual machine instances in the system
        </p>
      </div>

      <InstancesClient userRole={role} listScope="admin" />
    </div>
  );
}
