import {
  Terminal,
  Activity,
  Copy,
  LoaderCircle,
  RefreshCw,
  Play,
  Square,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { fetchClient, getApiErrorMessage } from "@midori/lib/api";
import { formatDateTime, formatFileSize } from "@midori/lib/format";
import { Button } from "@midori/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { Separator } from "@midori/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midori/components/ui/dialog";
import type { components } from "@midori/types/api";

import type { VmDetails, CourseOffering } from "./InstanceCard";
import type { ReverseProxy } from "./InstanceDialogs";

type InstanceMonitoring =
  components["schemas"]["GetInstanceMonitoringResponse"];

// ==================== VM Details Card ====================

interface VmDetailsCardProps {
  instanceId: number;
  vmDetails: VmDetails;
  showCredentials?: boolean;
  defaultUser?: string;
  defaultPassword?: string;
  reverseProxies?: ReverseProxy[];
}

export function VmDetailsCard({
  instanceId,
  vmDetails,
  showCredentials = false,
  defaultUser,
  defaultPassword,
  reverseProxies,
}: VmDetailsCardProps) {
  const [isSshGuideOpen, setIsSshGuideOpen] = useState(false);
  const [isMonitoringLoading, setIsMonitoringLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<{
    start: boolean;
    stop: boolean;
    restart: boolean;
  }>({ start: false, stop: false, restart: false });
  const [monitoringError, setMonitoringError] = useState<string | null>(null);
  const [monitoringData, setMonitoringData] =
    useState<InstanceMonitoring | null>(null);
  const queryClient = useQueryClient();

  const sshUser = defaultUser || "<your-user>";
  const sshHost = vmDetails.hostname || vmDetails.ip || "<instance-host>";
  const tunnelCommand = `ncat -l 127.0.0.1 2222 --sh-exec "ncat --ssl p22-${sshHost}.fitm.cloud 7443"`;
  const sshCommand = `ssh ${sshUser}@127.0.0.1 -p 2222`;

  const copyCommand = async (command: string, label: string) => {
    try {
      await navigator.clipboard.writeText(command);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const loadMonitoring = useCallback(async () => {
    setIsMonitoringLoading(true);
    setMonitoringError(null);

    const result = await fetchClient
      .GET("/api/instances/{instanceId}/monitoring", {
        params: {
          path: { instanceId },
        },
      })
      .catch((error) => {
        console.error("Failed to load monitoring data:", error);
        return null;
      });

    setIsMonitoringLoading(false);

    if (!result) {
      setMonitoringData(null);
      setMonitoringError("Unable to load monitoring data right now.");
      return;
    }

    const resultError = (result as { error?: unknown }).error;
    if (resultError) {
      setMonitoringData(null);
      setMonitoringError(
        getApiErrorMessage(resultError) ||
          "Unable to load monitoring data right now.",
      );
      return;
    }

    setMonitoringData(result.data || null);
  }, [instanceId]);

  useEffect(() => {
    void loadMonitoring();
  }, [loadMonitoring]);

  const cpuPercentText =
    monitoringData?.summary.cpuPercent != null
      ? `${monitoringData.summary.cpuPercent.toFixed(1)}%`
      : "N/A";

  const memoryText =
    monitoringData?.summary.memoryUsedBytes != null &&
    monitoringData.summary.memoryCapacityBytes != null
      ? `${formatFileSize(monitoringData.summary.memoryUsedBytes)} / ${formatFileSize(
          monitoringData.summary.memoryCapacityBytes,
        )}`
      : "N/A";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Virtual Machine Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Hostname" value={vmDetails.hostname} />
          <DetailItem label="IP Address" value={vmDetails.ip} mono />
          <DetailItem label="Operating System" value={vmDetails.os} />
          <DetailItem label="CPU Cores" value={`${vmDetails.cpus} vCPU`} />
          <DetailItem
            label="Memory"
            value={`${(vmDetails.memoryMB / 1024).toFixed(1)} GB`}
          />
          <DetailItem label="Disk Size" value={`${vmDetails.diskGB} GB`} />
        </div>

        {showCredentials && (defaultUser || defaultPassword) && (
          <>
            <Separator className="my-4" />
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Default User"
                value={defaultUser || "-"}
                mono
              />
              <DetailItem
                label="Default Password"
                value={defaultPassword || "-"}
                mono
              />
            </div>
          </>
        )}

        <Separator className="my-4" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Live Monitoring</h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSshGuideOpen(true)}
              >
                <Terminal className="mr-2 size-4" />
                SSH Connect
              </Button>
              {vmDetails.vmStatus && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsActionLoading((s) => ({ ...s, start: true }));
                      const result = await fetchClient.POST(
                        "/api/instances/{instanceId}/start",
                        { params: { path: { instanceId } } },
                      ).catch((e) => e);
                      setIsActionLoading((s) => ({ ...s, start: false }));
                      if (!result || (result as any).error) {
                        toast.error(getApiErrorMessage((result as any).error) || "Failed to start instance");
                        return;
                      }
                      toast.success("Start request submitted");
                      void queryClient.invalidateQueries({ queryKey: ["get", "/api/instances/{instanceId}"] });
                      void queryClient.invalidateQueries({ queryKey: ["get", "/api/instances/{instanceId}/monitoring"] });
                    }}
                    disabled={isActionLoading.start}
                  >
                    <Play className="mr-2 size-4" />
                    Start
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsActionLoading((s) => ({ ...s, stop: true }));
                      const result = await fetchClient.POST(
                        "/api/instances/{instanceId}/stop",
                        { params: { path: { instanceId } } },
                      ).catch((e) => e);
                      setIsActionLoading((s) => ({ ...s, stop: false }));
                      if (!result || (result as any).error) {
                        toast.error(getApiErrorMessage((result as any).error) || "Failed to stop instance");
                        return;
                      }
                      toast.success("Stop request submitted");
                      void queryClient.invalidateQueries({ queryKey: ["get", "/api/instances/{instanceId}"] });
                      void queryClient.invalidateQueries({ queryKey: ["get", "/api/instances/{instanceId}/monitoring"] });
                    }}
                    disabled={isActionLoading.stop}
                  >
                    <Square className="mr-2 size-4" />
                    Stop
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsActionLoading((s) => ({ ...s, restart: true }));
                      const result = await fetchClient.POST(
                        "/api/instances/{instanceId}/restart",
                        { params: { path: { instanceId } } },
                      ).catch((e) => e);
                      setIsActionLoading((s) => ({ ...s, restart: false }));
                      if (!result || (result as any).error) {
                        toast.error(getApiErrorMessage((result as any).error) || "Failed to restart instance");
                        return;
                      }
                      toast.success("Restart request submitted");
                      void queryClient.invalidateQueries({ queryKey: ["get", "/api/instances/{instanceId}"] });
                      void queryClient.invalidateQueries({ queryKey: ["get", "/api/instances/{instanceId}/monitoring"] });
                    }}
                    disabled={isActionLoading.restart}
                  >
                    <RefreshCw className="mr-2 size-4" />
                    Restart
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void loadMonitoring();
                }}
                disabled={isMonitoringLoading}
              >
                <RefreshCw
                  className={`mr-2 size-4 ${isMonitoringLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {isMonitoringLoading ? (
            <div className="flex items-center gap-2 rounded-md border px-3 py-4 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading monitoring data...
            </div>
          ) : monitoringError ? (
            <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
              {monitoringError}
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">CPU</p>
                  <p className="text-lg font-semibold">{cpuPercentText}</p>
                </div>

                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Memory</p>
                  <p className="text-sm font-semibold break-all">
                    {memoryText}
                  </p>
                </div>
              </div>

              <div className="rounded-md border px-3 py-2 text-xs text-muted-foreground">
                {monitoringData?.generatedAt
                  ? `Last updated: ${formatDateTime(monitoringData.generatedAt)}`
                  : "Last updated: N/A"}
              </div>
            </>
          )}
        </div>

        <Dialog open={isSshGuideOpen} onOpenChange={setIsSshGuideOpen}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>SSH via Netcat TLS Tunnel</DialogTitle>
              <DialogDescription>
                Use a TLS tunnel with Netcat/Ncat before SSH if your environment
                requires encrypted TCP forwarding.
              </DialogDescription>
            </DialogHeader>

            <div className="min-w-0 space-y-4 text-sm">
              <div>
                <p className="font-medium">1) Add TCP Port Forwarding Rule in Reverse Proxy tab</p>
                {
                  (reverseProxies && reverseProxies.length > 0 && reverseProxies.some((proxy) => proxy.type === "TCP" && proxy.targetPort === 22))
                    ? (
                      <p className="text-xs text-green-600 mt-1">
                        TCP forwarding rule for port 22 found.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-red-600 mt-1">
                          No TCP forwarding rule for port 22 detected.
                        </p>
                        <p className="text-muted-foreground mt-1">
                          Instance {">"} Reverse Proxy {">"} Add Rule {">"} TCP. <br />This will allow the tunnel to connect to your instance's SSH port.
                        </p>
                      </>
                    )
                }
              </div>

              <div>
                <p className="font-medium">2) Install Ncat (if missing)</p>
                <p className="text-muted-foreground">
                  Ncat is included with Nmap. Make sure <code>ncat</code> is
                  available in your shell.
                </p>
              </div>

              <div>
                <p className="font-medium">
                  3) Start local TLS tunnel to your instance SSH endpoint
                </p>
                <div className="relative mt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 z-10 size-7 border bg-background/70"
                    onClick={() =>
                      void copyCommand(tunnelCommand, "Tunnel command")
                    }
                  >
                    <Copy className="size-4" />
                    <span className="sr-only">Copy tunnel command</span>
                  </Button>
                  <pre className="w-full max-w-full overflow-x-auto rounded-md border bg-muted p-3 pr-14 text-xs">
                    <code>{tunnelCommand}</code>
                  </pre>
                </div>
                <p className="text-muted-foreground mt-1">
                  Keep this terminal running while you connect.
                </p>
              </div>

              <div>
                <p className="font-medium">4) Connect SSH through the tunnel</p>
                <div className="relative mt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 z-10 size-7 border bg-background/70"
                    onClick={() => void copyCommand(sshCommand, "SSH command")}
                  >
                    <Copy className="size-4" />
                    <span className="sr-only">Copy SSH command</span>
                  </Button>
                  <pre className="w-full max-w-full overflow-x-auto rounded-md border bg-muted p-3 pr-14 text-xs">
                    <code>{sshCommand}</code>
                  </pre>
                </div>
              </div>

              {/* <div className="rounded-md border border-amber-300/40 bg-amber-50/70 p-3 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
                If your deployment uses a different TCP endpoint/port for SSH,
                replace{" "}
                <code className="break-all">p22-{sshHost}.fitm.cloud</code> and{" "}
                <code>7443</code>{" "}
                with the values provided by your infrastructure admin.
              </div> */}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ==================== Course Information Card ====================

interface CourseInfoCardProps {
  courseOffering: CourseOffering;
  workSemester?: string;
}

export function CourseInfoCard({
  courseOffering,
  workSemester,
}: CourseInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Course Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-4">
          <DetailItem
            label="Course Code"
            value={courseOffering.courseCode}
            mono
          />
          <DetailItem
            label="Course Title"
            value={courseOffering.courseTitle}
            className="sm:col-span-2"
          />
          <DetailItem
            label="Instance Semester"
            value={
              workSemester
                ? `${courseOffering.semester} - ${workSemester}`
                : courseOffering.semester
            }
            mono
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Detail Item Component ====================

interface DetailItemProps {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}

function DetailItem({ label, value, mono, className }: DetailItemProps) {
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
