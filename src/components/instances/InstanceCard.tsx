import {
  Server,
  Plus,
  MoreVertical,
  Trash2,
  ArrowUpCircle,
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

export interface VmDetails {
  hostname: string;
  ip: string;
  os: string;
  cpus: number;
  memoryMB: number;
  diskGB: number;
}

export interface CourseOffering {
  courseCode: string;
  courseTitle: string;
  semester: string;
}

export interface Instance {
  id: number;
  status: keyof typeof statusColors;
  vmDetails?: VmDetails;
  courseOffering?: CourseOffering;
}

interface InstanceCardProps {
  instance: Instance;
  canPromote: boolean;
  canDelete: boolean;
}

/**
 * Single instance card component
 */
export function InstanceCard({
  instance,
  canPromote,
  canDelete,
}: InstanceCardProps) {
  return (
    <Card className="group transition-colors hover:border-primary/50">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">
            {instance.vmDetails?.hostname || `Instance #${instance.id}`}
          </CardTitle>
          <CardDescription>
            {instance.courseOffering
              ? `${instance.courseOffering.courseCode} - ${instance.courseOffering.semester}`
              : "No course assigned"}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/instances/${instance.id}`}>
                View Details
              </Link>
            </DropdownMenuItem>
            {canPromote && (
              <DropdownMenuItem>
                <ArrowUpCircle className="mr-2 size-4" />
                Promote
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Badge variant={statusColors[instance.status]}>
            {instance.status}
          </Badge>
          {instance.vmDetails && (
            <VmSpecs
              cpus={instance.vmDetails.cpus}
              memoryMB={instance.vmDetails.memoryMB}
              diskGB={instance.vmDetails.diskGB}
            />
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
  canPromote: boolean;
  canDelete: boolean;
}

/**
 * Grid layout for instances
 */
export function InstancesGrid({
  instances,
  canPromote,
  canDelete,
}: InstancesGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {instances.map((instance) => (
        <InstanceCard
          key={instance.id}
          instance={instance}
          canPromote={canPromote}
          canDelete={canDelete}
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
