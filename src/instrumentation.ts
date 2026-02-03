import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";

export async function register() {
  // Only run on server-side (Node.js runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      // Dynamically import env to avoid blocking on validation errors
      const { env } = await import("@midori/lib/env");

      // Initialize logger
      const { logger } = await import("@midori/lib/logger");
      logger.info(
        {
          serviceName: env.OTEL_SERVICE_NAME,
          lokiEnabled: !!env.LOKI_URL,
          otelEnabled: !!env.OTEL_EXPORTER_OTLP_ENDPOINT,
        },
        "Initializing observability stack",
      );

      if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) {
        logger.warn("OTEL_EXPORTER_OTLP_ENDPOINT not set, tracing disabled");
        return;
      }

      const exporter = new OTLPTraceExporter({
        url: env.OTEL_EXPORTER_OTLP_ENDPOINT,
      });

      const sdk = new NodeSDK({
        resource: resourceFromAttributes({
          [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME,
          [ATTR_SERVICE_VERSION]: "0.1.0",
        }),
        spanProcessor: new BatchSpanProcessor(exporter),
      });

      sdk.start();
      logger.info("OpenTelemetry SDK initialized successfully");
    } catch (error) {
      console.error(
        "⚠️  Failed to initialize OpenTelemetry instrumentation:",
        error instanceof Error ? error.message : String(error),
      );
      // Continue without instrumentation if setup fails
    }
  }
}
