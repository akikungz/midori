"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search, Filter, Clock, CheckCircle, XCircle, Ban } from "lucide-react";

import { api } from "@midori/lib/api";
import { useRole } from "@midori/hooks/useRole";
import { RoleGuard } from "@midori/components/RoleGuard";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midori/components/ui/tabs";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";

const statusConfig = {
  PENDING: {
    variant: "secondary" as const,
    icon: Clock,
    label: "Pending",
  },
  APPROVED: {
    variant: "default" as const,
    icon: CheckCircle,
    label: "Approved",
  },
  REJECTED: {
    variant: "destructive" as const,
    icon: XCircle,
    label: "Rejected",
  },
  CANCELLED: {
    variant: "outline" as const,
    icon: Ban,
    label: "Cancelled",
  },
};

export default function RequestsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { isStudent } = useRole();

  const { data, isLoading } = api.useQuery(
    "get",
    "/api/requests/",
    {
      params: {
        query: {
          page,
          pageSize,
          ...(statusFilter !== "all" && { status: statusFilter as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" }),
        },
      },
    }
  );

  const requests = data?.values || [];
  const totalPages = data?.totalPages || 1;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24" />
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
          <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground">
            {isStudent
              ? "View and manage your instance requests"
              : "Review and process instance requests"}
          </p>
        </div>
        <RoleGuard permission="CREATE_REQUEST">
          <Button asChild>
            <Link href="/dashboard/requests/new">
              <Plus className="mr-2 size-4" />
              New Request
            </Link>
          </Button>
        </RoleGuard>
      </div>

      {/* Tabs for status filtering */}
      <Tabs defaultValue="all" onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="PENDING">
            <Clock className="mr-1.5 size-3.5" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="APPROVED">
            <CheckCircle className="mr-1.5 size-3.5" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="REJECTED">
            <XCircle className="mr-1.5 size-3.5" />
            Rejected
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search requests..." className="pl-9" />
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No Requests</EmptyTitle>
            <EmptyDescription>
              {isStudent
                ? "You haven't made any requests yet."
                : "No requests to review."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <RoleGuard permission="CREATE_REQUEST">
              <Button asChild>
                <Link href="/dashboard/requests/new">
                  <Plus className="mr-2 size-4" />
                  Create Request
                </Link>
              </Button>
            </RoleGuard>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const StatusIcon = statusConfig[request.status].icon;
            return (
              <Card key={request.id} className="transition-colors hover:border-primary/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {request.title}
                        </CardTitle>
                        <Badge variant={statusConfig[request.status].variant}>
                          <StatusIcon className="mr-1 size-3" />
                          {statusConfig[request.status].label}
                        </Badge>
                      </div>
                      <CardDescription>
                        {request.courseOffering
                          ? `${request.courseOffering.courseCode} - ${request.courseOffering.semester}`
                          : "No course assigned"}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/requests/${request.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">
                        {request.specs.cpus}
                      </span>{" "}
                      vCPU
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        {request.specs.memoryMB / 1024}
                      </span>{" "}
                      GB RAM
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        {request.specs.diskGB}
                      </span>{" "}
                      GB Disk
                    </div>
                    {request.templateName && (
                      <div>
                        Template:{" "}
                        <span className="font-medium text-foreground">
                          {request.templateName}
                        </span>
                      </div>
                    )}
                  </div>
                  {request.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {request.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
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
