import values from "@midori/assets/prometheus_values.json";

export interface ProxmoxMetricInventoryGroup {
  id: string;
  title: string;
  description: string;
  prefixes: string[];
  examples: string[];
  metrics: string[];
}

interface ValuesFile {
  status: string;
  data: string[];
}

const proxmoxMetricNames = (values as ValuesFile).data
  .filter((metric) => metric.startsWith("otelcol_proxmox_"))
  .sort();

const metricPrefixes = {
  nodeCpu: ["otelcol_proxmox_node_cpustat_"],
  nodeMemory: ["otelcol_proxmox_node_memory_"],
  nodeStorage: ["otelcol_proxmox_node_blockstat_", "otelcol_proxmox_storage_"],
  nodeNetwork: ["otelcol_proxmox_node_network_"],
  guestRuntime: [
    "otelcol_proxmox_vm_cpu_",
    "otelcol_proxmox_vm_cpus_",
    "otelcol_proxmox_vm_uptime_",
    "otelcol_proxmox_vm_shares_",
  ],
  guestMemory: [
    "otelcol_proxmox_vm_mem_",
    "otelcol_proxmox_vm_maxmem_",
    "otelcol_proxmox_vm_freemem_",
    "otelcol_proxmox_vm_swap_",
    "otelcol_proxmox_vm_maxswap_",
    "otelcol_proxmox_vm_memhost_",
    "otelcol_proxmox_vm_balloon_",
    "otelcol_proxmox_vm_ballooninfo_",
  ],
  guestDisk: [
    "otelcol_proxmox_vm_disk_",
    "otelcol_proxmox_vm_maxdisk_",
    "otelcol_proxmox_vm_diskread_",
    "otelcol_proxmox_vm_diskwrite_",
    "otelcol_proxmox_vm_blockstat_",
  ],
  guestNetwork: ["otelcol_proxmox_vm_netin_", "otelcol_proxmox_vm_netout_"],
  guestPressure: ["otelcol_proxmox_vm_pressure"],
} satisfies Record<string, string[]>;

function collectMetrics(prefixes: string[]) {
  return proxmoxMetricNames.filter((metric) =>
    prefixes.some((prefix) => metric.startsWith(prefix)),
  );
}

export const proxmoxMetricInventory: ProxmoxMetricInventoryGroup[] = [
  {
    id: "node-cpu",
    title: "Node CPU",
    description:
      "Host CPU saturation, load, and scheduler time exported from otelcol_proxmox_node_cpustat_*.",
    prefixes: metricPrefixes.nodeCpu,
    examples: [
      "otelcol_proxmox_node_cpustat_cpu_percent",
      "otelcol_proxmox_node_cpustat_avg1_ratio",
      "otelcol_proxmox_node_cpustat_iowait_seconds_total",
    ],
    metrics: collectMetrics(metricPrefixes.nodeCpu),
  },
  {
    id: "node-memory",
    title: "Node Memory",
    description:
      "Host RAM and swap usage, including available memory and ARC-related gauges.",
    prefixes: metricPrefixes.nodeMemory,
    examples: [
      "otelcol_proxmox_node_memory_memused_bytes",
      "otelcol_proxmox_node_memory_memavailable_bytes",
      "otelcol_proxmox_node_memory_swapused_bytes",
    ],
    metrics: collectMetrics(metricPrefixes.nodeMemory),
  },
  {
    id: "node-storage",
    title: "Node and Storage Pools",
    description:
      "Filesystem capacity plus Proxmox storage pool health, usage, and availability.",
    prefixes: metricPrefixes.nodeStorage,
    examples: [
      "otelcol_proxmox_node_blockstat_used_bytes",
      "otelcol_proxmox_storage_used_bytes",
      "otelcol_proxmox_storage_avail_bytes",
    ],
    metrics: collectMetrics(metricPrefixes.nodeStorage),
  },
  {
    id: "node-network",
    title: "Node Network",
    description:
      "Host receive/transmit counters for cluster ingress and egress activity.",
    prefixes: metricPrefixes.nodeNetwork,
    examples: [
      "otelcol_proxmox_node_network_receive_bytes_total",
      "otelcol_proxmox_node_network_transmit_bytes_total",
    ],
    metrics: collectMetrics(metricPrefixes.nodeNetwork),
  },
  {
    id: "guest-runtime",
    title: "Guest Runtime",
    description:
      "VM and LXC counts, CPU allocation, uptime, and scheduler share metrics.",
    prefixes: metricPrefixes.guestRuntime,
    examples: [
      "otelcol_proxmox_vm_cpu_percent",
      "otelcol_proxmox_vm_cpus_ratio",
      "otelcol_proxmox_vm_uptime_seconds",
    ],
    metrics: collectMetrics(metricPrefixes.guestRuntime),
  },
  {
    id: "guest-memory",
    title: "Guest Memory",
    description:
      "VM/LXC memory usage, capacity, host memory footprint, swap, and ballooning metrics.",
    prefixes: metricPrefixes.guestMemory,
    examples: [
      "otelcol_proxmox_vm_mem_bytes",
      "otelcol_proxmox_vm_maxmem_bytes",
      "otelcol_proxmox_vm_ballooninfo_free_mem_bytes",
    ],
    metrics: collectMetrics(metricPrefixes.guestMemory),
  },
  {
    id: "guest-disk",
    title: "Guest Disk",
    description:
      "Guest disk capacity, read/write throughput, and detailed block device counters.",
    prefixes: metricPrefixes.guestDisk,
    examples: [
      "otelcol_proxmox_vm_disk_bytes",
      "otelcol_proxmox_vm_diskread_bytes_total",
      "otelcol_proxmox_vm_blockstat_scsi0_wr_bytes_total",
    ],
    metrics: collectMetrics(metricPrefixes.guestDisk),
  },
  {
    id: "guest-network",
    title: "Guest Network",
    description:
      "VM/LXC network ingress and egress counters for tenant workload traffic.",
    prefixes: metricPrefixes.guestNetwork,
    examples: [
      "otelcol_proxmox_vm_netin_bytes_total",
      "otelcol_proxmox_vm_netout_bytes_total",
    ],
    metrics: collectMetrics(metricPrefixes.guestNetwork),
  },
  {
    id: "guest-pressure",
    title: "Guest Pressure",
    description:
      "CPU, memory, and IO pressure signals that help identify contention inside guests.",
    prefixes: metricPrefixes.guestPressure,
    examples: [
      "otelcol_proxmox_vm_pressurecpusome_percent",
      "otelcol_proxmox_vm_pressureiofull_ratio",
      "otelcol_proxmox_vm_pressurememoryfull_bytes",
    ],
    metrics: collectMetrics(metricPrefixes.guestPressure),
  },
];

export const proxmoxMetricLegend = [
  {
    suffix: "_bytes",
    meaning: "Capacity or memory values in bytes.",
  },
  {
    suffix: "_percent",
    meaning: "Percentage-style gauges ready for operator dashboards.",
  },
  {
    suffix: "_ratio",
    meaning:
      "Ratio metrics, often between 0 and 1, useful for normalized comparisons.",
  },
  {
    suffix: "_seconds / _seconds_total",
    meaning:
      "Durations or counters over time, often used with rate() in PromQL.",
  },
  {
    suffix: "_total",
    meaning:
      "Monotonic counters such as bytes transferred or operations completed.",
  },
] as const;

export const proxmoxMetricCounts = {
  total: proxmoxMetricNames.length,
  node: proxmoxMetricNames.filter((metric) =>
    metric.startsWith("otelcol_proxmox_node_"),
  ).length,
  vm: proxmoxMetricNames.filter((metric) =>
    metric.startsWith("otelcol_proxmox_vm_"),
  ).length,
  storage: proxmoxMetricNames.filter((metric) =>
    metric.startsWith("otelcol_proxmox_storage_"),
  ).length,
};
