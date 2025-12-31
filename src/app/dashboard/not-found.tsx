import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

import { Button } from "@midori/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Empty>
        <EmptyMedia variant="icon">
          <FileQuestion />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Page Not Found</EmptyTitle>
          <EmptyDescription>
            The page you're looking for doesn't exist or has been moved.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href="/dashboard">
            <Home className="mr-2 size-4" />
            Back to Dashboard
          </Link>
        </Button>
      </Empty>
    </div>
  );
}
