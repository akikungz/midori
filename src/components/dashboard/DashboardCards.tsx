"use client";

import { useRouter } from "next/navigation";
import {
  Activity,
  Cpu,
  Server,
  FileText,
  FolderOpen,
  HardDrive,
  Key,
  ArrowRight,
  Plus,
  Clock,
} from "lucide-react";

import type { components } from "@midori/types/api";
import { formatDateTime, formatFileSize } from "@midori/lib/format";
import type { Role } from "@midori/lib/roles";
import {
  getRoleDisplayName,
  getRoleBadgeVariant,
  hasPermission,
} from "@midori/lib/roles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { Button } from "@midori/components/ui/button";
import { Badge } from "@midori/components/ui/badge";

interface DashboardCardsProps {
  user: {
    name?: string | null;
    role?: string;
  } | null;
  proxmoxOverview?: components["schemas"]["MonitoringProxmoxOverviewResponse"];
  dashboardSummary?: {
    title: string;
    description: string;
    instanceLabel: string;
    instanceDescription: string;
    requestLabel: string;
    requestDescription: string;
    extendedRequestLabel: string;
    extendedRequestDescription: string;
    instanceCount: number;
    requestCount: number;
    extendedRequestCount: number;
  };
}

function formatMetricNumber(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "N/A";
  }

  return Intl.NumberFormat("en-US").format(value);
}

function formatMetricPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "N/A";
  }

  return `${value.toFixed(1)}%`;
}

function formatMetricBytes(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "N/A";
  }

  return formatFileSize(value);
}

export function DashboardCards({
  user,
  proxmoxOverview,
  dashboardSummary,
}: DashboardCardsProps) {
  const router = useRouter();
  const role = user?.role as Role | undefined;
  const isStudent = role === "STUDENT";
  const summary = proxmoxOverview?.summary;

  const can = (permission: string) => {
    if (!role) return false;
    return hasPermission(
      role,
      permission as Parameters<typeof hasPermission>[1],
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "User"}!
          </h1>
          {role && (
            <Badge variant={getRoleBadgeVariant(role)}>
              {getRoleDisplayName(role)}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Here's an overview of your FITM Cloud resources.
        </p>
      </div>

      {/* Proxmox Summary */}
      <div className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Proxmox Cluster Summary
            </h2>
            <p className="text-sm text-muted-foreground">
              Shared infrastructure snapshot from the monitoring service
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {proxmoxOverview
              ? `Updated ${formatDateTime(proxmoxOverview.generatedAt)}`
              : "Monitoring snapshot unavailable"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Nodes & Guests
              </CardTitle>
              <Server className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {formatMetricNumber(summary?.nodeCount)} /{" "}
                {formatMetricNumber(summary?.guestCount)}
              </div>
              <CardDescription className="mt-1">
                Nodes and total guests in the current Proxmox snapshot
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average CPU</CardTitle>
              <Cpu className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {formatMetricPercent(summary?.averageNodeCpuPercent)}
              </div>
              <CardDescription className="mt-1">
                Host average CPU, guest average{" "}
                {formatMetricPercent(summary?.averageGuestCpuPercent)}
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Node Memory</CardTitle>
              <Activity className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {formatMetricBytes(summary?.nodeMemoryUsedBytes)}
              </div>
              <CardDescription className="mt-1">
                Used of {formatMetricBytes(summary?.nodeMemoryTotalBytes)} total
                host memory
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Node Storage
              </CardTitle>
              <HardDrive className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {formatMetricBytes(summary?.nodeStorageUsedBytes)}
              </div>
              <CardDescription className="mt-1">
                Used of {formatMetricBytes(summary?.nodeStorageTotalBytes)}{" "}
                cluster storage
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Role Summary */}
      {dashboardSummary && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {dashboardSummary.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dashboardSummary.description}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {dashboardSummary.instanceLabel}
                </CardTitle>
                <Server className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight">
                  {formatMetricNumber(dashboardSummary.instanceCount)}
                </div>
                <CardDescription className="mt-1">
                  {dashboardSummary.instanceDescription}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {dashboardSummary.requestLabel}
                </CardTitle>
                <FileText className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight">
                  {formatMetricNumber(dashboardSummary.requestCount)}
                </div>
                <CardDescription className="mt-1">
                  {dashboardSummary.requestDescription}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {dashboardSummary.extendedRequestLabel}
                </CardTitle>
                <Clock className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight">
                  {formatMetricNumber(dashboardSummary.extendedRequestCount)}
                </div>
                <CardDescription className="mt-1">
                  {dashboardSummary.extendedRequestDescription}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* My Instances */}
        <Card className="group cursor-pointer transition-colors hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Instances</CardTitle>
            <Server className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              View and manage your virtual machine instances
            </CardDescription>
            <Button
              variant="link"
              className="mt-2 h-auto p-0"
              onClick={() => router.push("/dashboard/instances")}
            >
              View Instances
              <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardContent>
        </Card>

        {/* Requests */}
        <Card className="group cursor-pointer transition-colors hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Requests</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              {isStudent
                ? "Submit new instance requests or check status"
                : "Review and manage instance requests"}
            </CardDescription>
            <Button
              variant="link"
              className="mt-2 h-auto p-0"
              onClick={() => router.push("/dashboard/requests")}
            >
              {isStudent ? "View Requests" : "Review Requests"}
              <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardContent>
        </Card>

        {/* Storage */}
        {can("ACCESS_STORAGE") && (
          <Card className="group cursor-pointer transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Storage</CardTitle>
              <FolderOpen className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage your files and shared documents
              </CardDescription>
              <Button
                variant="link"
                className="mt-2 h-auto p-0"
                onClick={() => router.push("/dashboard/storage")}
              >
                Open Storage
                <ArrowRight className="ml-1 size-3" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* SSH Keys */}
        <Card className="group cursor-pointer transition-colors hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SSH Keys</CardTitle>
            <Key className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              Manage your SSH keys for secure access
            </CardDescription>
            <Button
              variant="link"
              className="mt-2 h-auto p-0"
              onClick={() => router.push("/dashboard/settings")}
            >
              Manage Keys
              <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardContent>
        </Card>

        {/* Student: Request New Instance */}
        {can("CREATE_REQUEST") && (
          <Card className="group cursor-pointer border-dashed transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                New Instance Request
              </CardTitle>
              <Plus className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Submit a request for a new virtual machine
              </CardDescription>
              <Button
                variant="link"
                className="mt-2 h-auto p-0"
                onClick={() => router.push("/dashboard/requests/new")}
              >
                Create Request
                <ArrowRight className="ml-1 size-3" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instructor/Admin: Create Instance */}
        {can("CREATE_INSTANCE") && (
          <Card className="group cursor-pointer border-dashed transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Create Instance
              </CardTitle>
              <Plus className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Directly create a new virtual machine instance
              </CardDescription>
              <Button
                variant="link"
                className="mt-2 h-auto p-0"
                onClick={() => router.push("/dashboard/instances/new")}
              >
                Create Instance
                <ArrowRight className="ml-1 size-3" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Admin: Pending Reviews */}
        {can("REVIEW_REQUEST") && (
          <Card className="group cursor-pointer transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Reviews
              </CardTitle>
              <Clock className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Review pending instance and extension requests
              </CardDescription>
              <Button
                variant="link"
                className="mt-2 h-auto p-0"
                onClick={() =>
                  router.push("/dashboard/requests?status=PENDING")
                }
              >
                Review Pending
                <ArrowRight className="ml-1 size-3" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Admin: Proxmox Monitoring */}
        {role === "ADMIN" && (
          <Card className="group cursor-pointer transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monitoring</CardTitle>
              <Activity className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Inspect Proxmox cluster capacity, guest utilization, and
                exported metrics
              </CardDescription>
              <Button
                variant="link"
                className="mt-2 h-auto p-0"
                onClick={() => router.push("/dashboard/admin/monitoring")}
              >
                Open Monitoring
                <ArrowRight className="ml-1 size-3" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
