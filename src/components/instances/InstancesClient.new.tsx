"use client";

import { useState, useCallback } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { api, fetchClinet } from "@midori/lib/api";
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
}

interface InstancesResponse {
  values: Instance[];
  totalPages: number;
}

/**
 * Main instances list client component
 */
export function InstancesClient({ userRole }: InstancesClientProps) {
  const queryClient = useQueryClient();
  const pagination = usePagination(1, ITEMS_PER_PAGE);
  const submitState = useSubmitState();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Permission helpers
  const can = useCallback(
    (permission: string) =>
      hasPermission(
        userRole,
        permission as Parameters<typeof hasPermission>[1],
      ),
    [userRole],
  );

  const canCreateInstance = can("CREATE_INSTANCE");
  const canCreateRequest = can("CREATE_REQUEST");
  const canPromote = can("PROMOTE_INSTANCE");
  const canDelete = can("DELETE_INSTANCE");

  // Data fetching
  const { data, isLoading } = api.useQuery("get", "/api/instances/", {
    params: {
      query: { page: pagination.page, pageSize: ITEMS_PER_PAGE },
    },
  }) as { data: InstancesResponse | undefined; isLoading: boolean };

  const instances = data?.values || [];
  const totalPages = data?.totalPages || 1;

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
      try {
        await fetchClinet.POST("/api/instances/", {
          body: {
            pveTemplateId: formData.pveTemplateId,
            courseOfferingId: formData.courseOfferingId,
            cpus: formData.cpus,
            memoryMB: formData.memoryGB * 1024,
            diskGB: formData.diskGB,
          },
        });
        queryClient.invalidateQueries({
          queryKey: ["get", "/api/instances/"],
        });
        setIsCreateDialogOpen(false);
      } catch (error) {
        console.error("Failed to create instance:", error);
      } finally {
        submitState.endSubmit();
      }
    },
    [queryClient, submitState],
  );

  // Re-provision instance handler
  const handleReprovision = useCallback(
    async (instanceId: number) => {
      try {
        await fetchClinet.POST("/api/instances/{instanceId}/reprovision", {
          params: {
            path: { instanceId },
          },
        });
        queryClient.invalidateQueries({
          queryKey: ["get", "/api/instances/"],
        });
      } catch (error) {
        console.error("Failed to re-provision instance:", error);
      }
    },
    [queryClient],
  );

  const handlePromote = useCallback(
    async (instanceId: number) => {
      try {
        await fetchClinet.PATCH("/api/instances/{instanceId}/promote", {
          params: {
            path: { instanceId },
          },
        });
        queryClient.invalidateQueries({
          queryKey: ["get", "/api/instances/"],
        });
      } catch (error) {
        console.error("Failed to promote instance:", error);
      }
    },
    [queryClient],
  );

  const handleDelete = useCallback(
    async (instanceId: number) => {
      try {
        await fetchClinet.DELETE("/api/instances/{instanceId}", {
          params: {
            path: { instanceId },
          },
        });
        queryClient.invalidateQueries({
          queryKey: ["get", "/api/instances/"],
        });
      } catch (error) {
        console.error("Failed to delete instance:", error);
      }
    },
    [queryClient],
  );

  if (isLoading) {
    return <InstancesLoadingState />;
  }

  return (
    <>
      {/* Filters */}
      <InstanceFilters
        canCreateInstance={canCreateInstance}
        onCreateClick={() => setIsCreateDialogOpen(true)}
      />

      {/* Instances Grid */}
      {instances.length === 0 ? (
        <EmptyInstances
          canCreateInstance={canCreateInstance}
          canCreateRequest={canCreateRequest}
          onCreateInstance={() => setIsCreateDialogOpen(true)}
        />
      ) : (
        <InstancesGrid
          instances={instances}
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
      <CreateInstanceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateInstance}
        isSubmitting={submitState.isSubmitting}
      />
    </>
  );
}

// ==================== Filter Bar ====================

interface InstanceFiltersProps {
  canCreateInstance: boolean;
  onCreateClick: () => void;
}

function InstanceFilters({
  canCreateInstance,
  onCreateClick,
}: InstanceFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search instances..." className="pl-9" />
      </div>
      <Select defaultValue="all">
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
        </SelectContent>
      </Select>
      {canCreateInstance && (
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 size-4" />
          Create Instance
        </Button>
      )}
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
