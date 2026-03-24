import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AccessDeniedState } from "@midori/components/shared";
import { requireServerPermission } from "@midori/lib/server-auth";
import { Button } from "@midori/components/ui/button";
import { NewRequestForm } from "@midori/components/requests/NewRequestForm";

export default async function NewRequestPage() {
  const { isAllowed } = await requireServerPermission("CREATE_REQUEST");

  if (!isAllowed) {
    return <AccessDeniedState minHeightClassName="min-h-100" />;
  }

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

      <NewRequestForm />
    </div>
  );
}
