"use client";

import { useState } from "react";
import { CalendarDays, Plus, Search, Edit, Check } from "lucide-react";
import { format } from "date-fns";

import { api } from "@midori/lib/api";
import { withRoleCheck } from "@midori/components/RoleGuard";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { Badge } from "@midori/components/ui/badge";
import { Skeleton } from "@midori/components/ui/skeleton";
import { Empty } from "@midori/components/ui/empty";

function SemestersPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data, isLoading } = api.useQuery(
    "get",
    "/api/academic/semesters",
    {
      params: {
        query: { page, pageSize },
      },
    }
  );

  const semesters = data?.values || [];
  const totalPages = data?.totalPages || 1;

  const formatDate = (date: string | number | Record<string, never>) => {
    if (typeof date === "string" || typeof date === "number") {
      return format(new Date(date), "MMM d, yyyy");
    }
    return "N/A";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Semesters</h1>
          <p className="text-muted-foreground">
            Manage academic semesters
          </p>
        </div>
        <Button>
          <Plus className="mr-2 size-4" />
          Add Semester
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search semesters..." className="pl-9" />
      </div>

      {/* Semesters Grid */}
      {semesters.length === 0 ? (
        <Empty
          icon={CalendarDays}
          title="No Semesters"
          description="No semesters have been added yet."
        >
          <Button>
            <Plus className="mr-2 size-4" />
            Add Semester
          </Button>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {semesters.map((semester) => (
            <Card key={semester.id} className="transition-colors hover:border-primary/50">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{semester.name}</CardTitle>
                    <CardDescription>
                      {formatDate(semester.startDate)} - {formatDate(semester.endDate)}
                    </CardDescription>
                  </div>
                  {semester.isCurrent && (
                    <Badge variant="default">
                      <Check className="mr-1 size-3" />
                      Current
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">
                  <Edit className="mr-1.5 size-3.5" />
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default withRoleCheck(SemestersPage, { roles: ["ADMIN"] });
