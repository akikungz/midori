"use client";

import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, fetchClient } from "@midori/lib/api";
import { hasPermission, type Role } from "@midori/lib/roles";
import { Skeleton } from "@midori/components/ui/skeleton";
import { Tabs, TabsContent } from "@midori/components/ui/tabs";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import { Switch } from "@midori/components/ui/switch";
import { Pagination } from "@midori/components/shared";
import { usePagination } from "@midori/hooks/useCommon";

import {
  InstanceRequestsList,
  ExtendedRequestsList,
  EmptyInstanceRequests,
  EmptyExtendedRequests,
  type InstanceRequestSpecs,
} from "./RequestCard";
import {
  RequestTypeTabs,
  StatusFilter,
  RequestSearch,
  CourseFilter,
  type CourseFilterOption,
} from "./RequestFilters";
import type { components } from "@midori/types/api";

const ITEMS_PER_PAGE = 10;
type InstanceRequestsResponse = components["schemas"]["GetRequestsResponse"];
type ExtendedRequestsResponse =
  components["schemas"]["GetExtendedRequestsResponse"];

interface RequestsClientProps {
  userRole: Role;
  isStudent: boolean;
}

/**
 * Main requests client component
 */
export function RequestsClient({ userRole, isStudent }: RequestsClientProps) {
  const queryClient = useQueryClient();
  const pagination = usePagination(1, ITEMS_PER_PAGE);

  const [requestType, setRequestType] = useState<"instance" | "extended">(
    "instance",
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [actionLoadingIds, setActionLoadingIds] = useState<Set<number>>(
    new Set(),
  );
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<Set<number>>(
    new Set(),
  );
  const [selectedExtendedIds, setSelectedExtendedIds] = useState<Set<number>>(
    new Set(),
  );
  const [isBulkActing, setIsBulkActing] = useState(false);
  const [bulkSpecs, setBulkSpecs] = useState<InstanceRequestSpecs>({
    cpus: 2,
    memoryMB: 4096,
    diskGB: 16,
  });
  const [isBulkSpecModifyEnabled, setIsBulkSpecModifyEnabled] = useState(false);

  // Permission helpers
  const can = useCallback(
    (permission: string) =>
      hasPermission(
        userRole,
        permission as Parameters<typeof hasPermission>[1],
      ),
    [userRole],
  );

  const canReview = can("REVIEW_REQUEST") || can("REVIEW_EXTENDED_REQUEST");
  const canCreateRequest = can("CREATE_REQUEST");

  // Build query params
  const getQueryParams = useCallback(
    () => ({
      page: pagination.page,
      pageSize: ITEMS_PER_PAGE,
      ...(statusFilter !== "all" && {
        status: statusFilter as
          | "PENDING"
          | "APPROVED"
          | "REJECTED"
          | "CANCELLED",
      }),
    }),
    [pagination.page, statusFilter],
  );

  // Fetch instance requests
  const {
    data: instanceData,
    isLoading: instanceLoading,
    refetch: refetchInstance,
    isFetching: instanceFetching,
  } = api.useQuery("get", "/api/requests/", {
    params: {
      query: getQueryParams(),
    },
  }) as {
    data: InstanceRequestsResponse | undefined;
    isLoading: boolean;
    refetch: () => void;
    isFetching: boolean;
  };

  // Fetch extended requests
  const {
    data: extendedData,
    isLoading: extendedLoading,
    refetch: refetchExtended,
    isFetching: extendedFetching,
  } = api.useQuery("get", "/api/extended-requests/", {
    params: {
      query: getQueryParams(),
    },
  }) as {
    data: ExtendedRequestsResponse | undefined;
    isLoading: boolean;
    refetch: () => void;
    isFetching: boolean;
  };

  const instanceRequests = instanceData?.values || [];
  const extendedRequests = extendedData?.values || [];
  const instanceTotalPages = instanceData?.totalPages || 1;
  const extendedTotalPages = extendedData?.totalPages || 1;

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const instanceCourseOptions = useMemo(() => {
    const courseMap = new Map<string, CourseFilterOption>();

    for (const request of instanceRequests) {
      const courseCode = request.courseOffering?.courseCode;
      if (!courseCode) {
        continue;
      }

      courseMap.set(courseCode, {
        code: courseCode,
        name: request.courseOffering?.courseTitle,
      });
    }

    return Array.from(courseMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code),
    );
  }, [instanceRequests]);

  const extendedCourseOptions = useMemo(() => {
    const courseMap = new Map<string, CourseFilterOption>();

    for (const request of extendedRequests) {
      const courseCode = request.courseOffering?.courseCode;
      if (!courseCode) {
        continue;
      }

      courseMap.set(courseCode, {
        code: courseCode,
        name: request.courseOffering?.courseTitle,
      });
    }

    return Array.from(courseMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code),
    );
  }, [extendedRequests]);

  const activeCourseOptions =
    requestType === "instance" ? instanceCourseOptions : extendedCourseOptions;

  const normalizedCourseFilter = courseFilter.trim().toLowerCase();

  const filteredInstanceRequests = useMemo(() => {
    return instanceRequests.filter((request) => {
      const matchesCourse =
        courseFilter === "all" ||
        request.courseOffering?.courseCode?.toLowerCase() ===
          normalizedCourseFilter;

      if (!matchesCourse) {
        return false;
      }

      if (!normalizedSearchTerm) {
        return true;
      }

      const searchableText = [
        request.title,
        request.description,
        request.templateName,
        request.courseOffering?.courseCode,
        request.courseOffering?.semester,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearchTerm);
    });
  }, [
    courseFilter,
    instanceRequests,
    normalizedCourseFilter,
    normalizedSearchTerm,
  ]);

  const filteredExtendedRequests = useMemo(() => {
    return extendedRequests.filter((request) => {
      const matchesCourse =
        courseFilter === "all" ||
        request.courseOffering?.courseCode?.toLowerCase() ===
          normalizedCourseFilter;

      if (!matchesCourse) {
        return false;
      }

      if (!normalizedSearchTerm) {
        return true;
      }

      const searchableText = [
        request.title,
        request.description,
        request.reason,
        `#${request.targetInstanceId}`,
        request.courseOffering?.courseCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearchTerm);
    });
  }, [
    courseFilter,
    extendedRequests,
    normalizedCourseFilter,
    normalizedSearchTerm,
  ]);

  const isLoading =
    requestType === "instance" ? instanceLoading : extendedLoading;
  const isFetching =
    requestType === "instance" ? instanceFetching : extendedFetching;
  const filtersDisabled = isLoading || isFetching;
  const refetch =
    requestType === "instance" ? refetchInstance : refetchExtended;
  const totalPages =
    requestType === "instance" ? instanceTotalPages : extendedTotalPages;

  const selectedIds =
    requestType === "instance" ? selectedInstanceIds : selectedExtendedIds;
  const currentRequests =
    requestType === "instance"
      ? filteredInstanceRequests
      : filteredExtendedRequests;
  const pendingRequestIds = currentRequests
    .filter((request) => request.status === "PENDING")
    .map((request) => request.id);
  const allPendingSelected =
    pendingRequestIds.length > 0 &&
    pendingRequestIds.every((requestId) => selectedIds.has(requestId));
  const showBulkSpecEditor =
    requestType === "instance" && selectedInstanceIds.size > 0;

  const withActionLoading = useCallback(
    (requestId: number, active: boolean) => {
      setActionLoadingIds((previous) => {
        const next = new Set(previous);
        if (active) {
          next.add(requestId);
        } else {
          next.delete(requestId);
        }
        return next;
      });
    },
    [],
  );

  const toggleInstanceSelection = useCallback((requestId: number) => {
    setSelectedInstanceIds((previous) => {
      const next = new Set(previous);
      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
      }
      return next;
    });
  }, []);

  const toggleExtendedSelection = useCallback((requestId: number) => {
    setSelectedExtendedIds((previous) => {
      const next = new Set(previous);
      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
      }
      return next;
    });
  }, []);

  const selectAllPending = useCallback(() => {
    const ids = new Set(pendingRequestIds);
    if (requestType === "instance") {
      setSelectedInstanceIds(ids);
      return;
    }

    setSelectedExtendedIds(ids);
  }, [pendingRequestIds, requestType]);

  const clearSelection = useCallback(() => {
    if (requestType === "instance") {
      setSelectedInstanceIds(new Set());
      return;
    }

    setSelectedExtendedIds(new Set());
  }, [requestType]);

  const handleBulkSpecChange = useCallback(
    (field: keyof InstanceRequestSpecs, value: number) => {
      if (!Number.isFinite(value)) {
        return;
      }

      const normalizedValue =
        field === "memoryMB"
          ? Math.max(1024, value)
          : field === "diskGB"
            ? Math.max(16, value)
            : Math.max(1, value);

      setBulkSpecs((previous) => ({
        ...previous,
        [field]: normalizedValue,
      }));
    },
    [],
  );

  // Handle request type change
  const handleRequestTypeChange = useCallback(
    (type: "instance" | "extended") => {
      setRequestType(type);
      pagination.setPage(1);
      setStatusFilter("all");
      setCourseFilter("all");
    },
    [pagination],
  );

  // Handle status filter change
  const handleStatusChange = useCallback(
    (status: string) => {
      setStatusFilter(status);
      pagination.setPage(1);
    },
    [pagination],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      pagination.setPage(1);
    },
    [pagination],
  );

  const handleCourseFilterChange = useCallback(
    (value: string) => {
      setCourseFilter(value);
      pagination.setPage(1);
    },
    [pagination],
  );

  // Instance request actions
  const handleInstanceRequestAction = useCallback(
    async (
      requestId: number,
      action: "APPROVED" | "REJECTED",
      specs?: InstanceRequestSpecs,
    ) => {
      withActionLoading(requestId, true);
      const body = {
        status: action,
        ...(specs
          ? {
              cpus: specs.cpus,
              memoryMB: specs.memoryMB,
              diskGB: specs.diskGB,
            }
          : {}),
      };

      const result = await fetchClient
        .PATCH("/api/requests/{requestId}/status", {
          params: { path: { requestId } },
          body: body as never,
        })
        .catch((error) => {
          console.error("Failed to update request:", error);
          toast.error("Failed to update request");
          return null;
        });

      withActionLoading(requestId, false);

      if (!result || result.error) {
        return;
      }

      setSelectedInstanceIds((previous) => {
        const next = new Set(previous);
        next.delete(requestId);
        return next;
      });

      toast.success(`Request #${requestId} ${action.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ["get", "/api/requests/"] });
    },
    [queryClient, withActionLoading],
  );

  // Extended request actions
  const handleExtendedRequestAction = useCallback(
    async (extendedRequestId: number, action: "APPROVED" | "REJECTED") => {
      withActionLoading(extendedRequestId, true);
      const result = await fetchClient
        .PATCH("/api/extended-requests/{extendedRequestId}/status", {
          params: { path: { extendedRequestId } },
          body: { status: action },
        })
        .catch((error) => {
          console.error("Failed to update extended request:", error);
          toast.error("Failed to update extended request");
          return null;
        });

      withActionLoading(extendedRequestId, false);

      if (!result || result.error) {
        return;
      }

      setSelectedExtendedIds((previous) => {
        const next = new Set(previous);
        next.delete(extendedRequestId);
        return next;
      });

      toast.success(
        `Extended request #${extendedRequestId} ${action.toLowerCase()}`,
      );
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/extended-requests/"],
      });
    },
    [queryClient, withActionLoading],
  );

  const handleBulkAction = useCallback(
    async (action: "APPROVED" | "REJECTED") => {
      const requestIds = Array.from(selectedIds);
      if (requestIds.length === 0) {
        return;
      }

      setIsBulkActing(true);
      const results = await Promise.allSettled(
        requestIds.map((requestId) => {
          if (requestType === "instance") {
            const instanceBody = {
              status: action,
              ...(action === "APPROVED" && isBulkSpecModifyEnabled
                ? bulkSpecs
                : {}),
            };

            return fetchClient.PATCH("/api/requests/{requestId}/status", {
              params: { path: { requestId } },
              body: instanceBody as never,
            });
          }

          return fetchClient.PATCH(
            "/api/extended-requests/{extendedRequestId}/status",
            {
              params: { path: { extendedRequestId: requestId } },
              body: { status: action },
            },
          );
        }),
      );

      setIsBulkActing(false);

      const successCount = results.filter(
        (result) => result.status === "fulfilled" && !result.value.error,
      ).length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} requests ${action.toLowerCase()}`);
      }

      if (failedCount > 0) {
        toast.error(`${failedCount} requests failed to update`);
      }

      if (requestType === "instance") {
        setSelectedInstanceIds(new Set());
        queryClient.invalidateQueries({
          queryKey: ["get", "/api/requests/"],
        });
      } else {
        setSelectedExtendedIds(new Set());
        queryClient.invalidateQueries({
          queryKey: ["get", "/api/extended-requests/"],
        });
      }
    },
    [bulkSpecs, isBulkSpecModifyEnabled, queryClient, requestType, selectedIds],
  );

  return (
    <Tabs
      value={requestType}
      onValueChange={handleRequestTypeChange as (v: string) => void}
    >
      <RequestTypeTabs
        value={requestType}
        onValueChange={handleRequestTypeChange}
      />

      {/* Filters */}
      <div className="mt-4 space-y-4">
        <StatusFilter
          value={statusFilter}
          onChange={handleStatusChange}
          disabled={filtersDisabled}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <CourseFilter
            value={courseFilter}
            options={activeCourseOptions}
            onChange={handleCourseFilterChange}
            disabled={filtersDisabled}
          />
          <div className="flex-1">
            <RequestSearch
              value={searchTerm}
              onChange={handleSearchChange}
              onRefresh={refetch}
              isRefreshing={isFetching}
              disabled={filtersDisabled}
            />
          </div>
        </div>
        {canReview && currentRequests.length > 0 ? (
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedIds.size > 0
                  ? `${selectedIds.size} selected`
                  : "Select pending requests to run bulk actions"}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={
                    allPendingSelected ? clearSelection : selectAllPending
                  }
                  disabled={pendingRequestIds.length === 0 || isBulkActing}
                >
                  {allPendingSelected ? "Clear all" : "Select all pending"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  disabled={selectedIds.size === 0 || isBulkActing}
                >
                  Clear selected
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleBulkAction("APPROVED")}
                  disabled={selectedIds.size === 0 || isBulkActing}
                >
                  {isBulkActing ? "Processing..." : "Approve selected"}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction("REJECTED")}
                  disabled={selectedIds.size === 0 || isBulkActing}
                >
                  {isBulkActing ? "Processing..." : "Reject selected"}
                </Button>
              </div>
            </div>

            {showBulkSpecEditor ? (
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                  <label
                    htmlFor="bulk-spec-modify-toggle"
                    className="text-sm font-medium"
                  >
                    Modify specs for selected requests
                  </label>
                  <Switch
                    id="bulk-spec-modify-toggle"
                    checked={isBulkSpecModifyEnabled}
                    onCheckedChange={setIsBulkSpecModifyEnabled}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label htmlFor="bulk-spec-cpus" className="space-y-1 text-sm">
                    <span className="text-muted-foreground">Bulk vCPU</span>
                    <Input
                      id="bulk-spec-cpus"
                      type="number"
                      min={1}
                      value={bulkSpecs.cpus}
                      disabled={!isBulkSpecModifyEnabled}
                      onChange={(event) =>
                        handleBulkSpecChange("cpus", Number(event.target.value))
                      }
                    />
                  </label>

                  <label
                    htmlFor="bulk-spec-memory"
                    className="space-y-1 text-sm"
                  >
                    <span className="text-muted-foreground">
                      Bulk Memory (MB)
                    </span>
                    <Input
                      id="bulk-spec-memory"
                      type="number"
                      min={1024}
                      step={512}
                      value={bulkSpecs.memoryMB}
                      disabled={!isBulkSpecModifyEnabled}
                      onChange={(event) =>
                        handleBulkSpecChange(
                          "memoryMB",
                          Number(event.target.value),
                        )
                      }
                    />
                  </label>

                  <label htmlFor="bulk-spec-disk" className="space-y-1 text-sm">
                    <span className="text-muted-foreground">
                      Bulk Disk (GB)
                    </span>
                    <Input
                      id="bulk-spec-disk"
                      type="number"
                      min={16}
                      step={1}
                      value={bulkSpecs.diskGB}
                      disabled={!isBulkSpecModifyEnabled}
                      onChange={(event) =>
                        handleBulkSpecChange(
                          "diskGB",
                          Number(event.target.value),
                        )
                      }
                    />
                  </label>
                </div>

                <p className="text-xs text-muted-foreground">
                  {isBulkSpecModifyEnabled
                    ? "Bulk approve will apply these specs to all selected instance requests."
                    : "Bulk approve will keep each request's original specs."}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <RequestsLoadingState isLoading={isLoading}>
        {/* Instance Requests Tab Content */}
        <TabsContent value="instance" className="mt-4">
          {instanceRequests.length === 0 ? (
            <EmptyInstanceRequests
              isStudent={isStudent}
              canCreateRequest={canCreateRequest}
            />
          ) : filteredInstanceRequests.length === 0 ? (
            <NoMatchingRequests query={searchTerm} />
          ) : (
            <InstanceRequestsList
              requests={filteredInstanceRequests}
              canReview={canReview}
              actionLoadingIds={actionLoadingIds}
              selectedRequestIds={selectedInstanceIds}
              onToggleSelect={toggleInstanceSelection}
              onAction={handleInstanceRequestAction}
            />
          )}
        </TabsContent>

        {/* Extended Requests Tab Content */}
        <TabsContent value="extended" className="mt-4">
          {extendedRequests.length === 0 ? (
            <EmptyExtendedRequests isStudent={isStudent} />
          ) : filteredExtendedRequests.length === 0 ? (
            <NoMatchingRequests query={searchTerm} />
          ) : (
            <ExtendedRequestsList
              requests={filteredExtendedRequests}
              canReview={canReview}
              actionLoadingIds={actionLoadingIds}
              selectedRequestIds={selectedExtendedIds}
              onToggleSelect={toggleExtendedSelection}
              onAction={handleExtendedRequestAction}
            />
          )}
        </TabsContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              page={pagination.page}
              totalPages={totalPages}
              onPageChange={pagination.setPage}
            />
          </div>
        )}
      </RequestsLoadingState>
    </Tabs>
  );
}

// ==================== Loading State ====================
interface RequestsLoadingStateProps {
  children?: React.ReactNode;
  isLoading?: boolean;
}

function RequestsLoadingState({
  children,
  isLoading,
}: RequestsLoadingStateProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

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

function NoMatchingRequests({ query }: { query: string }) {
  return (
    <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
      No requests match “{query.trim()}”. Try another search keyword.
    </div>
  );
}

export default RequestsClient;
