import { SemestersClient } from "@midori/components/admin/SemestersClient";
import { AccessDeniedState } from "@midori/components/shared";
import { requireServerRole } from "@midori/lib/server-auth";

export default async function SemestersPage() {
  const { isAllowed } = await requireServerRole("ADMIN");

  if (!isAllowed) {
    return <AccessDeniedState minHeightClassName="min-h-100" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Semesters</h1>
          <p className="text-muted-foreground">Manage academic semesters</p>
        </div>
      </div>

      <SemestersClient />
    </div>
  );
}
