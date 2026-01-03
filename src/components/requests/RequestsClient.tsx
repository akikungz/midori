"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  FilePlus,
} from "lucide-react";

import { api, fetchClinet } from "@midori/lib/api";
import { hasPermission, type Role } from "@midori/lib/roles";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@midori/components/ui/tabs";
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

interface RequestsClientProps {
  userRole: Role;
  isStudent: boolean;
}

export function RequestsClient({ userRole, isStudent }: RequestsClientProps) {
  const queryClient = useQueryClient();
  const [requestType, setRequestType] = useState<"instance" | "extended">(
    "instance",
  );
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const can = (permission: string) => {
    return hasPermission(
      userRole,
      permission as Parameters<typeof hasPermission>[1],
    );
  };

  // Fetch instance requests
  const { data: instanceData, isLoading: instanceLoading } = api.useQuery(
    "get",
    "/api/requests/",
    {
      params: {
        query: {
          page,
          pageSize,
          ...(statusFilter !== "all" && {
            status: statusFilter as
              | "PENDING"
              | "APPROVED"
              | "REJECTED"
              | "CANCELLED",
          }),
        },
      },
    },
  );

  // Fetch extended requests
  const { data: extendedData, isLoading: extendedLoading } = api.useQuery(
    "get",
    "/api/extended-requests/",
    {
      params: {
        query: {
          page,
          pageSize,
          ...(statusFilter !== "all" && {
            status: statusFilter as
              | "PENDING"
              | "APPROVED"
              | "REJECTED"
              | "CANCELLED",
          }),
        },
      },
    },
  );

  const instanceRequests = instanceData?.values || [];
  const extendedRequests = extendedData?.values || [];
  const instanceTotalPages = instanceData?.totalPages || 1;
  const extendedTotalPages = extendedData?.totalPages || 1;

  const isLoading =
    requestType === "instance" ? instanceLoading : extendedLoading;
  const totalPages =
    requestType === "instance" ? instanceTotalPages : extendedTotalPages;

  const canReview = can("REVIEW_REQUEST") || can("REVIEW_EXTENDED_REQUEST");

  const handleInstanceRequestAction = async (
    requestId: number,
    action: "APPROVED" | "REJECTED",
  ) => {
    setActionLoading(requestId);
    try {
      await fetchClinet.PATCH("/api/requests/{requestId}/status", {
        params: { path: { requestId } },
        body: { status: action },
      });
      queryClient.invalidateQueries({ queryKey: ["get", "/api/requests/"] });
    } catch (error) {
      console.error("Failed to update request:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtendedRequestAction = async (
    extendedRequestId: number,
    action: "APPROVED" | "REJECTED",
  ) => {
    setActionLoading(extendedRequestId);
    try {
      await fetchClinet.PATCH(
        "/api/extended-requests/{extendedRequestId}/status",
        {
          params: { path: { extendedRequestId } },
          body: { status: action },
        },
      );
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/extended-requests/"],
      });
    } catch (error) {
      console.error("Failed to update extended request:", error);
    } finally {
      setActionLoading(null);
    }
  };

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
    <Tabs
      value={requestType}
      onValueChange={(v) => {
        setRequestType(v as "instance" | "extended");
        setPage(1);
        setStatusFilter("all");
      }}
    >
      <TabsList>
        <TabsTrigger value="instance">
          <FileText className="mr-1.5 size-4" />
          Instance Requests
        </TabsTrigger>
        <TabsTrigger value="extended">
          <FilePlus className="mr-1.5 size-4" />
          Extended Requests
        </TabsTrigger>
      </TabsList>

      {/* Status Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        {["all", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map(
          (status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
            >
              {status === "all" ? (
                "All"
              ) : (
                <>
                  {status === "PENDING" && (
                    <Clock className="mr-1.5 size-3.5" />
                  )}
                  {status === "APPROVED" && (
                    <CheckCircle className="mr-1.5 size-3.5" />
                  )}
                  {status === "REJECTED" && (
                    <XCircle className="mr-1.5 size-3.5" />
                  )}
                  {status === "CANCELLED" && (
                    <Ban className="mr-1.5 size-3.5" />
                  )}
                  {statusConfig[status as keyof typeof statusConfig].label}
                </>
              )}
            </Button>
          ),
        )}
      </div>

      {/* Search */}
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search requests..." className="pl-9" />
      </div>

      {/* Instance Requests Tab Content */}
      <TabsContent value="instance" className="mt-4">
        {instanceRequests.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No Instance Requests</EmptyTitle>
              <EmptyDescription>
                {isStudent
                  ? "You haven't made any requests yet."
                  : "No requests to review."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {can("CREATE_REQUEST") && (
                <Button asChild>
                  <Link href="/dashboard/requests/new">
                    <Plus className="mr-2 size-4" />
                    Create Request
                  </Link>
                </Button>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          <div className="space-y-4">
            {instanceRequests.map((request) => {
              const StatusIcon = statusConfig[request.status].icon;
              return (
                <Card
                  key={request.id}
                  className="transition-colors hover:border-primary/50"
                >
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
                      {canReview && request.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            disabled={actionLoading === request.id}
                            onClick={() =>
                              handleInstanceRequestAction(
                                request.id,
                                "APPROVED",
                              )
                            }
                          >
                            <CheckCircle className="mr-1.5 size-3.5" />
                            {actionLoading === request.id ? "..." : "Approve"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={actionLoading === request.id}
                            onClick={() =>
                              handleInstanceRequestAction(
                                request.id,
                                "REJECTED",
                              )
                            }
                          >
                            <XCircle className="mr-1.5 size-3.5" />
                            Reject
                          </Button>
                        </div>
                      )}
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
      </TabsContent>

      {/* Extended Requests Tab Content */}
      <TabsContent value="extended" className="mt-4">
        {extendedRequests.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">
              <FilePlus />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No Extension Requests</EmptyTitle>
              <EmptyDescription>
                {isStudent
                  ? "You haven't made any extension requests yet."
                  : "No extension requests to review."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-4">
            {extendedRequests.map((request) => {
              const StatusIcon = statusConfig[request.status].icon;
              return (
                <Card
                  key={request.id}
                  className="transition-colors hover:border-primary/50"
                >
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
                          Instance: #{request.targetInstanceId}
                        </CardDescription>
                      </div>
                      {canReview && request.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            disabled={actionLoading === request.id}
                            onClick={() =>
                              handleExtendedRequestAction(
                                request.id,
                                "APPROVED",
                              )
                            }
                          >
                            <CheckCircle className="mr-1.5 size-3.5" />
                            {actionLoading === request.id ? "..." : "Approve"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={actionLoading === request.id}
                            onClick={() =>
                              handleExtendedRequestAction(
                                request.id,
                                "REJECTED",
                              )
                            }
                          >
                            <XCircle className="mr-1.5 size-3.5" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {request.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {request.description}
                      </p>
                    )}
                    {request.reason && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Reason:
                        </span>{" "}
                        {request.reason}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </TabsContent>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
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
    </Tabs>
  );
}
