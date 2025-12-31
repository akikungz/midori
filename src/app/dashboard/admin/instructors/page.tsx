"use client";

import { useState } from "react";
import { Users, Search, Edit, Shield } from "lucide-react";

import { api } from "@midori/lib/api";
import { withRoleCheck } from "@midori/components/RoleGuard";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
} from "@midori/components/ui/card";
import { Badge } from "@midori/components/ui/badge";
import { Skeleton } from "@midori/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";
import { Avatar, AvatarFallback } from "@midori/components/ui/avatar";
import { getRoleDisplayName, getRoleBadgeVariant, type Role } from "@midori/lib/roles";

function InstructorsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data, isLoading } = api.useQuery(
    "get",
    "/api/academic/instructors",
    {
      params: {
        query: { page, pageSize },
      },
    }
  );

  const instructors = data?.values || [];
  const totalPages = data?.totalPages || 1;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search instructors..." className="pl-9" />
      </div>

      {/* Instructors List */}
      {instructors.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No Instructors</EmptyTitle>
            <EmptyDescription>
              No instructors found in the system.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          {instructors.map((instructor) => (
            <Card key={instructor.id} className="transition-colors hover:border-primary/50">
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(instructor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{instructor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {instructor.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getRoleBadgeVariant(instructor.role as Role)}>
                      {getRoleDisplayName(instructor.role as Role)}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-1.5 size-3.5" />
                      Edit
                    </Button>
                    {instructor.role !== "ADMIN" && (
                      <Button variant="outline" size="sm">
                        <Shield className="mr-1.5 size-3.5" />
                        Promote to Admin
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
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

export default withRoleCheck(InstructorsPage, { roles: ["ADMIN"] });
