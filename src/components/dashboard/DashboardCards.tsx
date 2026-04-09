"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Cpu,
  RefreshCw,
  Server,
  FileText,
  FolderOpen,
  HardDrive,
  Key,
  ArrowRight,
  Plus,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import type { components } from "@midori/types/api";
import { fetchClient } from "@midori/lib/api";
import { formatDateTime, formatFileSize } from "@midori/lib/format";
import type { Role } from "@midori/lib/roles";
import type { SemesterInstanceNotice as SemesterInstanceNoticeData } from "@midori/lib/semester-notice";
import {
  getRoleDisplayName,
  getRoleBadgeVariant,
  hasPermission,
} from "@midori/lib/roles";
import { SemesterInstanceNotice } from "@midori/components/shared/SemesterInstanceNotice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { Button } from "@midori/components/ui/button";
import { Badge } from "@midori/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midori/components/ui/select";

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
  semesterInstanceNotice?: SemesterInstanceNoticeData | null;
}

interface DashboardLiveSnapshot {
  overview?: components["schemas"]["MonitoringProxmoxOverviewResponse"];
  dashboardSummary?: DashboardCardsProps["dashboardSummary"];
  series: MetricSeriesConfig[];
}

interface PrometheusMatrixSample {
  metric?: Record<string, string>;
  values?: [number | string, string][];
}

interface MetricSeriesPoint {
  timestamp: number;
  value: number;
}

interface MetricSeriesConfig {
  id: string;
  title: string;
  description: string;
  unit: "percent";
  points: MetricSeriesPoint[];
}

const AUTO_REFRESH_OPTIONS = [
  { value: "0", label: "Manual" },
  { value: "5000", label: "5s" },
  { value: "10000", label: "10s" },
  { value: "15000", label: "15s" },
  { value: "30000", label: "30s" },
  { value: "60000", label: "1m" },
] as const;

const RANGE_WINDOW_MS = 60 * 60 * 1000;
const RANGE_STEP = "60s";

const METRIC_SERIES_DEFINITIONS = [
  {
    id: "node-cpu",
    title: "Host CPU Trend",
    description: "Average CPU load across Proxmox nodes over the last hour.",
    unit: "percent" as const,
    query: "avg(otelcol_proxmox_node_cpustat_cpu_percent)",
  },
  {
    id: "guest-cpu",
    title: "Guest CPU Trend",
    description:
      "Average CPU load across VM and LXC guests over the last hour.",
    unit: "percent" as const,
    query: "avg(otelcol_proxmox_vm_cpu_percent)",
  },
  {
    id: "node-memory",
    title: "Host Memory Trend",
    description: "Percent of node memory currently in use.",
    unit: "percent" as const,
    query:
      "100 * sum(otelcol_proxmox_node_memory_memused_bytes) / clamp_min(sum(otelcol_proxmox_node_memory_memtotal_bytes), 1)",
  },
  {
    id: "storage",
    title: "Storage Trend",
    description: "Percent of Proxmox storage capacity currently consumed.",
    unit: "percent" as const,
    query:
      "100 * sum(otelcol_proxmox_storage_used_bytes) / clamp_min(sum(otelcol_proxmox_storage_total_bytes), 1)",
  },
] as const;

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

function _formatMetricLabel(value: number, unit: MetricSeriesConfig["unit"]) {
  if (unit === "percent") {
    return `${value.toFixed(1)}%`;
  }

  return formatMetricNumber(value);
}

function parseRangePoints(result: unknown): MetricSeriesPoint[] {
  if (!Array.isArray(result) || result.length === 0) {
    return [];
  }

  const firstSeries = result[0] as PrometheusMatrixSample;
  if (!Array.isArray(firstSeries.values)) {
    return [];
  }

  return firstSeries.values
    .map((entry) => {
      const timestamp = Number(entry[0]) * 1000;
      const value = Number(entry[1]);

      if (Number.isNaN(timestamp) || Number.isNaN(value)) {
        return null;
      }

      return { timestamp, value };
    })
    .filter((point): point is MetricSeriesPoint => point !== null);
}

function buildDashboardSummary(
  role: Role | undefined,
  counts:
    | {
        instanceCount: number;
        requestCount: number;
        extendedRequestCount: number;
      }
    | undefined,
): DashboardCardsProps["dashboardSummary"] {
  if (!role || !counts) {
    return undefined;
  }

  if (role === "STUDENT") {
    return {
      title: "My Activity",
      description: "A quick summary of your current instances and requests",
      instanceLabel: "Instances",
      instanceDescription: "Total instances linked to your account",
      requestLabel: "Requests",
      requestDescription: "Instance requests you have submitted",
      extendedRequestLabel: "Extended Requests",
      extendedRequestDescription:
        "Extension requests for your existing instances",
      ...counts,
    };
  }

  if (role === "ADMIN" || role === "INSTRUCTOR") {
    return {
      title: "Work Queue",
      description:
        role === "ADMIN"
          ? "System-wide instance volume and pending review items"
          : "Your instance volume and pending review items",
      instanceLabel: "Instances",
      instanceDescription:
        role === "ADMIN"
          ? "Total instances across the platform"
          : "Instances currently in your scope",
      requestLabel: "Pending Requests",
      requestDescription: "Instance requests waiting for review",
      extendedRequestLabel: "Pending Extended Requests",
      extendedRequestDescription: "Extension requests waiting for review",
      ...counts,
    };
  }

  return undefined;
}

async function fetchDashboardSnapshot(role: Role | undefined) {
  const end = new Date();
  const start = new Date(end.getTime() - RANGE_WINDOW_MS);

  const countPromises =
    role === "STUDENT"
      ? [
          fetchClient.GET("/api/instances/", {
            params: { query: { page: 1, pageSize: 1 } },
          }),
          fetchClient.GET("/api/requests/", {
            params: { query: { page: 1, pageSize: 1 } },
          }),
          fetchClient.GET("/api/extended-requests/", {
            params: { query: { page: 1, pageSize: 1 } },
          }),
        ]
      : role === "ADMIN" || role === "INSTRUCTOR"
        ? [
            fetchClient.GET(
              role === "ADMIN" ? "/api/instances/admin" : "/api/instances/",
              {
                params: { query: { page: 1, pageSize: 1 } },
              },
            ),
            fetchClient.GET("/api/requests/", {
              params: {
                query: { page: 1, pageSize: 1, status: "PENDING" },
              },
            }),
            fetchClient.GET("/api/extended-requests/", {
              params: {
                query: { page: 1, pageSize: 1, status: "PENDING" },
              },
            }),
          ]
        : [];

  const [overviewResponse, ...restResponses] = await Promise.all([
    fetchClient.GET("/api/monitoring/proxmox/overview"),
    ...countPromises,
    ...METRIC_SERIES_DEFINITIONS.map((series) =>
      fetchClient.GET("/api/monitoring/query-range", {
        params: {
          query: {
            query: series.query,
            start: start.toISOString(),
            end: end.toISOString(),
            step: RANGE_STEP,
          },
        },
      }),
    ),
  ]);

  if (overviewResponse.error) {
    throw new Error(
      "message" in overviewResponse.error
        ? String(overviewResponse.error.message)
        : "Failed to load monitoring overview.",
    );
  }

  const countResponses = restResponses.slice(0, countPromises.length);
  const seriesResponses = restResponses.slice(countPromises.length) as Array<{
    data?: components["schemas"]["MonitoringQueryResponse"];
  }>;

  const getTotalItems = (index: number) => {
    const response = countResponses[index] as {
      data?: { totalItems?: number };
    };
    return response.data?.totalItems ?? 0;
  };

  const counts =
    countResponses.length === 3
      ? {
          instanceCount: getTotalItems(0),
          requestCount: getTotalItems(1),
          extendedRequestCount: getTotalItems(2),
        }
      : undefined;

  return {
    overview: overviewResponse.data,
    dashboardSummary: buildDashboardSummary(role, counts),
    series: METRIC_SERIES_DEFINITIONS.map((series, index) => ({
      id: series.id,
      title: series.title,
      description: series.description,
      unit: series.unit,
      points: parseRangePoints(seriesResponses[index]?.data?.data?.result),
    })),
  } satisfies DashboardLiveSnapshot;
}

export function DashboardCards({
  user,
  proxmoxOverview,
  dashboardSummary,
  semesterInstanceNotice,
}: DashboardCardsProps) {
  const router = useRouter();
  const role = user?.role as Role | undefined;
  const isStudent = role === "STUDENT";
  const [autoRefreshMs, setAutoRefreshMs] = useState<number>(15000);

  const initialLiveSnapshot: DashboardLiveSnapshot = {
    overview: proxmoxOverview,
    dashboardSummary,
    series: METRIC_SERIES_DEFINITIONS.map((series) => ({
      id: series.id,
      title: series.title,
      description: series.description,
      unit: series.unit,
      points: [],
    })),
  };

  const {
    data: liveSnapshot,
    refetch,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["dashboard-live-snapshot", role],
    queryFn: () => fetchDashboardSnapshot(role),
    initialData: initialLiveSnapshot,
    refetchInterval: autoRefreshMs > 0 ? autoRefreshMs : false,
    refetchOnWindowFocus: false,
  });

  const summary = liveSnapshot.overview?.summary;
  const readableDashboardSummary =
    liveSnapshot.dashboardSummary ?? dashboardSummary;

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

      {isStudent && semesterInstanceNotice ? (
        <SemesterInstanceNotice notice={semesterInstanceNotice} />
      ) : null}

      {/* Proxmox Summary */}
      <div className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Proxmox Cluster Health
            </h2>
            <p className="text-sm text-muted-foreground">
              Live infrastructure summary with one-hour trends and refresh
              controls
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex items-center gap-2">
              <Select
                value={String(autoRefreshMs)}
                onValueChange={(value) => setAutoRefreshMs(Number(value))}
              >
                <SelectTrigger className="h-9 w-30">
                  <SelectValue placeholder="Auto refresh" />
                </SelectTrigger>
                <SelectContent>
                  {AUTO_REFRESH_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {liveSnapshot.overview
                ? `Updated ${formatDateTime(liveSnapshot.overview.generatedAt)}`
                : "Monitoring snapshot unavailable"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Cluster Footprint
              </CardTitle>
              <Server className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {formatMetricNumber(summary?.nodeCount)} Nodes /{" "}
                {formatMetricNumber(summary?.guestCount)} Vms
              </div>
              <CardDescription className="mt-1">
                Nodes and guests currently represented in the cluster snapshot
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Average Host CPU
              </CardTitle>
              <Cpu className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {formatMetricPercent(summary?.averageNodeCpuPercent)}
              </div>
              <CardDescription className="mt-1">
                Host average CPU, with guest average at{" "}
                {formatMetricPercent(summary?.averageGuestCpuPercent)}
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Host Memory in Use
              </CardTitle>
              <Activity className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {formatMetricBytes(summary?.nodeMemoryUsedBytes)}
              </div>
              <CardDescription className="mt-1">
                Using {formatMetricBytes(summary?.nodeMemoryUsedBytes)} out of{" "}
                {formatMetricBytes(summary?.nodeMemoryTotalBytes)} total host
                memory
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
                Using {formatMetricBytes(summary?.nodeStorageUsedBytes)} out of{" "}
                {formatMetricBytes(summary?.nodeStorageTotalBytes)} cluster
                storage
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {error ? (
          <p className="text-sm text-destructive">
            Live monitoring refresh failed. Showing the latest successful data.
          </p>
        ) : null}
      </div>

      {/* Role Summary */}
      {readableDashboardSummary && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {readableDashboardSummary.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {readableDashboardSummary.description}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {readableDashboardSummary.instanceLabel}
                </CardTitle>
                <Server className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight">
                  {formatMetricNumber(readableDashboardSummary.instanceCount)}
                </div>
                <CardDescription className="mt-1">
                  {readableDashboardSummary.instanceDescription}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {readableDashboardSummary.requestLabel}
                </CardTitle>
                <FileText className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight">
                  {formatMetricNumber(readableDashboardSummary.requestCount)}
                </div>
                <CardDescription className="mt-1">
                  {readableDashboardSummary.requestDescription}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {readableDashboardSummary.extendedRequestLabel}
                </CardTitle>
                <Clock className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight">
                  {formatMetricNumber(
                    readableDashboardSummary.extendedRequestCount,
                  )}
                </div>
                <CardDescription className="mt-1">
                  {readableDashboardSummary.extendedRequestDescription}
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
