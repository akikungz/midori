import { metrics } from "@opentelemetry/api";

import { getOtelServiceName } from "@midori/lib/otel-config";

const meter = metrics.getMeter("midori.telemetry");
const serviceName = getOtelServiceName();

const otelHttpRequestsTotal = meter.createCounter("http_requests_total", {
  description: "Total number of HTTP requests",
});

const otelHttpRequestDuration = meter.createHistogram(
  "http_request_duration_seconds",
  {
    description: "Duration of HTTP requests in seconds",
    unit: "s",
  },
);

const otelApiCallsTotal = meter.createCounter("api_calls_total", {
  description: "Total number of API calls to backend services",
});

const otelApiCallDuration = meter.createHistogram("api_call_duration_seconds", {
  description: "Duration of API calls to backend services in seconds",
  unit: "s",
});

const otelAuthEventsTotal = meter.createCounter("auth_events_total", {
  description: "Total number of authentication events",
});

const otelLogsTotal = meter.createCounter("logs_total", {
  description: "Total number of log messages",
});

const otelLogErrorsTotal = meter.createCounter("log_errors_total", {
  description: "Total number of error and fatal log messages",
});

interface HttpRequestMetric {
  method: string;
  path: string;
  status: string;
  durationSeconds: number;
}

interface ApiCallMetric {
  service: string;
  endpoint: string;
  status: string;
  durationSeconds: number;
}

interface AuthEventMetric {
  event: string;
  status: string;
}

interface LogMetric {
  level: string;
  errorType?: string;
}

export function recordHttpRequest(metric: HttpRequestMetric): void {
  otelHttpRequestsTotal.add(1, {
    method: metric.method,
    path: metric.path,
    status: metric.status,
  });
  otelHttpRequestDuration.record(metric.durationSeconds, {
    method: metric.method,
    path: metric.path,
    status: metric.status,
  });
}

export function recordApiCall(metric: ApiCallMetric): void {
  otelApiCallsTotal.add(1, {
    service: metric.service,
    endpoint: metric.endpoint,
    status: metric.status,
  });
  otelApiCallDuration.record(metric.durationSeconds, {
    service: metric.service,
    endpoint: metric.endpoint,
    status: metric.status,
  });
}

export function recordAuthEvent(metric: AuthEventMetric): void {
  otelAuthEventsTotal.add(1, {
    event: metric.event,
    status: metric.status,
  });
}

export function recordLogMetric(metric: LogMetric): void {
  otelLogsTotal.add(1, { level: metric.level, service: serviceName });

  if (metric.errorType) {
    otelLogErrorsTotal.add(1, {
      service: serviceName,
      error_type: metric.errorType,
    });
  }
}
