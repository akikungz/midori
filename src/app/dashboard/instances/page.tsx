"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Server,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  ArrowUpCircle,
} from "lucide-react";

import { api } from "@midori/lib/api";
import { RoleGuard } from "@midori/components/RoleGuard";
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

export default function InstancesPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Instances</h1>
          <p className="text-muted-foreground">
            Manage your virtual machine instances
          </p>
        </div>
        <RoleGuard permission="CREATE_INSTANCE">
          <Button asChild>
            <Link href="/dashboard/instances/new">
              <Plus className="mr-2 size-4" />
              Create Instance
            </Link>
          </Button>
        </RoleGuard>
      </div>

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
            <RoleGuard permission="CREATE_INSTANCE">
              <Button asChild>
                <Link href="/dashboard/instances/new">
                  <Plus className="mr-2 size-4" />
                  Create Instance
                </Link>
              </Button>
            </RoleGuard>
            <RoleGuard permission="CREATE_REQUEST">
              <Button asChild>
                <Link href="/dashboard/requests/new">
                  <Plus className="mr-2 size-4" />
                  Request Instance
                </Link>
              </Button>
            </RoleGuard>
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
                    <RoleGuard permission="PROMOTE_INSTANCE">
                      <DropdownMenuItem>
                        <ArrowUpCircle className="mr-2 size-4" />
                        Promote
                      </DropdownMenuItem>
                    </RoleGuard>
                    <RoleGuard permission="DELETE_INSTANCE">
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </RoleGuard>
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
    </div>
  );
}
