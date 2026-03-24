import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

export type OtelSignal = "traces" | "metrics" | "logs";

const OTEL_SERVICE_VERSION = "0.1.0";

const OTEL_SIGNAL_PATHS: Record<OtelSignal, string> = {
  traces: "/v1/traces",
  metrics: "/v1/metrics",
  logs: "/v1/logs",
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function removeSignalSuffix(value: string): string {
  return value.replace(/\/v1\/(?:traces|metrics|logs)\/?$/, "");
}

function resolveSignalEndpoint(
  signal: OtelSignal,
  explicitEndpoint?: string,
  fallbackEndpoint?: string,
): string | undefined {
  if (explicitEndpoint) {
    return explicitEndpoint;
  }

  if (!fallbackEndpoint) {
    return undefined;
  }

  const normalizedBase = removeSignalSuffix(
    trimTrailingSlash(fallbackEndpoint),
  );
  return `${normalizedBase}${OTEL_SIGNAL_PATHS[signal]}`;
}

export function getOtelCollectorEndpoints(): Partial<
  Record<OtelSignal, string>
> {
  const fallbackEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  return {
    traces: resolveSignalEndpoint(
      "traces",
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
      fallbackEndpoint,
    ),
    metrics: resolveSignalEndpoint(
      "metrics",
      process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
      fallbackEndpoint,
    ),
    logs: resolveSignalEndpoint(
      "logs",
      process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
      fallbackEndpoint,
    ),
  };
}

export function isOtelCollectorConfigured(): boolean {
  const endpoints = getOtelCollectorEndpoints();
  return Boolean(endpoints.traces || endpoints.metrics || endpoints.logs);
}

export function getOtelServiceName(): string {
  return process.env.OTEL_SERVICE_NAME || "midori";
}

export function getOtelDeploymentEnvironment(): string {
  return process.env.APP_ENV || process.env.NODE_ENV || "development";
}

export function getOtelResourceAttributes(): Record<string, string> {
  return {
    [ATTR_SERVICE_NAME]: getOtelServiceName(),
    [ATTR_SERVICE_VERSION]: OTEL_SERVICE_VERSION,
    "deployment.environment.name": getOtelDeploymentEnvironment(),
  };
}

export function getOtelMetricExportIntervalMillis(): number {
  const configuredValue = Number(process.env.OTEL_METRIC_EXPORT_INTERVAL);

  if (Number.isFinite(configuredValue) && configuredValue > 0) {
    return configuredValue;
  }

  return 10_000;
}
