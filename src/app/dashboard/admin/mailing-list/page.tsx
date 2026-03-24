import { MailingListClient } from "@midori/components/admin/MailingListClient";
import { AccessDeniedState } from "@midori/components/shared";
import { requireServerRole } from "@midori/lib/server-auth";

export default async function MailingListPage() {
  const { isAllowed } = await requireServerRole("ADMIN");

  if (!isAllowed) {
    return <AccessDeniedState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mailing List</h1>
          <p className="text-muted-foreground">
            Manage instructor email addresses for notifications
          </p>
        </div>
      </div>

      <MailingListClient />
    </div>
  );
}
