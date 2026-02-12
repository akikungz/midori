import { redirect } from "next/navigation";

import { InstancesClient } from "@midori/components/instances/InstancesClient";
import type { Role } from "@midori/lib/roles";
import { getServerSession } from "@midori/lib/server-api";

export default async function AdminInstancesPage() {
  const user = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  const role = user.role as Role;
  if (role !== "ADMIN") {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center space-y-4">
        <div className="text-6xl">🚫</div>
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    );
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
