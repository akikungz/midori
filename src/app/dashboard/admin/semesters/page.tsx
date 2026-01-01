import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { getServerSession } from "@midori/lib/server-api";
import type { Role } from "@midori/lib/roles";
import { Button } from "@midori/components/ui/button";
import { SemestersClient } from "@midori/components/admin/SemestersClient";

export default async function SemestersPage() {
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Semesters</h1>
          <p className="text-muted-foreground">Manage academic semesters</p>
        </div>
        <Button>
          <Plus className="mr-2 size-4" />
          Add Semester
        </Button>
      </div>

      <SemestersClient />
    </div>
  );
}
