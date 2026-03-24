import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { Metadata } from "@grpc/grpc-js";

export type OtelSignal = "traces" | "metrics" | "logs";
export type OtelProtocol = "http" | "grpc";
export type OtelAuthMode = "none" | "bearer" | "basic";

const OTEL_SERVICE_VERSION = "0.1.0";
const DEFAULT_OTEL_PROTOCOL: OtelProtocol = "http";
const DEFAULT_OTEL_AUTH_MODE: OtelAuthMode = "none";

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

function normalizeProtocol(value?: string): OtelProtocol {
  if (value === "grpc") {
    return "grpc";
  }

  if (value === "http") {
    return "http";
  }

  return DEFAULT_OTEL_PROTOCOL;
}

function normalizeAuthMode(value?: string): OtelAuthMode {
  if (value === "bearer") {
    return "bearer";
  }

  if (value === "basic") {
    return "basic";
  }

  return DEFAULT_OTEL_AUTH_MODE;
}

function resolveSignalEndpoint(
  signal: OtelSignal,
  protocol: OtelProtocol,
  explicitEndpoint?: string,
  fallbackEndpoint?: string,
): string | undefined {
  if (explicitEndpoint) {
    return protocol === "grpc"
      ? removeSignalSuffix(trimTrailingSlash(explicitEndpoint))
      : explicitEndpoint;
  }

  if (!fallbackEndpoint) {
    return undefined;
  }

  const normalizedBase = removeSignalSuffix(
    trimTrailingSlash(fallbackEndpoint),
  );

  if (protocol === "grpc") {
    return normalizedBase;
  }

  return `${normalizedBase}${OTEL_SIGNAL_PATHS[signal]}`;
}

export function getOtelProtocol(signal: OtelSignal): OtelProtocol {
  const fallbackProtocol = normalizeProtocol(
    process.env.OTEL_EXPORTER_OTLP_PROTOCOL,
  );

  switch (signal) {
    case "traces":
      return normalizeProtocol(
        process.env.OTEL_EXPORTER_OTLP_TRACES_PROTOCOL ?? fallbackProtocol,
      );
    case "metrics":
      return normalizeProtocol(
        process.env.OTEL_EXPORTER_OTLP_METRICS_PROTOCOL ?? fallbackProtocol,
      );
    case "logs":
      return normalizeProtocol(
        process.env.OTEL_EXPORTER_OTLP_LOGS_PROTOCOL ?? fallbackProtocol,
      );
  }
}

export function getOtelAuthMode(): OtelAuthMode {
  return normalizeAuthMode(process.env.OTEL_EXPORTER_OTLP_AUTH_MODE);
}

function getOtelAuthorizationHeader(): string | undefined {
  const authMode = getOtelAuthMode();

  if (authMode === "bearer") {
    const token = process.env.OTEL_EXPORTER_OTLP_AUTH_TOKEN;
    return token ? `Bearer ${token}` : undefined;
  }

  if (authMode === "basic") {
    const username = process.env.OTEL_EXPORTER_OTLP_AUTH_USERNAME;
    const password = process.env.OTEL_EXPORTER_OTLP_AUTH_PASSWORD;

    if (!username || password === undefined) {
      return undefined;
    }

    const credentials = Buffer.from(`${username}:${password}`).toString(
      "base64",
    );
    return `Basic ${credentials}`;
  }

  return undefined;
}

export function hasOtelAuthentication(): boolean {
  return Boolean(getOtelAuthorizationHeader());
}

export function getOtelHttpHeaders(): Record<string, string> | undefined {
  const authorization = getOtelAuthorizationHeader();

  if (!authorization) {
    return undefined;
  }

  return {
    authorization,
  };
}

export function getOtelGrpcMetadata(): Metadata | undefined {
  const authorization = getOtelAuthorizationHeader();

  if (!authorization) {
    return undefined;
  }

  const metadata = new Metadata();
  metadata.set("authorization", authorization);
  return metadata;
}

export function getOtelCollectorEndpoints(): Partial<
  Record<OtelSignal, string>
> {
  const fallbackEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  return {
    traces: resolveSignalEndpoint(
      "traces",
      getOtelProtocol("traces"),
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
      fallbackEndpoint,
    ),
    metrics: resolveSignalEndpoint(
      "metrics",
      getOtelProtocol("metrics"),
      process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
      fallbackEndpoint,
    ),
    logs: resolveSignalEndpoint(
      "logs",
      getOtelProtocol("logs"),
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
