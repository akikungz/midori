import { redirect } from "next/navigation";

import { getServerSession } from "@midori/lib/server-api";
import type { Role } from "@midori/lib/roles";
import { StorageClient } from "@midori/components/storage/StorageClient";

export default async function StoragePage() {
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
          <h1 className="text-2xl font-bold tracking-tight">Storage</h1>
          <p className="text-muted-foreground">Manage your files and folders</p>
        </div>
      </div>

      <StorageClient userRole={role} />
    </div>
  );
}
