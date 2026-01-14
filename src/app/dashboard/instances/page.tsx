import { redirect } from "next/navigation";

import { getServerSession } from "@midori/lib/server-api";
import type { Role } from "@midori/lib/roles";
import { InstancesClient } from "@midori/components/instances/InstancesClient.new";

export default async function InstancesPage() {
  const user = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  const role = user.role as Role;

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
