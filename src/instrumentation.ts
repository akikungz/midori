import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";

import {
  getOtelCollectorEndpoints,
  getOtelMetricExportIntervalMillis,
  getOtelResourceAttributes,
  isOtelCollectorConfigured,
} from "@midori/lib/otel-config";

declare global {
  // eslint-disable-next-line no-var
  var __midoriOtelSdkStarted: boolean | undefined;
}

export async function register() {
  // Only run on server-side (Node.js runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      // Dynamically import env to avoid blocking on validation errors
      const { env } = await import("@midori/lib/env");
      const endpoints = getOtelCollectorEndpoints();

      // Initialize logger
      const { logger } = await import("@midori/lib/logger");
      logger.info(
        {
          serviceName: env.OTEL_SERVICE_NAME,
          otelCollectorConfigured: isOtelCollectorConfigured(),
          otelTraceEndpoint: endpoints.traces,
          otelMetricEndpoint: endpoints.metrics,
          otelLogEndpoint: endpoints.logs,
        },
        "Initializing observability stack",
      );

      if (!isOtelCollectorConfigured()) {
        logger.warn(
          "OTEL collector endpoints not set, traces, metrics, and logs export disabled",
        );
        return;
      }

      if (globalThis.__midoriOtelSdkStarted) {
        logger.debug("OpenTelemetry SDK already initialized");
        return;
      }

      const spanProcessors = endpoints.traces
        ? [
            new BatchSpanProcessor(
              new OTLPTraceExporter({
                url: endpoints.traces,
              }),
            ),
          ]
        : undefined;

      const metricReaders = endpoints.metrics
        ? [
            new PeriodicExportingMetricReader({
              exporter: new OTLPMetricExporter({
                url: endpoints.metrics,
              }),
              exportIntervalMillis: getOtelMetricExportIntervalMillis(),
            }),
          ]
        : undefined;

      const logRecordProcessors = endpoints.logs
        ? [
            new BatchLogRecordProcessor(
              new OTLPLogExporter({
                url: endpoints.logs,
              }),
            ),
          ]
        : undefined;

      const sdk = new NodeSDK({
        resource: resourceFromAttributes(getOtelResourceAttributes()),
        spanProcessors,
        metricReaders,
        logRecordProcessors,
      });

      sdk.start();
      globalThis.__midoriOtelSdkStarted = true;

      const shutdown = async () => {
        try {
          await sdk.shutdown();
        } catch (error) {
          console.error(
            "Failed to shut down OpenTelemetry SDK:",
            error instanceof Error ? error.message : String(error),
          );
        }
      };

      process.once("beforeExit", shutdown);
      process.once("SIGTERM", shutdown);
      process.once("SIGINT", shutdown);

      logger.info("OpenTelemetry SDK initialized successfully");
    } catch (error) {
      console.error(
        "Failed to initialize OpenTelemetry instrumentation:",
        error instanceof Error ? error.message : String(error),
      );
      // Continue without instrumentation if setup fails
    }
  }
}
