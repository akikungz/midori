import Link from "next/link";
import { Plus } from "lucide-react";

import { hasPermission } from "@midori/lib/roles";
import { requireServerSession } from "@midori/lib/server-auth";
import { Button } from "@midori/components/ui/button";
import { RequestsClient } from "@midori/components/requests";

export default async function RequestsPage() {
  const { role } = await requireServerSession();
  const isStudent = role === "STUDENT";
  const canCreateRequest = hasPermission(role, "CREATE_REQUEST");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground">
            {isStudent
              ? "View and manage your instance requests"
              : "Review and process instance requests"}
          </p>
        </div>
        {canCreateRequest && (
          <Button asChild>
            <Link href="/dashboard/requests/new">
              <Plus className="mr-2 size-4" />
              New Request
            </Link>
          </Button>
        )}
      </div>

      <RequestsClient userRole={role} isStudent={isStudent} />
    </div>
  );
}
