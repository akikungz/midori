"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { api, fetchClient } from "@midori/lib/api";
import { hasPermission, type Role } from "@midori/lib/roles";
import { Skeleton } from "@midori/components/ui/skeleton";
import { Tabs, TabsContent } from "@midori/components/ui/tabs";
import { Pagination } from "@midori/components/shared";
import { usePagination } from "@midori/hooks/useCommon";

import {
  InstanceRequestsList,
  ExtendedRequestsList,
  EmptyInstanceRequests,
  EmptyExtendedRequests,
  type InstanceRequest,
  type ExtendedRequest,
} from "./RequestCard";
import { RequestTypeTabs, StatusFilter, RequestSearch } from "./RequestFilters";

const ITEMS_PER_PAGE = 10;

interface RequestsClientProps {
  userRole: Role;
  isStudent: boolean;
}

interface RequestsResponse<T> {
  values: T[];
  totalPages: number;
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
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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
    data: RequestsResponse<InstanceRequest> | undefined;
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
    data: RequestsResponse<ExtendedRequest> | undefined;
    isLoading: boolean;
    refetch: () => void;
    isFetching: boolean;
  };

  const instanceRequests = instanceData?.values || [];
  const extendedRequests = extendedData?.values || [];
  const instanceTotalPages = instanceData?.totalPages || 1;
  const extendedTotalPages = extendedData?.totalPages || 1;

  const isLoading =
    requestType === "instance" ? instanceLoading : extendedLoading;
  const isFetching =
    requestType === "instance" ? instanceFetching : extendedFetching;
  const refetch =
    requestType === "instance" ? refetchInstance : refetchExtended;
  const totalPages =
    requestType === "instance" ? instanceTotalPages : extendedTotalPages;

  // Handle request type change
  const handleRequestTypeChange = useCallback(
    (type: "instance" | "extended") => {
      setRequestType(type);
      pagination.setPage(1);
      setStatusFilter("all");
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

  // Instance request actions
  const handleInstanceRequestAction = useCallback(
    async (requestId: number, action: "APPROVED" | "REJECTED") => {
      setActionLoading(requestId);
      try {
        await fetchClient.PATCH("/api/requests/{requestId}/status", {
          params: { path: { requestId } },
          body: { status: action },
        });
        queryClient.invalidateQueries({ queryKey: ["get", "/api/requests/"] });
      } catch (error) {
        console.error("Failed to update request:", error);
      } finally {
        setActionLoading(null);
      }
    },
    [queryClient],
  );

  // Extended request actions
  const handleExtendedRequestAction = useCallback(
    async (extendedRequestId: number, action: "APPROVED" | "REJECTED") => {
      setActionLoading(extendedRequestId);
      try {
        await fetchClient.PATCH(
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
    },
    [queryClient],
  );

  if (isLoading) {
    return <RequestsLoadingState />;
  }

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
        <StatusFilter value={statusFilter} onChange={handleStatusChange} />
        <RequestSearch onRefresh={refetch} isRefreshing={isFetching} />
      </div>

      {/* Instance Requests Tab Content */}
      <TabsContent value="instance" className="mt-4">
        {instanceRequests.length === 0 ? (
          <EmptyInstanceRequests
            isStudent={isStudent}
            canCreateRequest={canCreateRequest}
          />
        ) : (
          <InstanceRequestsList
            requests={instanceRequests}
            canReview={canReview}
            actionLoadingId={actionLoading}
            onAction={handleInstanceRequestAction}
          />
        )}
      </TabsContent>

      {/* Extended Requests Tab Content */}
      <TabsContent value="extended" className="mt-4">
        {extendedRequests.length === 0 ? (
          <EmptyExtendedRequests isStudent={isStudent} />
        ) : (
          <ExtendedRequestsList
            requests={extendedRequests}
            canReview={canReview}
            actionLoadingId={actionLoading}
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
    </Tabs>
  );
}

// ==================== Loading State ====================

function RequestsLoadingState() {
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

export default RequestsClient;
