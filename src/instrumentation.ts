import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter as OTLPGrpcLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc";
import { OTLPMetricExporter as OTLPGrpcMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { OTLPTraceExporter as OTLPGrpcTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";

import {
  getOtelCollectorEndpoints,
  getOtelAuthMode,
  getOtelGrpcMetadata,
  getOtelHttpHeaders,
  getOtelMetricExportIntervalMillis,
  getOtelProtocol,
  getOtelResourceAttributes,
  hasOtelAuthentication,
  isOtelCollectorConfigured,
  type OtelProtocol,
} from "@midori/lib/otel-config";

declare global {
  // eslint-disable-next-line no-var
  var __midoriOtelSdkStarted: boolean | undefined;
}

function createTraceExporter(protocol: OtelProtocol, url: string) {
  if (protocol === "grpc") {
    return new OTLPGrpcTraceExporter({
      url,
      metadata: getOtelGrpcMetadata(),
    });
  }

  return new OTLPTraceExporter({
    url,
    headers: getOtelHttpHeaders(),
  });
}

function createMetricExporter(protocol: OtelProtocol, url: string) {
  if (protocol === "grpc") {
    return new OTLPGrpcMetricExporter({
      url,
      metadata: getOtelGrpcMetadata(),
    });
  }

  return new OTLPMetricExporter({
    url,
    headers: getOtelHttpHeaders(),
  });
}

function createLogExporter(protocol: OtelProtocol, url: string) {
  if (protocol === "grpc") {
    return new OTLPGrpcLogExporter({
      url,
      metadata: getOtelGrpcMetadata(),
    });
  }

  return new OTLPLogExporter({
    url,
    headers: getOtelHttpHeaders(),
  });
}

export async function register() {
  // Only run on server-side (Node.js runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      // Dynamically import env to avoid blocking on validation errors
      const { env } = await import("@midori/lib/env");
      const endpoints = getOtelCollectorEndpoints();
      const authMode = getOtelAuthMode();
      const traceProtocol = getOtelProtocol("traces");
      const metricProtocol = getOtelProtocol("metrics");
      const logProtocol = getOtelProtocol("logs");

      // Initialize logger
      const { logger } = await import("@midori/lib/logger");
      logger.info(
        {
          serviceName: env.OTEL_SERVICE_NAME,
          otelCollectorConfigured: isOtelCollectorConfigured(),
          otelAuthEnabled: hasOtelAuthentication(),
          otelAuthMode: authMode,
          otelTraceEndpoint: endpoints.traces,
          otelTraceProtocol: traceProtocol,
          otelMetricEndpoint: endpoints.metrics,
          otelMetricProtocol: metricProtocol,
          otelLogEndpoint: endpoints.logs,
          otelLogProtocol: logProtocol,
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
              createTraceExporter(traceProtocol, endpoints.traces),
            ),
          ]
        : undefined;

      const metricReaders = endpoints.metrics
        ? [
            new PeriodicExportingMetricReader({
              exporter: createMetricExporter(metricProtocol, endpoints.metrics),
              exportIntervalMillis: getOtelMetricExportIntervalMillis(),
            }),
          ]
        : undefined;

      const logRecordProcessors = endpoints.logs
        ? [
            new BatchLogRecordProcessor(
              createLogExporter(logProtocol, endpoints.logs),
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
