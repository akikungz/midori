"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, Search, Filter, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, fetchClient, getApiErrorMessage } from "@midori/lib/api";
import { hasPermission, type Role } from "@midori/lib/roles";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import { Skeleton } from "@midori/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midori/components/ui/select";
import { Pagination } from "@midori/components/shared";
import { usePagination, useSubmitState } from "@midori/hooks/useCommon";

import { InstancesGrid, EmptyInstances, type Instance } from "./InstanceCard";
import { CreateInstanceDialog } from "./InstanceDialogs";

const ITEMS_PER_PAGE = 10;

interface InstancesClientProps {
  userRole: Role;
  listScope?: "self" | "admin";
}

interface InstancesResponse {
  values: Instance[];
  totalPages: number;
}

/**
 * Main instances list client component
 */
export function InstancesClient({
  userRole,
  listScope = "self",
}: InstancesClientProps) {
  const queryClient = useQueryClient();
  const pagination = usePagination(1, ITEMS_PER_PAGE);
  const submitState = useSubmitState();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "ACTIVE" | "PENDING" | "PROMOTED" | "INACTIVE" | "DELETED"
  >("all");
  const isAdminScope = listScope === "admin";

  // Permission helpers
  const can = useCallback(
    (permission: string) =>
      hasPermission(
        userRole,
        permission as Parameters<typeof hasPermission>[1],
      ),
    [userRole],
  );

  const canCreateInstance = !isAdminScope && can("CREATE_INSTANCE");
  const canCreateRequest = !isAdminScope && can("CREATE_REQUEST");
  const canPromote = can("PROMOTE_INSTANCE");
  const canDelete = can("DELETE_INSTANCE");

  // Data fetching
  const selfInstancesQuery = api.useQuery(
    "get",
    "/api/instances/",
    {
      params: {
        query: { page: pagination.page, pageSize: ITEMS_PER_PAGE },
      },
    },
    {
      enabled: !isAdminScope,
    },
  ) as {
    data: InstancesResponse | undefined;
    isLoading: boolean;
    refetch: () => void;
    isFetching: boolean;
  };

  const adminInstancesQuery = api.useQuery(
    "get",
    "/api/instances/admin",
    {
      params: {
        query: { page: pagination.page, pageSize: ITEMS_PER_PAGE },
      },
    },
    {
      enabled: isAdminScope,
    },
  ) as {
    data: InstancesResponse | undefined;
    isLoading: boolean;
    refetch: () => void;
    isFetching: boolean;
  };

  const { data, isLoading, refetch, isFetching } = isAdminScope
    ? adminInstancesQuery
    : selfInstancesQuery;

  const listQueryKey = isAdminScope
    ? (["get", "/api/instances/admin"] as const)
    : (["get", "/api/instances/"] as const);

  const instances = data?.values || [];
  const totalPages = data?.totalPages || 1;

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredInstances = useMemo(() => {
    return instances.filter((instance) => {
      const matchesStatus =
        statusFilter === "all" || instance.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearchTerm) {
        return true;
      }

      const searchableText = [
        String(instance.id),
        instance.status,
        instance.vmDetails?.hostname,
        instance.vmDetails?.ip,
        instance.vmDetails?.os,
        instance.courseOffering?.courseCode,
        instance.courseOffering?.courseTitle,
        instance.courseOffering?.semester,
        instance.owner?.name,
        instance.owner?.email,
        instance.user?.name,
        instance.user?.email,
        instance.requester?.name,
        instance.requester?.email,
        instance.instructor?.name,
        instance.instructor?.email,
        instance.ownerName,
        instance.ownerEmail,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearchTerm);
    });
  }, [instances, normalizedSearchTerm, statusFilter]);

  // Create instance handler
  const handleCreateInstance = useCallback(
    async (formData: {
      pveTemplateId: number;
      cpus: number;
      memoryGB: number;
      diskGB: number;
      courseOfferingId?: number;
    }) => {
      submitState.startSubmit();
      const result = await fetchClient
        .POST("/api/instances/", {
          body: {
            pveTemplateId: formData.pveTemplateId,
            courseOfferingId: formData.courseOfferingId,
            cpus: formData.cpus,
            memoryMB: formData.memoryGB * 1024,
            diskGB: formData.diskGB,
          },
        })
        .catch((error) => {
          console.error("Failed to create instance:", error);
          toast.error(getApiErrorMessage(error) ?? "Failed to create instance");
          return null;
        });

      submitState.endSubmit();

      if (!result) {
        return;
      }

      const resultError = (result as { error?: unknown }).error;
      if (resultError) {
        toast.error(
          getApiErrorMessage(resultError) ?? "Failed to create instance",
        );
        return;
      }

      queryClient.invalidateQueries({
        queryKey: listQueryKey,
      });
      setIsCreateDialogOpen(false);
      toast.success("Instance created successfully");
    },
    [queryClient, submitState, listQueryKey],
  );

  // Re-provision instance handler
  const handleReprovision = useCallback(
    async (instanceId: number) => {
      try {
        const { error } = await fetchClient.POST(
          "/api/instances/{instanceId}/reprovision",
          {
            params: {
              path: { instanceId },
            },
          },
        );

        if (error) {
          toast.error(
            getApiErrorMessage(error) ?? "Failed to re-provision instance",
          );
          return;
        }

        toast.success("Re-provision started");
        queryClient.invalidateQueries({
          queryKey: listQueryKey,
        });
      } catch (error) {
        console.error("Failed to re-provision instance:", error);
        toast.error(
          getApiErrorMessage(error) ?? "Failed to re-provision instance",
        );
      }
    },
    [queryClient, listQueryKey],
  );

  const handlePromote = useCallback(
    async (instanceId: number) => {
      try {
        const { error } = await fetchClient.PATCH(
          "/api/instances/{instanceId}/promote",
          {
            params: {
              path: { instanceId },
            },
          },
        );

        if (error) {
          toast.error(getApiErrorMessage(error) ?? "Failed to promote instance");
          return;
        }

        toast.success("Instance promoted successfully");
        queryClient.invalidateQueries({
          queryKey: listQueryKey,
        });
      } catch (error) {
        console.error("Failed to promote instance:", error);
        toast.error(getApiErrorMessage(error) ?? "Failed to promote instance");
      }
    },
    [queryClient, listQueryKey],
  );

  const handleDelete = useCallback(
    async (instanceId: number) => {
      try {
        const { error } = await fetchClient.DELETE(
          "/api/instances/{instanceId}",
          {
            params: {
              path: { instanceId },
            },
          },
        );

        if (error) {
          toast.error(getApiErrorMessage(error) ?? "Failed to delete instance");
          return;
        }

        toast.success("Instance deleted successfully");
        queryClient.invalidateQueries({
          queryKey: listQueryKey,
        });
      } catch (error) {
        console.error("Failed to delete instance:", error);
        toast.error(getApiErrorMessage(error) ?? "Failed to delete instance");
      }
    },
    [queryClient, listQueryKey],
  );

  return (
    <>
      {/* Filters */}
      <InstanceFilters
        canCreateInstance={canCreateInstance}
        onCreateClick={() => setIsCreateDialogOpen(true)}
        onRefresh={refetch}
        isRefreshing={isFetching}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        isDisabled={false}
        onStatusFilterChange={(value) =>
          setStatusFilter(
            value as
              | "all"
              | "ACTIVE"
              | "PENDING"
              | "PROMOTED"
              | "INACTIVE"
              | "DELETED",
          )
        }
      />

      {/* Instances Grid */}
      {isLoading ? (
        <InstancesLoadingState />
      ) : instances.length === 0 ? (
        <EmptyInstances
          canCreateInstance={canCreateInstance}
          canCreateRequest={canCreateRequest}
          onCreateInstance={() => setIsCreateDialogOpen(true)}
        />
      ) : filteredInstances.length === 0 ? (
        <NoMatchingInstances
          searchTerm={searchTerm}
          statusFilter={statusFilter}
        />
      ) : (
        <InstancesGrid
          instances={filteredInstances}
          showOwner={isAdminScope}
          canPromote={canPromote}
          canDelete={canDelete}
          onReprovision={handleReprovision}
          onPromote={handlePromote}
          onDelete={handleDelete}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={totalPages}
          onPageChange={pagination.setPage}
        />
      )}

      {/* Create Instance Dialog */}
      {canCreateInstance && (
        <CreateInstanceDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          userRole={userRole}
          onSubmit={handleCreateInstance}
          isSubmitting={submitState.isSubmitting}
        />
      )}
    </>
  );
}

// ==================== Filter Bar ====================

interface InstanceFiltersProps {
  canCreateInstance: boolean;
  onCreateClick: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isDisabled: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter:
    | "all"
    | "ACTIVE"
    | "PENDING"
    | "PROMOTED"
    | "INACTIVE"
    | "DELETED";
  onStatusFilterChange: (value: string) => void;
}

function InstanceFilters({
  canCreateInstance,
  onCreateClick,
  onRefresh,
  isRefreshing,
  isDisabled,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: InstanceFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by ID, hostname, IP, course..."
          className="pl-9"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          disabled={isDisabled}
        />
      </div>
      <Select
        value={statusFilter}
        onValueChange={onStatusFilterChange}
        disabled={isDisabled}
      >
        <SelectTrigger className="w-full sm:w-45">
          <Filter className="mr-2 size-4" />
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="PROMOTED">Promoted</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
          <SelectItem value="DELETED">Deleted</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isRefreshing || isDisabled}
      >
        <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
        <span className="sr-only">Refresh</span>
      </Button>
      {canCreateInstance && (
        <Button onClick={onCreateClick} disabled={isDisabled}>
          <Plus className="mr-2 size-4" />
          Create Instance
        </Button>
      )}
    </div>
  );
}

function NoMatchingInstances({
  searchTerm,
  statusFilter,
}: {
  searchTerm: string;
  statusFilter: string;
}) {
  const hasSearch = searchTerm.trim().length > 0;
  const hasStatusFilter = statusFilter !== "all";

  return (
    <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
      No instances match the current filters
      {hasSearch ? ` (search: "${searchTerm.trim()}")` : ""}
      {hasSearch && hasStatusFilter ? " and " : ""}
      {hasStatusFilter ? `status: ${statusFilter}` : ""}.
    </div>
  );
}

// ==================== Loading State ====================

function InstancesLoadingState() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

export default InstancesClient;
