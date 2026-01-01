import { redirect } from "next/navigation";

import { getServerSession } from "@midori/lib/server-api";
import type { Role } from "@midori/lib/roles";
import { InstructorsClient } from "@midori/components/admin/InstructorsClient";

export default async function InstructorsPage() {
  const user = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  // Check admin permission on server
  const role = user.role as Role;
  if (role !== "ADMIN") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="text-6xl">🚫</div>
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Instructors</h1>
        <p className="text-muted-foreground">
          Manage instructors and their roles
        </p>
      </div>

      <InstructorsClient />
    </div>
  );
}
