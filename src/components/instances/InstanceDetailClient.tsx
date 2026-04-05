"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Server, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";

import { api, fetchClient, getApiErrorMessage } from "@midori/lib/api";
import { hasPermission, isAdmin, type Role } from "@midori/lib/roles";
import { useSession } from "@midori/hooks/useSession";
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
  defaultUser?: string;
  defaultPassword?: string;
  vmDetails?: VmDetails;
  courseOffering?: CourseOffering;
  owner?: {
    id?: number;
    name?: string;
    email?: string;
  };
  user?: {
    id?: number;
    name?: string;
    email?: string;
  };
  requester?: {
    id?: number;
    name?: string;
    email?: string;
  };
  instructor?: {
    id?: number;
    name?: string;
    email?: string;
  };
  ownerName?: string;
  ownerEmail?: string;
  ownerId?: number;
  requesterId?: number;
  semester?: string;
}

interface InstanceExtendedRequest {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
}

function getOwnerInfo(instance: InstanceData) {
  const candidate =
    instance.owner ||
    instance.user ||
    instance.requester ||
    instance.instructor;

  const id = candidate?.id || instance.ownerId || instance.requesterId;
  const name = candidate?.name || instance.ownerName;
  const email = candidate?.email || instance.ownerEmail;

  if (!id && !name && !email) {
    return null;
  }

  return { id, name, email };
}

function getOwnerDisplay(owner: {
  id?: number;
  name?: string;
  email?: string;
}) {
  if (owner.name && owner.email) {
    return `${owner.name} (${owner.email})`;
  }

  if (owner.name) {
    return owner.name;
  }

  if (owner.email) {
    return owner.email;
  }

  if (owner.id) {
    return `User #${owner.id}`;
  }

  return null;
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
  const { user: currentUser } = useSession();

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

  const { data: extensionRequests } = api.useQuery(
    "get",
    "/api/instances/{instanceId}/extended-request",
    {
      params: {
        path: { instanceId },
        query: { page: 1, pageSize: 20 },
      },
    },
  ) as {
    data:
    | {
      values: InstanceExtendedRequest[];
    }
    | undefined;
  };

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
  const activeExtensionRequest =
    extensionRequests?.values.find(
      (request) =>
        request.status === "PENDING" || request.status === "APPROVED",
    ) ?? null;
  const activeExtensionRequestStatus =
    activeExtensionRequest?.status === "PENDING" ||
      activeExtensionRequest?.status === "APPROVED"
      ? activeExtensionRequest.status
      : null;

  // Handlers
  const handlePromote = useCallback(async () => {
    submitState.startSubmit();
    const result = await fetchClient
      .PATCH("/api/instances/{instanceId}/promote", {
        params: { path: { instanceId } },
      })
      .catch((error) => {
        console.error("Failed to promote instance:", error);
        toast.error(getApiErrorMessage(error) ?? "Failed to promote instance");
        return null;
      });

    submitState.endSubmit();

    if (!result) {
      return;
    }

    const resultError = (result as { error?: unknown }).error;
    if (resultError) {
      toast.error(
        getApiErrorMessage(resultError) ?? "Failed to promote instance",
      );
      return;
    }

    queryClient.invalidateQueries({
      queryKey: ["get", "/api/instances/{instanceId}"],
    });
    toast.success("Instance promoted successfully");
  }, [instanceId, queryClient, submitState]);

  const handleDelete = useCallback(async () => {
    try {
      const { error } = await fetchClient.DELETE(
        "/api/instances/{instanceId}",
        {
          params: { path: { instanceId } },
        },
      );

      if (error) {
        toast.error(getApiErrorMessage(error) ?? "Failed to delete instance");
        return;
      }

      toast.success("Instance deleted successfully");
      router.push("/dashboard/instances");
    } catch (error) {
      console.error("Failed to delete instance:", error);
      toast.error(getApiErrorMessage(error) ?? "Failed to delete instance");
    }
  }, [instanceId, router]);

  const handleSubmitExtension = useCallback(
    async (reason: string) => {
      submitState.startSubmit();
      const result = await fetchClient
        .POST("/api/instances/{instanceId}/extended-request", {
          params: { path: { instanceId } },
          body: {
            title: "Extension Request",
            description: reason,
          },
        })
        .catch((error) => {
          console.error("Failed to submit extension request:", error);
          toast.error(
            getApiErrorMessage(error) ?? "Failed to submit extension request",
          );
          return null;
        });

      submitState.endSubmit();

      if (!result) {
        return;
      }

      const resultError = (result as { error?: unknown }).error;
      if (resultError) {
        toast.error(
          getApiErrorMessage(resultError) ?? "Failed to submit extension request",
        );
        return;
      }

      setIsExtensionDialogOpen(false);
      toast.success("Extension request submitted");
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/instances/{instanceId}/extended-request"],
      });
    },
    [instanceId, queryClient, submitState],
  );

  const handleAddProxy = useCallback(
    async (data: {
      port: number;
      type: "HTTP" | "HTTPS" | "TCP";
      description?: string;
    }) => {
      submitState.startSubmit();
      const result = await fetchClient
        .POST("/api/instances/{instanceId}/reverse-proxies", {
          params: { path: { instanceId } },
          body: {
            targetPort: data.port,
            type: data.type,
            description: data.description,
          },
        })
        .catch((error) => {
          console.error("Failed to add proxy:", error);
          toast.error(
            getApiErrorMessage(error) ?? "Failed to add reverse proxy",
          );
          return null;
        });

      submitState.endSubmit();

      if (!result) {
        return;
      }

      const resultError = (result as { error?: unknown }).error;
      if (resultError) {
        toast.error(
          getApiErrorMessage(resultError) ?? "Failed to add reverse proxy",
        );
        return;
      }

      queryClient.invalidateQueries({
        queryKey: ["get", "/api/instances/{instanceId}/reverse-proxies"],
      });
      setIsProxyDialogOpen(false);
      toast.success("Reverse proxy added successfully");
    },
    [instanceId, queryClient, submitState],
  );

  const handleDeleteProxy = useCallback(
    async (proxyId: number) => {
      try {
        const { error } = await fetchClient.DELETE(
          "/api/instances/{instanceId}/reverse-proxies/{proxyId}",
          {
            params: { path: { instanceId, proxyId } },
          },
        );

        if (error) {
          toast.error(
            getApiErrorMessage(error) ?? "Failed to delete reverse proxy",
          );
          return;
        }

        toast.success("Reverse proxy deleted successfully");
        queryClient.invalidateQueries({
          queryKey: ["get", "/api/instances/{instanceId}/reverse-proxies"],
        });
      } catch (error) {
        console.error("Failed to delete proxy:", error);
        toast.error(
          getApiErrorMessage(error) ?? "Failed to delete reverse proxy",
        );
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

  const ownerInfo = getOwnerInfo(instance);
  const ownerDisplay = ownerInfo ? getOwnerDisplay(ownerInfo) : null;
  const isOwner =
    !!ownerInfo &&
    !!currentUser &&
    ((ownerInfo.id !== undefined && ownerInfo.id === currentUser.id) ||
      (!!ownerInfo.email && ownerInfo.email === currentUser.email));
  const canViewDefaultCredentials =
    isOwner || (isAdmin(userRole) && instance.status === "PROMOTED");

  const shouldShowOwner = !!ownerDisplay && !isOwner;

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
        ownerDisplay={ownerDisplay}
        shouldShowOwner={shouldShowOwner}
        activeExtensionRequestStatus={activeExtensionRequestStatus}
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
            <VmDetailsCard
              vmDetails={instance.vmDetails}
              showCredentials={canViewDefaultCredentials}
              defaultUser={instance.defaultUser}
              defaultPassword={instance.defaultPassword}
            />
          )}
          {instance.courseOffering && (
            <CourseInfoCard courseOffering={instance.courseOffering} workSemester={instance.semester} />
          )}
        </TabsContent>

        <TabsContent value="proxies" className="space-y-4">
          <ReverseProxyList
            hostname={instance.vmDetails?.hostname || `instance-${instance.id}`}
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
  onSubmitExtension: (reason: string) => Promise<void>;
  onPromote: () => Promise<void>;
  onDelete: () => Promise<void>;
  isSubmitting: boolean;
  ownerDisplay: string | null;
  shouldShowOwner: boolean;
  activeExtensionRequestStatus: "PENDING" | "APPROVED" | null;
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
  ownerDisplay,
  shouldShowOwner,
  activeExtensionRequestStatus,
}: InstanceDetailHeaderProps) {
  const showPromote = canPromote && instance.status !== "PROMOTED";
  const extensionBlocked = activeExtensionRequestStatus !== null;
  const extensionTriggerLabel =
    activeExtensionRequestStatus === "APPROVED"
      ? "Already Extended"
      : activeExtensionRequestStatus === "PENDING"
        ? "Extension Requested"
        : "Request Extension";

  return (
    <div className="flex items-start justify-between gap-4">
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
          {shouldShowOwner && ownerDisplay && (
            <p className="text-sm text-muted-foreground">
              Owner: {ownerDisplay}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex gap-2">
          {canCreateExtension && (
            <ExtensionRequestDialog
              open={isExtensionDialogOpen}
              onOpenChange={onExtensionDialogChange}
              onSubmit={onSubmitExtension}
              isSubmitting={isSubmitting}
              disabled={extensionBlocked}
              triggerLabel={extensionTriggerLabel}
            />
          )}
          {showPromote && (
            <Button
              variant="outline"
              onClick={onPromote}
              disabled={isSubmitting}
            >
              <ArrowUpCircle className="mr-2 size-4" />
              {isSubmitting ? "..." : "Promote"}
            </Button>
          )}
          {canDelete && <DeleteInstanceDialog onConfirm={onDelete} />}
        </div>

        {canCreateExtension && extensionBlocked ? (
          <p className="text-right text-sm text-muted-foreground">
            {activeExtensionRequestStatus === "APPROVED"
              ? "This instance has already been extended."
              : "An extension request is already pending for this instance."}
          </p>
        ) : null}
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
