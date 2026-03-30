"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  Network,
  RefreshCw,
  Server,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { components } from "@midori/types/api";
import { fetchClient } from "@midori/lib/api";
import { formatDateTime, formatFileSize } from "@midori/lib/format";
import type { ProxmoxMetricInventoryGroup } from "@midori/lib/proxmox-monitoring";
import {
  proxmoxMetricCounts,
  proxmoxMetricLegend,
} from "@midori/lib/proxmox-monitoring";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@midori/components/ui/alert";
import { Badge } from "@midori/components/ui/badge";
import { Button } from "@midori/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midori/components/ui/select";

type ProxmoxOverview =
  components["schemas"]["MonitoringProxmoxOverviewResponse"];

interface ProxmoxMonitoringDashboardProps {
  overview?: ProxmoxOverview;
  inventory: ProxmoxMetricInventoryGroup[];
  errorMessage?: string;
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

interface AdminMonitoringSnapshot {
  overview?: ProxmoxOverview;
  series: MetricSeriesConfig[];
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

function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "N/A";
  }

  return `${value.toFixed(1)}%`;
}

function formatNumber(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "N/A";
  }

  return Intl.NumberFormat("en-US").format(value);
}

function formatBytes(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "N/A";
  }

  return formatFileSize(value);
}

function formatMetricLabel(value: number, unit: MetricSeriesConfig["unit"]) {
  if (unit === "percent") {
    return `${value.toFixed(1)}%`;
  }

  return formatNumber(value);
}

function percentFromParts(
  used: number | null | undefined,
  total: number | null | undefined,
) {
  if (used == null || total == null || total <= 0) {
    return null;
  }

  return (used / total) * 100;
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

async function fetchAdminMonitoringSnapshot(): Promise<AdminMonitoringSnapshot> {
  const end = new Date();
  const start = new Date(end.getTime() - RANGE_WINDOW_MS);

  const [overviewResponse, ...seriesResponses] = await Promise.all([
    fetchClient.GET("/api/monitoring/proxmox/overview"),
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
        : "Failed to load Proxmox monitoring data.",
    );
  }

  const typedSeriesResponses = seriesResponses as Array<{
    data?: components["schemas"]["MonitoringQueryResponse"];
  }>;

  return {
    overview: overviewResponse.data,
    series: METRIC_SERIES_DEFINITIONS.map((series, index) => ({
      id: series.id,
      title: series.title,
      description: series.description,
      unit: series.unit,
      points: parseRangePoints(typedSeriesResponses[index]?.data?.data?.result),
    })),
  };
}

function UsageBar({
  label,
  used,
  total,
}: {
  label: string;
  used: number | null | undefined;
  total: number | null | undefined;
}) {
  const percent = percentFromParts(used, total);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {formatBytes(used)} / {formatBytes(total)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${Math.max(0, Math.min(percent ?? 0, 100))}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {formatPercent(percent)} used
      </p>
    </div>
  );
}

function MetricStatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Server;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function MetricTrendCard({ series }: { series: MetricSeriesConfig }) {
  const points = series.points;
  const values = points.map((point) => point.value);
  const latest = values.at(-1);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const chartData = points.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    value: Number(point.value.toFixed(2)),
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{series.title}</CardTitle>
            <CardDescription className="mt-1">
              {series.description}
            </CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            {latest != null
              ? formatMetricLabel(latest, series.unit)
              : "No data"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-44 rounded-xl border bg-muted/20 p-3">
          {points.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  width={44}
                  tickFormatter={(value: number) =>
                    formatMetricLabel(value, series.unit)
                  }
                />
                <Tooltip
                  formatter={(value) =>
                    typeof value === "number"
                      ? formatMetricLabel(value, series.unit)
                      : "N/A"
                  }
                  labelClassName="text-foreground"
                  contentStyle={{
                    borderRadius: "0.75rem",
                    borderColor: "var(--border)",
                    backgroundColor: "var(--card)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Waiting for time-series samples
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Latest</p>
            <p className="mt-1 font-medium">
              {latest != null ? formatMetricLabel(latest, series.unit) : "N/A"}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Min</p>
            <p className="mt-1 font-medium">
              {formatMetricLabel(min, series.unit)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Max</p>
            <p className="mt-1 font-medium">
              {formatMetricLabel(max, series.unit)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function renderDetailValue(value: unknown) {
  if (value == null) {
    return "N/A";
  }

  if (typeof value === "number") {
    return formatNumber(value);
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `${value.length} items`;
  }

  if (typeof value === "object") {
    return `${Object.keys(value).length} fields`;
  }

  return "Available";
}

export function ProxmoxMonitoringDashboard({
  overview,
  inventory,
  errorMessage,
}: ProxmoxMonitoringDashboardProps) {
  const [autoRefreshMs, setAutoRefreshMs] = useState<number>(15000);

  const {
    data: liveSnapshot,
    refetch,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["admin-proxmox-monitoring"],
    queryFn: fetchAdminMonitoringSnapshot,
    initialData: {
      overview,
      series: METRIC_SERIES_DEFINITIONS.map((series) => ({
        id: series.id,
        title: series.title,
        description: series.description,
        unit: series.unit,
        points: [],
      })),
    } satisfies AdminMonitoringSnapshot,
    refetchInterval: autoRefreshMs > 0 ? autoRefreshMs : false,
    refetchOnWindowFocus: false,
  });

  const summary = liveSnapshot.overview?.summary;
  const countEntries = Object.entries(
    liveSnapshot.overview?.countsByType ?? {},
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Proxmox Monitoring
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Human-readable cluster monitoring with live refresh controls,
            Recharts time-series panels, and metric inventory context from
            `values.json`.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
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
          <Badge variant="outline" className="w-fit">
            Snapshot{" "}
            {liveSnapshot.overview
              ? formatDateTime(liveSnapshot.overview.generatedAt)
              : "Unavailable"}
          </Badge>
        </div>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <Activity />
          <AlertTitle>Initial monitoring snapshot was unavailable</AlertTitle>
          <AlertDescription>
            <p>{errorMessage}</p>
            <p>
              The dashboard will keep trying to refresh live data while the
              metric inventory remains available below.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <Activity />
          <AlertTitle>Live refresh failed</AlertTitle>
          <AlertDescription>
            <p>
              The latest successful monitoring snapshot is still shown, but the
              most recent refresh attempt did not complete.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard
          title="Cluster Footprint"
          value={`${formatNumber(summary?.nodeCount)} / ${formatNumber(summary?.guestCount)}`}
          description="Nodes and total guests currently represented in the snapshot."
          icon={Server}
        />
        <MetricStatCard
          title="Guest Mix"
          value={`${formatNumber(summary?.vmCount)} VMs`}
          description={`${formatNumber(summary?.lxcCount)} LXCs are active in the same snapshot.`}
          icon={Cpu}
        />
        <MetricStatCard
          title="Average Host CPU"
          value={formatPercent(summary?.averageNodeCpuPercent)}
          description={`Guest average is ${formatPercent(summary?.averageGuestCpuPercent)} across VM and LXC workloads.`}
          icon={Activity}
        />
        <MetricStatCard
          title="Guest Memory Reserved"
          value={formatBytes(summary?.guestMemoryCapacityBytes)}
          description={`Guests are using ${formatBytes(summary?.guestMemoryUsedBytes)} of reserved memory capacity.`}
          icon={Database}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {liveSnapshot.series.map((series) => (
          <MetricTrendCard key={series.id} series={series} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Capacity Summary</CardTitle>
            <CardDescription>
              Current resource usage converted into plain language and progress
              bars.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <UsageBar
              label="Host memory"
              used={summary?.nodeMemoryUsedBytes}
              total={summary?.nodeMemoryTotalBytes}
            />
            <UsageBar
              label="Guest memory"
              used={summary?.guestMemoryUsedBytes}
              total={summary?.guestMemoryCapacityBytes}
            />
            <UsageBar
              label="Cluster storage"
              used={summary?.nodeStorageUsedBytes}
              total={summary?.nodeStorageTotalBytes}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metric Coverage</CardTitle>
            <CardDescription>
              Proxmox series discovered from `values.json`, grouped by exporter
              family.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Total Proxmox metrics
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {formatNumber(proxmoxMetricCounts.total)}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Node metrics</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatNumber(proxmoxMetricCounts.node)}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Guest metrics</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatNumber(proxmoxMetricCounts.vm)}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Storage metrics</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatNumber(proxmoxMetricCounts.storage)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Types in Snapshot</CardTitle>
            <CardDescription>
              Current VM and LXC mix returned by the overview endpoint.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {countEntries.length > 0 ? (
              countEntries.map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div>
                    <p className="font-medium capitalize">{type}</p>
                    <p className="text-sm text-muted-foreground">
                      Guest count by reported type
                    </p>
                  </div>
                  <Badge variant="secondary">{formatNumber(count)}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No type breakdown returned in the current snapshot.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
