import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getServerSession, createServerApiClient } from "@midori/lib/server-api";
import { hasPermission, type Role } from "@midori/lib/roles";
import { Button } from "@midori/components/ui/button";
import { NewRequestForm } from "@midori/components/requests/NewRequestForm";

export default async function NewRequestPage() {
  const user = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  // Check permission on server
  const role = user.role as Role;
  if (!hasPermission(role, "CREATE_REQUEST")) {
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

  // Fetch courses on server
  const api = await createServerApiClient();
  const { data: coursesData } = await api.GET("/api/academic/courses", {
    params: {
      query: { page: 1, pageSize: 100, isActive: true },
    },
  });

  const courses = coursesData?.values || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/requests">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            New Instance Request
          </h1>
          <p className="text-muted-foreground">
            Submit a request for a new virtual machine instance
          </p>
        </div>
      </div>

      <NewRequestForm courses={courses} />
    </div>
  );
}
