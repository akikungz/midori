import {
  Server,
  Plus,
  MoreVertical,
  Trash2,
  ArrowUpCircle,
  User,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@midori/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { Badge } from "@midori/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midori/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";

const statusColors = {
  PENDING: "secondary",
  ACTIVE: "default",
  PROMOTED: "destructive",
  INACTIVE: "outline",
  DELETED: "outline",
} as const;

const vmStatusColors = {
  RUNNING: "vm-blue",
  STOPPED: "vm-orange",
  SUSPENDED: "secondary",
} as const;

export interface VmDetails {
  hostname: string;
  ip: string;
  os: string;
  cpus: number;
  memoryMB: number;
  diskGB: number;
  vmStatus?: keyof typeof vmStatusColors;
}

export interface CourseOffering {
  courseCode: string;
  courseTitle: string;
  semester: string;
}

export interface Instance {
  id: number;
  status: keyof typeof statusColors;
  provisionStatus?:
    | "NOT_STARTED"
    | "QUEUED"
    | "PROVISIONING"
    | "COMPLETED"
    | "FAILED";
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
}

function getOwnerDisplay(instance: Instance) {
  const candidate =
    instance.owner ||
    instance.user ||
    instance.requester ||
    instance.instructor;

  const name = candidate?.name || instance.ownerName;
  const email = candidate?.email || instance.ownerEmail;

  if (name && email) {
    return `${name} (${email})`;
  }

  if (name) {
    return name;
  }

  if (email) {
    return email;
  }

  return null;
}

interface InstanceCardProps {
  instance: Instance;
  showOwner?: boolean;
  canPromote: boolean;
  canDelete: boolean;
  onReprovision?: (instanceId: number) => void;
  onPromote?: (instanceId: number) => void;
  onDelete?: (instanceId: number) => void;
}

/**
 * Single instance card component
 */
export function InstanceCard({
  instance,
  showOwner = false,
  canPromote,
  canDelete,
  onReprovision,
  onPromote,
  onDelete,
}: InstanceCardProps) {
  const ownerDisplay = getOwnerDisplay(instance);

  const handleMenuAction =
    (action?: (instanceId: number) => void) => (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      action?.(instance.id);
    };

  const showPromote = canPromote && instance.status !== "PROMOTED";

  return (
    <Card className="group transition-colors hover:border-primary/50">
      <CardHeader className="flex flex-row items-start justify-between">
        <Link href={`/dashboard/instances/${instance.id}`}>
          <div className="space-y-1">
            <CardTitle className="text-base">
              {instance.vmDetails?.hostname || `Instance #${instance.id}`}
            </CardTitle>
            <CardDescription>
              {instance.courseOffering
                ? `${instance.courseOffering.courseCode} - ${instance.courseOffering.semester}`
                : "No course assigned"}
            </CardDescription>
            {showOwner && ownerDisplay && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="size-3" />
                <span className="truncate">Owner: {ownerDisplay}</span>
              </div>
            )}
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/instances/${instance.id}`}>
                <Server className="mr-2 size-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            {showPromote && (
              <DropdownMenuItem
                onSelect={handleMenuAction(onPromote)}
                disabled={!onPromote}
              >
                <ArrowUpCircle className="mr-2 size-4" />
                Promote
              </DropdownMenuItem>
            )}
            {instance.provisionStatus === "FAILED" && onReprovision && (
              <DropdownMenuItem
                onSelect={handleMenuAction(onReprovision)}
                className="text-orange-600"
              >
                <Server className="mr-2 size-4" />
                Re-provision
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={handleMenuAction(onDelete)}
                  disabled={!onDelete}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 space-x-2">
          <Badge variant={statusColors[instance.status]}>
            {instance.status}
          </Badge>
          {instance.vmDetails && (
            <>
              {instance.vmDetails.vmStatus &&
                ["ACTIVE", "PROMOTED"].includes(instance.status) && (
                  <Badge variant={vmStatusColors[instance.vmDetails.vmStatus]}>
                    {instance.vmDetails.vmStatus}
                  </Badge>
                )}
              <VmSpecs
                cpus={instance.vmDetails.cpus}
                memoryMB={instance.vmDetails.memoryMB}
                diskGB={instance.vmDetails.diskGB}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface VmSpecsProps {
  cpus: number;
  memoryMB: number;
  diskGB: number;
}

/**
 * VM specifications display component
 */
export function VmSpecs({ cpus, memoryMB, diskGB }: VmSpecsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
      <div>
        <p className="font-medium text-foreground">{cpus} vCPU</p>
        <p>CPU</p>
      </div>
      <div>
        <p className="font-medium text-foreground">{memoryMB / 1024}GB</p>
        <p>RAM</p>
      </div>
      <div>
        <p className="font-medium text-foreground">{diskGB}GB</p>
        <p>Disk</p>
      </div>
    </div>
  );
}

interface InstancesGridProps {
  instances: Instance[];
  showOwner?: boolean;
  canPromote: boolean;
  canDelete: boolean;
  onReprovision?: (instanceId: number) => void;
  onPromote?: (instanceId: number) => void;
  onDelete?: (instanceId: number) => void;
}

/**
 * Grid layout for instances
 */
export function InstancesGrid({
  instances,
  showOwner = false,
  canPromote,
  canDelete,
  onReprovision,
  onPromote,
  onDelete,
}: InstancesGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {instances.map((instance) => (
        <InstanceCard
          key={instance.id}
          instance={instance}
          showOwner={showOwner}
          canPromote={canPromote}
          canDelete={canDelete}
          onReprovision={onReprovision}
          onPromote={onPromote}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

interface EmptyInstancesProps {
  canCreateInstance: boolean;
  canCreateRequest: boolean;
  onCreateInstance: () => void;
}

/**
 * Empty state when no instances exist
 */
export function EmptyInstances({
  canCreateInstance,
  canCreateRequest,
  onCreateInstance,
}: EmptyInstancesProps) {
  return (
    <Empty>
      <EmptyMedia variant="icon">
        <Server />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>No Instances</EmptyTitle>
        <EmptyDescription>You don't have any instances yet.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {canCreateInstance && (
          <Button onClick={onCreateInstance}>
            <Plus className="mr-2 size-4" />
            Create Instance
          </Button>
        )}
        {canCreateRequest && (
          <Button asChild>
            <Link href="/dashboard/requests/new">
              <Plus className="mr-2 size-4" />
              Request Instance
            </Link>
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}
