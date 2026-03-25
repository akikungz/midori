import { trace, context, SpanStatusCode } from "@opentelemetry/api";

import { emitOtelLog } from "@midori/lib/otel-logging";
import { recordLogMetric } from "@midori/lib/metrics";
import {
  getOtelDeploymentEnvironment,
  getOtelServiceName,
} from "@midori/lib/otel-config";

// Log level type
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";
type LogMethod = (message: unknown, detail?: unknown) => void;
type LogBindings = Record<string, unknown>;

export interface Logger {
  trace: LogMethod;
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  fatal: LogMethod;
  child(bindings: LogBindings): Logger;
}

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

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

function shouldLog(level: LogLevel): boolean {
  const isProduction = process.env.APP_ENV === "production";
  const configuredLevel = (process.env.LOG_LEVEL ||
    (isProduction ? "info" : "debug")) as LogLevel;

  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[configuredLevel];
}

function extractLogMessage(inputArgs: [unknown, unknown?]): {
  message: unknown;
  attributes?: Record<string, unknown>;
} {
  const [firstArg, secondArg] = inputArgs;

  if (typeof firstArg === "string") {
    return { message: firstArg };
  }

  if (firstArg instanceof Error) {
    return {
      message: firstArg.message,
      attributes: {
        err: {
          name: firstArg.name,
          message: firstArg.message,
          stack: firstArg.stack,
        },
      },
    };
  }

  if (firstArg && typeof firstArg === "object") {
    return {
      message: typeof secondArg === "string" ? secondArg : "Structured log",
      attributes: firstArg as Record<string, unknown>,
    };
  }

  return { message: secondArg ?? firstArg };
}

function createConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
  switch (level) {
    case "trace":
      return console.trace.bind(console);
    case "debug":
      return console.debug.bind(console);
    case "info":
      return console.info.bind(console);
    case "warn":
      return console.warn.bind(console);
    case "error":
    case "fatal":
      return console.error.bind(console);
  }
}

function createLogger(bindings: LogBindings = {}): Logger {
  const baseAttributes = {
    service: getOtelServiceName(),
    env: getOtelDeploymentEnvironment(),
    ...bindings,
  };

  const log = (level: LogLevel, firstArg: unknown, secondArg?: unknown) => {
    if (!shouldLog(level)) {
      return;
    }

    const { message, attributes } = extractLogMessage([firstArg, secondArg]);
    const mergedAttributes = {
      ...baseAttributes,
      ...attributes,
      ...getTraceContext(),
    };
    const errorType =
      level === "error" || level === "fatal"
        ? ((attributes?.err as { name?: string } | undefined)?.name ??
          (attributes?.error as { name?: string } | undefined)?.name ??
          "UnknownError")
        : undefined;

    recordLogMetric({ level, errorType });
    emitOtelLog(level, message, mergedAttributes);

    const consoleMethod = createConsoleMethod(level);
    if (attributes) {
      consoleMethod(message, mergedAttributes);
      return;
    }

    consoleMethod(message);
  };

  return {
    trace: (firstArg, secondArg) => log("trace", firstArg, secondArg),
    debug: (firstArg, secondArg) => log("debug", firstArg, secondArg),
    info: (firstArg, secondArg) => log("info", firstArg, secondArg),
    warn: (firstArg, secondArg) => log("warn", firstArg, secondArg),
    error: (firstArg, secondArg) => log("error", firstArg, secondArg),
    fatal: (firstArg, secondArg) => log("fatal", firstArg, secondArg),
    child: (childBindings) => createLogger({ ...bindings, ...childBindings }),
  };
}

let loggerInstance: Logger | null = null;

export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = createLogger();
  }
  return loggerInstance;
}

// Export a default logger instance
export const logger = getLogger();

// Create child logger with additional context
export function createChildLogger(bindings: Record<string, unknown>): Logger {
  return getLogger().child(bindings);
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

  getLogger()[level](logData, message);
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

// export default logger;
