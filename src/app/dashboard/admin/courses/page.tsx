"use client";

import { useState } from "react";
import { GraduationCap, Plus, Search, Edit, Users } from "lucide-react";

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

function CoursesPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data, isLoading } = api.useQuery(
    "get",
    "/api/academic/courses",
    {
      params: {
        query: { page, pageSize },
      },
    }
  );

  const courses = data?.values || [];
  const totalPages = data?.totalPages || 1;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
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
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">
            Manage courses in the system
          </p>
        </div>
        <Button>
          <Plus className="mr-2 size-4" />
          Add Course
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search courses..." className="pl-9" />
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Empty
          icon={GraduationCap}
          title="No Courses"
          description="No courses have been added yet."
        >
          <Button>
            <Plus className="mr-2 size-4" />
            Add Course
          </Button>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="transition-colors hover:border-primary/50">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{course.code}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {course.title}
                    </CardDescription>
                  </div>
                  <Badge variant={course.isActive ? "default" : "secondary"}>
                    {course.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {course.description && (
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="mr-1.5 size-3.5" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Users className="mr-1.5 size-3.5" />
                    Instructors
                  </Button>
                </div>
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

export default withRoleCheck(CoursesPage, { roles: ["ADMIN"] });
