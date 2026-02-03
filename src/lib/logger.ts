import pino, { type Logger, type LoggerOptions } from "pino";
import { trace, context, SpanStatusCode } from "@opentelemetry/api";
import { Counter } from "prom-client";
import { metricsRegistry } from "./metrics";

// Log level type
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

// Metrics for logs
export const logsTotal = new Counter({
  name: "logs_total",
  help: "Total number of log messages",
  labelNames: ["level", "service"] as const,
  registers: [metricsRegistry],
});

export const logErrorsTotal = new Counter({
  name: "log_errors_total",
  help: "Total number of error and fatal log messages",
  labelNames: ["service", "error_type"] as const,
  registers: [metricsRegistry],
});

// Get trace context from OpenTelemetry
function getTraceContext(): Record<string, string> {
  const span = trace.getSpan(context.active());
  if (!span) return {};

  const spanContext = span.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags.toString(),
  };
}

// Create logger configuration
function createLoggerConfig(): LoggerOptions {
  const serviceName = process.env.OTEL_SERVICE_NAME || "midori";
  const lokiUrl = process.env.LOKI_URL;
  const isProduction = process.env.APP_ENV === "production";
  const logLevel = process.env.LOG_LEVEL || (isProduction ? "info" : "debug");

  // Base config without transports (for fallback or simple logging)
  const baseConfig: LoggerOptions = {
    level: logLevel,
    base: {
      service: serviceName,
      env: process.env.APP_ENV || "development",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Use mixin to add trace context (compatible with transports)
    mixin: () => getTraceContext(),
    hooks: {
      logMethod(inputArgs, method, level) {
        // Increment metrics for each log
        const levelName = pino.levels.labels[level] as LogLevel;
        logsTotal.inc({ level: levelName, service: serviceName });

        // Track errors separately
        if (levelName === "error" || levelName === "fatal") {
          const firstArg = inputArgs[0] as Record<string, unknown> | undefined;
          const err = firstArg?.err as { name?: string } | undefined;
          const error = firstArg?.error as { name?: string } | undefined;
          const errorType = err?.name || error?.name || "UnknownError";
          logErrorsTotal.inc({ service: serviceName, error_type: errorType });
        }

        return method.apply(this, inputArgs);
      },
    },
  };

  // Only add Loki transport if configured
  if (lokiUrl) {
    try {
      const lokiTransportPath = require.resolve("pino-loki");
      return {
        ...baseConfig,
        transport: {
          targets: [
            {
              target: "pino/file",
              options: { destination: "/dev/stdout" },
              level: logLevel,
            },
            {
              target: lokiTransportPath,
              options: {
                host: lokiUrl,
                batching: true,
                interval: 5,
                labels: {
                  service: serviceName,
                  env: process.env.APP_ENV || "development",
                },
              },
              level: logLevel,
            },
          ],
        },
      };
    } catch {
      console.warn("pino-loki transport not available, Loki logging disabled");
    }
  }

  // Return base config without transport (logs to stdout by default)
  return baseConfig;
}

// Create the main logger instance
let loggerInstance: Logger | null = null;

export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = pino(createLoggerConfig());
  }
  return loggerInstance;
}

// Export a default logger instance
export const logger = getLogger();

// Create child logger with additional context
export function createChildLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}

// Helper to log with trace context explicitly
export function logWithTrace(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
): void {
  const logData = {
    ...data,
    ...getTraceContext(),
  };

  logger[level](logData, message);
}

// Helper to create a span and log together
export function withSpanLogging<T>(
  spanName: string,
  operation: () => T | Promise<T>,
  attributes?: Record<string, string>,
): T | Promise<T> {
  const tracer = trace.getTracer("midori");

  return tracer.startActiveSpan(spanName, async (span) => {
    try {
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }

      logger.debug({ spanName, ...attributes }, `Starting: ${spanName}`);

      const result = await operation();

      span.setStatus({ code: SpanStatusCode.OK });
      logger.debug({ spanName }, `Completed: ${spanName}`);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
      span.recordException(error as Error);

      logger.error(
        {
          spanName,
          err: error,
          ...attributes,
        },
        `Failed: ${spanName}`,
      );

      throw error;
    } finally {
      span.end();
    }
  });
}

// Request logging helper for API routes
export interface RequestLogContext {
  method: string;
  path: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

export function logRequest(ctx: RequestLogContext, message?: string): void {
  logger.info(
    {
      http: {
        method: ctx.method,
        path: ctx.path,
        userAgent: ctx.userAgent,
        clientIp: ctx.ip,
      },
      userId: ctx.userId,
      ...getTraceContext(),
    },
    message || `${ctx.method} ${ctx.path}`,
  );
}

export function logResponse(
  ctx: RequestLogContext & { status: number; duration: number },
  message?: string,
): void {
  const level: LogLevel =
    ctx.status >= 500 ? "error" : ctx.status >= 400 ? "warn" : "info";

  logger[level](
    {
      http: {
        method: ctx.method,
        path: ctx.path,
        status: ctx.status,
        duration: ctx.duration,
      },
      userId: ctx.userId,
      ...getTraceContext(),
    },
    message || `${ctx.method} ${ctx.path} ${ctx.status} ${ctx.duration}ms`,
  );
}

// Error logging with full context
export function logError(
  error: Error,
  context?: Record<string, unknown>,
  message?: string,
): void {
  logger.error(
    {
      err: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
      ...getTraceContext(),
    },
    message || error.message,
  );
}

export default logger;
