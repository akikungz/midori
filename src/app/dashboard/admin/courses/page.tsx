import { CoursesClient } from "@midori/components/admin/CoursesClient";
import { AccessDeniedState } from "@midori/components/shared";
import { requireServerRole } from "@midori/lib/server-auth";

export default async function CoursesPage() {
  const { isAllowed } = await requireServerRole("ADMIN");

  if (!isAllowed) {
    return <AccessDeniedState minHeightClassName="min-h-100" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">Manage courses in the system</p>
        </div>
      </div>

      <CoursesClient />
    </div>
  );
}
