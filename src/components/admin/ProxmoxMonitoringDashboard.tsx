import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  Network,
  Server,
} from "lucide-react";

import type { components } from "@midori/types/api";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";

type ProxmoxOverview =
  components["schemas"]["MonitoringProxmoxOverviewResponse"];

interface ProxmoxMonitoringDashboardProps {
  overview?: ProxmoxOverview;
  inventory: ProxmoxMetricInventoryGroup[];
  errorMessage?: string;
}

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

function percentFromParts(
  used: number | null | undefined,
  total: number | null | undefined,
) {
  if (used == null || total == null || total <= 0) {
    return null;
  }

  return (used / total) * 100;
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
  const summary = overview?.summary;
  const queryEntries = Object.entries(overview?.queries ?? {});
  const detailEntries = Object.entries(overview?.details ?? {});
  const countEntries = Object.entries(overview?.countsByType ?? {}).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Proxmox Monitoring
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Cluster health dashboard powered by
            `/api/monitoring/proxmox/overview` and the `otelcol_proxmox_*`
            Prometheus metrics cataloged in `values.json`.
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Snapshot{" "}
          {overview ? formatDateTime(overview.generatedAt) : "Unavailable"}
        </Badge>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <Activity />
          <AlertTitle>Unable to load live Proxmox overview</AlertTitle>
          <AlertDescription>
            <p>{errorMessage}</p>
            <p>
              The metric inventory below still reflects the available Proxmox
              series from `values.json`.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard
          title="Cluster Nodes"
          value={formatNumber(summary?.nodeCount)}
          description="Nodes currently represented in the overview snapshot."
          icon={Server}
        />
        <MetricStatCard
          title="Guests"
          value={formatNumber(summary?.guestCount)}
          description={`${formatNumber(summary?.vmCount)} VMs and ${formatNumber(summary?.lxcCount)} LXCs`}
          icon={Cpu}
        />
        <MetricStatCard
          title="Avg Node CPU"
          value={formatPercent(summary?.averageNodeCpuPercent)}
          description="Average host CPU utilization across Proxmox nodes."
          icon={Activity}
        />
        <MetricStatCard
          title="Avg Guest CPU"
          value={formatPercent(summary?.averageGuestCpuPercent)}
          description="Average CPU utilization across VM and LXC guests."
          icon={Database}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Capacity Summary</CardTitle>
            <CardDescription>
              Memory and storage utilization derived from the overview response.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <UsageBar
              label="Node memory"
              used={summary?.nodeMemoryUsedBytes}
              total={summary?.nodeMemoryTotalBytes}
            />
            <UsageBar
              label="Guest memory"
              used={summary?.guestMemoryUsedBytes}
              total={summary?.guestMemoryCapacityBytes}
            />
            <UsageBar
              label="Node storage"
              used={summary?.nodeStorageUsedBytes}
              total={summary?.nodeStorageTotalBytes}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metric Coverage</CardTitle>
            <CardDescription>
              Proxmox series discovered from `values.json`, organized by
              exporter family.
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
              Counts returned by the Proxmox overview API, useful for checking
              guest mix.
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

        <Card>
          <CardHeader>
            <CardTitle>Prometheus Naming Guide</CardTitle>
            <CardDescription>
              Quick suffix reference distilled from `prometheus_values.md`.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {proxmoxMetricLegend.map((item) => (
              <div key={item.suffix} className="rounded-lg border px-4 py-3">
                <p className="font-mono text-sm font-medium">{item.suffix}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.meaning}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metric Families</CardTitle>
          <CardDescription>
            Dashboard-oriented grouping of the `otelcol_proxmox_*` metrics found
            in `values.json`.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {inventory.map((group) => (
            <div key={group.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{group.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {group.description}
                  </p>
                </div>
                <Badge variant="outline">{group.metrics.length}</Badge>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Example metrics
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.examples.map((metric) => (
                      <Badge
                        key={metric}
                        variant="secondary"
                        className="font-mono text-[11px]"
                      >
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Prefixes
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.prefixes.map((prefix) => (
                      <Badge
                        key={prefix}
                        variant="outline"
                        className="font-mono text-[11px]"
                      >
                        {prefix}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Sample series
                  </p>
                  <div className="mt-2 space-y-1">
                    {group.metrics.slice(0, 6).map((metric) => (
                      <p
                        key={metric}
                        className="font-mono text-xs text-muted-foreground"
                      >
                        {metric}
                      </p>
                    ))}
                    {group.metrics.length > 6 ? (
                      <p className="text-xs text-muted-foreground">
                        +{group.metrics.length - 6} additional series
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview Queries</CardTitle>
            <CardDescription>
              PromQL statements embedded in the overview payload.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {queryEntries.length > 0 ? (
              queryEntries.map(([name, query]) => (
                <div key={name} className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Network className="size-4 text-muted-foreground" />
                    <p className="font-medium">{name}</p>
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    <code>{query}</code>
                  </pre>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                The current response did not include query definitions.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Detail Keys</CardTitle>
            <CardDescription>
              Extra sections returned by the API for future expansion of this
              dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {detailEntries.length > 0 ? (
              detailEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <HardDrive className="size-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{key}</p>
                      <p className="text-sm text-muted-foreground">
                        Returned by the overview endpoint
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{renderDetailValue(value)}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No additional detail sections were included in this snapshot.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
