import { InstructorsClient } from "@midori/components/admin/InstructorsClient";
import { AccessDeniedState } from "@midori/components/shared";
import { requireServerRole } from "@midori/lib/server-auth";

export default async function InstructorsPage() {
  const { isAllowed } = await requireServerRole("ADMIN");

  if (!isAllowed) {
    return <AccessDeniedState />;
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
