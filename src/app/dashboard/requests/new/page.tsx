import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AccessDeniedState } from "@midori/components/shared";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@midori/components/ui/empty";
import { requireServerPermission } from "@midori/lib/server-auth";
import { createServerApiClient } from "@midori/lib/server-api";
import { Button } from "@midori/components/ui/button";
import { NewRequestForm } from "@midori/components/requests/NewRequestForm";

export default async function NewRequestPage() {
  const { isAllowed, role } = await requireServerPermission("CREATE_REQUEST");

  if (!isAllowed) {
    return <AccessDeniedState minHeightClassName="min-h-100" />;
  }

  const isStudent = role === "STUDENT";
  const api = await createServerApiClient();
  const { data: currentSemester } = await api.GET(
    "/api/academic/semesters/current",
  );
  const isSemesterBreak = isStudent && !currentSemester;

  if (isSemesterBreak) {
    return (
      <div className="space-y-6">
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
            <p className="text-muted-foreground">Semester Break</p>
          </div>
        </div>

        <Empty>
          <EmptyHeader>
            <EmptyTitle>Request creation is unavailable</EmptyTitle>
            <EmptyDescription>
              Students cannot create new instance requests during semester
              break. Please come back when the next semester starts.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
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

      <NewRequestForm userRole={role} />
    </div>
  );
}
