"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Server, ArrowUpCircle } from "lucide-react";

import { api, fetchClinet } from "@midori/lib/api";
import { hasPermission, type Role } from "@midori/lib/roles";
import { Button } from "@midori/components/ui/button";
import { Badge } from "@midori/components/ui/badge";
import { Skeleton } from "@midori/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@midori/components/ui/tabs";
import { useSubmitState } from "@midori/hooks/useCommon";

import type { VmDetails, CourseOffering } from "./InstanceCard";
import { VmDetailsCard, CourseInfoCard } from "./InstanceDetails";
import {
  ExtensionRequestDialog,
  DeleteInstanceDialog,
  ReverseProxyList,
  AuditLogList,
  type ReverseProxy,
  type AuditLog,
} from "./InstanceDialogs";

const statusColors = {
  PENDING: "secondary",
  ACTIVE: "default",
  PROMOTED: "destructive",
  INACTIVE: "outline",
  DELETED: "outline",
} as const;

interface InstanceData {
  id: number;
  status: keyof typeof statusColors;
  vmDetails?: VmDetails;
  courseOffering?: CourseOffering;
}

interface InstanceDetailClientProps {
  instanceId: number;
  userRole: Role;
}

/**
 * Instance detail page client component
 */
export function InstanceDetailClient({
  instanceId,
  userRole,
}: InstanceDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const submitState = useSubmitState();

  const [isExtensionDialogOpen, setIsExtensionDialogOpen] = useState(false);
  const [isProxyDialogOpen, setIsProxyDialogOpen] = useState(false);

  // Permission helpers
  const can = useCallback(
    (permission: string) =>
      hasPermission(
        userRole,
        permission as Parameters<typeof hasPermission>[1],
      ),
    [userRole],
  );

  // Queries
  const { data: instance, isLoading } = api.useQuery(
    "get",
    "/api/instances/{instanceId}",
    {
      params: {
        path: { instanceId },
      },
    },
  ) as { data: InstanceData | undefined; isLoading: boolean };

  const { data: reverseProxies } = api.useQuery(
    "get",
    "/api/instances/{instanceId}/reverse-proxies",
    {
      params: {
        path: { instanceId },
      },
    },
  ) as { data: ReverseProxy[] | undefined };

  const { data: auditLogs } = api.useQuery(
    "get",
    "/api/instances/{instanceId}/audit-logs",
    {
      params: {
        path: { instanceId },
        query: { page: 1, pageSize: 20 },
      },
    },
  ) as { data: { values: AuditLog[] } | undefined };

  const logs = auditLogs?.values || [];

  // Handlers
  const handlePromote = useCallback(async () => {
    submitState.startSubmit();
    try {
      await fetchClinet.PATCH("/api/instances/{instanceId}/promote", {
        params: { path: { instanceId } },
      });
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/instances/{instanceId}"],
      });
    } catch (error) {
      console.error("Failed to promote instance:", error);
    } finally {
      submitState.endSubmit();
    }
  }, [instanceId, queryClient, submitState]);

  const handleDelete = useCallback(async () => {
    try {
      await fetchClinet.DELETE("/api/instances/{instanceId}", {
        params: { path: { instanceId } },
      });
      router.push("/dashboard/instances");
    } catch (error) {
      console.error("Failed to delete instance:", error);
    }
  }, [instanceId, router]);

  const handleSubmitExtension = useCallback(
    async (days: number, reason: string) => {
      submitState.startSubmit();
      try {
        await fetchClinet.POST("/api/instances/{instanceId}/extended-request", {
          params: { path: { instanceId } },
          body: {
            title: `Extension Request - ${days} days`,
            description: reason,
          },
        });
        setIsExtensionDialogOpen(false);
      } catch (error) {
        console.error("Failed to submit extension request:", error);
      } finally {
        submitState.endSubmit();
      }
    },
    [instanceId, submitState],
  );

  const handleAddProxy = useCallback(
    async (data: {
      port: number;
      type: "HTTP" | "HTTPS";
      description?: string;
    }) => {
      submitState.startSubmit();
      try {
        await fetchClinet.POST("/api/instances/{instanceId}/reverse-proxies", {
          params: { path: { instanceId } },
          body: {
            targetPort: data.port,
            type: data.type,
            description: data.description,
          },
        });
        queryClient.invalidateQueries({
          queryKey: ["get", "/api/instances/{instanceId}/reverse-proxies"],
        });
        setIsProxyDialogOpen(false);
      } catch (error) {
        console.error("Failed to add proxy:", error);
      } finally {
        submitState.endSubmit();
      }
    },
    [instanceId, queryClient, submitState],
  );

  const handleDeleteProxy = useCallback(
    async (proxyId: number) => {
      try {
        await fetchClinet.DELETE(
          "/api/instances/{instanceId}/reverse-proxies/{proxyId}",
          {
            params: { path: { instanceId, proxyId } },
          },
        );
        queryClient.invalidateQueries({
          queryKey: ["get", "/api/instances/{instanceId}/reverse-proxies"],
        });
      } catch (error) {
        console.error("Failed to delete proxy:", error);
      }
    },
    [instanceId, queryClient],
  );

  if (isLoading) {
    return <InstanceDetailLoadingState />;
  }

  if (!instance) {
    return <InstanceNotFound />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <InstanceDetailHeader
        instance={instance}
        canCreateExtension={can("CREATE_EXTENDED_REQUEST")}
        canPromote={can("PROMOTE_INSTANCE")}
        canDelete={can("DELETE_INSTANCE")}
        isExtensionDialogOpen={isExtensionDialogOpen}
        onExtensionDialogChange={setIsExtensionDialogOpen}
        onSubmitExtension={handleSubmitExtension}
        onPromote={handlePromote}
        onDelete={handleDelete}
        isSubmitting={submitState.isSubmitting}
      />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="proxies">Reverse Proxies</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {instance.vmDetails && (
            <VmDetailsCard vmDetails={instance.vmDetails} />
          )}
          {instance.courseOffering && (
            <CourseInfoCard courseOffering={instance.courseOffering} />
          )}
        </TabsContent>

        <TabsContent value="proxies" className="space-y-4">
          <ReverseProxyList
            proxies={reverseProxies || []}
            onDelete={handleDeleteProxy}
            onAddClick={() => setIsProxyDialogOpen(true)}
            isAddDialogOpen={isProxyDialogOpen}
            onAddDialogChange={setIsProxyDialogOpen}
            onAddProxy={handleAddProxy}
            isSubmitting={submitState.isSubmitting}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <AuditLogList logs={logs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== Header Component ====================

interface InstanceDetailHeaderProps {
  instance: InstanceData;
  canCreateExtension: boolean;
  canPromote: boolean;
  canDelete: boolean;
  isExtensionDialogOpen: boolean;
  onExtensionDialogChange: (open: boolean) => void;
  onSubmitExtension: (days: number, reason: string) => Promise<void>;
  onPromote: () => Promise<void>;
  onDelete: () => Promise<void>;
  isSubmitting: boolean;
}

function InstanceDetailHeader({
  instance,
  canCreateExtension,
  canPromote,
  canDelete,
  isExtensionDialogOpen,
  onExtensionDialogChange,
  onSubmitExtension,
  onPromote,
  onDelete,
  isSubmitting,
}: InstanceDetailHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/instances">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {instance.vmDetails?.hostname || `Instance #${instance.id}`}
            </h1>
            <Badge variant={statusColors[instance.status]}>
              {instance.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {instance.courseOffering
              ? `${instance.courseOffering.courseCode} - ${instance.courseOffering.courseTitle}`
              : "No course assigned"}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {canCreateExtension && (
          <ExtensionRequestDialog
            open={isExtensionDialogOpen}
            onOpenChange={onExtensionDialogChange}
            onSubmit={onSubmitExtension}
            isSubmitting={isSubmitting}
          />
        )}
        {canPromote && (
          <Button
            variant="outline"
            onClick={onPromote}
            disabled={isSubmitting || instance.status === "PROMOTED"}
          >
            <ArrowUpCircle className="mr-2 size-4" />
            {isSubmitting ? "..." : "Promote"}
          </Button>
        )}
        {canDelete && <DeleteInstanceDialog onConfirm={onDelete} />}
      </div>
    </div>
  );
}

// ==================== Loading State ====================

function InstanceDetailLoadingState() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-10" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

// ==================== Not Found State ====================

function InstanceNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Server className="size-12 text-muted-foreground" />
      <h2 className="mt-4 text-xl font-semibold">Instance Not Found</h2>
      <p className="text-muted-foreground">
        The requested instance does not exist or you don't have access.
      </p>
      <Button asChild className="mt-4">
        <Link href="/dashboard/instances">Back to Instances</Link>
      </Button>
    </div>
  );
}

export default InstanceDetailClient;
