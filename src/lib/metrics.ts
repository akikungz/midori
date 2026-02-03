import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
} from "prom-client";

// Create a new registry for metrics
export const metricsRegistry = new Registry();

// Add default metrics (CPU, memory, event loop, etc.)
collectDefaultMetrics({
  register: metricsRegistry,
});

// Custom metrics for HTTP requests
export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "path", "status"] as const,
  registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "path", "status"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

// Custom metrics for API calls to backend
export const apiCallsTotal = new Counter({
  name: "api_calls_total",
  help: "Total number of API calls to backend services",
  labelNames: ["service", "endpoint", "status"] as const,
  registers: [metricsRegistry],
});

export const apiCallDuration = new Histogram({
  name: "api_call_duration_seconds",
  help: "Duration of API calls to backend services in seconds",
  labelNames: ["service", "endpoint", "status"] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

// Auth metrics
export const authEventsTotal = new Counter({
  name: "auth_events_total",
  help: "Total number of authentication events",
  labelNames: ["event", "status"] as const,
  registers: [metricsRegistry],
});

// Get all metrics
export async function getMetrics(): Promise<string> {
  return await metricsRegistry.metrics();
}

// Get content type for metrics
export function getMetricsContentType(): string {
  return metricsRegistry.contentType;
}
