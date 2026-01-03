"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Server,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  ArrowUpCircle,
} from "lucide-react";

import { api, fetchClinet } from "@midori/lib/api";
import { hasPermission, type Role } from "@midori/lib/roles";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midori/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@midori/components/ui/field";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midori/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midori/components/ui/select";
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

interface InstancesClientProps {
  userRole: Role;
}

export function InstancesClient({ userRole }: InstancesClientProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Create Instance Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [pveTemplateId, setPveTemplateId] = useState("1");
  const [cpus, setCpus] = useState("2");
  const [memoryGB, setMemoryGB] = useState("4");
  const [diskGB, setDiskGB] = useState("20");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const can = (permission: string) => {
    return hasPermission(
      userRole,
      permission as Parameters<typeof hasPermission>[1],
    );
  };

  // Create instance handler
  const handleCreateInstance = async () => {
    if (!pveTemplateId) return;
    setIsSubmitting(true);
    try {
      await fetchClinet.POST("/api/instances/", {
        body: {
          pveTemplateId: Number(pveTemplateId),
          cpus: Number(cpus),
          memoryMB: Number(memoryGB) * 1024,
          diskGB: Number(diskGB),
        },
      });
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/instances/"],
      });
      setIsCreateDialogOpen(false);
      // Reset form
      setPveTemplateId("1");
      setCpus("2");
      setMemoryGB("4");
      setDiskGB("20");
    } catch (error) {
      console.error("Failed to create instance:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use role-appropriate endpoint
  const { data, isLoading } = api.useQuery("get", "/api/instances/", {
    params: {
      query: { page, pageSize },
    },
  });

  const instances = data?.values || [];
  const totalPages = data?.totalPages || 1;

  if (isLoading) {
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

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search instances..." className="pl-9" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-[180px]">
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
        {can("CREATE_INSTANCE") && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create Instance
          </Button>
        )}
      </div>

      {/* Instances Grid */}
      {instances.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <Server />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No Instances</EmptyTitle>
            <EmptyDescription>
              You don't have any instances yet.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {can("CREATE_INSTANCE") && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 size-4" />
                Create Instance
              </Button>
            )}
            {can("CREATE_REQUEST") && (
              <Button asChild>
                <Link href="/dashboard/requests/new">
                  <Plus className="mr-2 size-4" />
                  Request Instance
                </Link>
              </Button>
            )}
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <Card
              key={instance.id}
              className="group transition-colors hover:border-primary/50"
            >
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
                    {can("PROMOTE_INSTANCE") && (
                      <DropdownMenuItem>
                        <ArrowUpCircle className="mr-2 size-4" />
                        Promote
                      </DropdownMenuItem>
                    )}
                    {can("DELETE_INSTANCE") && (
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
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">
                          {instance.vmDetails.cpus} vCPU
                        </p>
                        <p>CPU</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {instance.vmDetails.memoryMB / 1024}GB
                        </p>
                        <p>RAM</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {instance.vmDetails.diskGB}GB
                        </p>
                        <p>Disk</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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

      {/* Create Instance Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Instance</DialogTitle>
            <DialogDescription>
              Configure and create a new virtual machine instance
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="pve-template">Template ID</FieldLabel>
              <FieldDescription>
                PVE template to use for the instance
              </FieldDescription>
              <Input
                id="pve-template"
                type="number"
                min="1"
                value={pveTemplateId}
                onChange={(e) => setPveTemplateId(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cpus">CPU Cores</FieldLabel>
              <FieldDescription>Number of virtual CPU cores</FieldDescription>
              <Input
                id="cpus"
                type="number"
                min="1"
                max="16"
                value={cpus}
                onChange={(e) => setCpus(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="memory">Memory (GB)</FieldLabel>
              <FieldDescription>Amount of RAM in gigabytes</FieldDescription>
              <Input
                id="memory"
                type="number"
                min="1"
                max="64"
                value={memoryGB}
                onChange={(e) => setMemoryGB(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="disk">Disk Size (GB)</FieldLabel>
              <FieldDescription>Storage capacity in gigabytes</FieldDescription>
              <Input
                id="disk"
                type="number"
                min="10"
                max="500"
                value={diskGB}
                onChange={(e) => setDiskGB(e.target.value)}
              />
            </Field>
            <Button
              className="w-full"
              disabled={!pveTemplateId || isSubmitting}
              onClick={handleCreateInstance}
            >
              {isSubmitting ? "Creating..." : "Create Instance"}
            </Button>
          </FieldGroup>
        </DialogContent>
      </Dialog>
    </>
  );
}
