import { ProxmoxMonitoringDashboard } from "@midori/components/admin/ProxmoxMonitoringDashboard";
import { AccessDeniedState } from "@midori/components/shared";
import { proxmoxMetricInventory } from "@midori/lib/proxmox-monitoring";
import { createServerApiClient } from "@midori/lib/server-api";
import { requireServerRole } from "@midori/lib/server-auth";

export default async function ProxmoxMonitoringPage() {
  const { isAllowed } = await requireServerRole("ADMIN");

  if (!isAllowed) {
    return <AccessDeniedState minHeightClassName="min-h-100" />;
  }

  const api = await createServerApiClient();
  const { data, error } = await api.GET("/api/monitoring/proxmox/overview");

  const errorMessage =
    typeof error === "object" && error && "message" in error
      ? String(error.message)
      : error
        ? "The monitoring API returned an unexpected error."
        : undefined;

  return (
    <ProxmoxMonitoringDashboard
      overview={data}
      inventory={proxmoxMetricInventory}
      errorMessage={errorMessage}
    />
  );
}
