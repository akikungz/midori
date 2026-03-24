import { context } from "@opentelemetry/api";
import {
  logs,
  SeverityNumber,
  type AnyValueMap,
} from "@opentelemetry/api-logs";

import type { LogLevel } from "@midori/lib/logger";

const otelLogger = logs.getLogger("midori.logger");

function getSeverityNumber(level: LogLevel): SeverityNumber {
  switch (level) {
    case "trace":
      return SeverityNumber.TRACE;
    case "debug":
      return SeverityNumber.DEBUG;
    case "info":
      return SeverityNumber.INFO;
    case "warn":
      return SeverityNumber.WARN;
    case "error":
      return SeverityNumber.ERROR;
    case "fatal":
      return SeverityNumber.FATAL;
  }
}

function toLogBody(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Error) {
    return value.message;
  }

  if (value === undefined) {
    return "";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toAttributeValue(value: unknown): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => toAttributeValue(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        toAttributeValue(nestedValue),
      ]),
    );
  }

  return String(value);
}

export function emitOtelLog(
  level: LogLevel,
  message: unknown,
  attributes?: Record<string, unknown>,
): void {
  const normalizedAttributes = attributes
    ? (Object.fromEntries(
        Object.entries(attributes).map(([key, value]) => [
          key,
          toAttributeValue(value),
        ]),
      ) as AnyValueMap)
    : undefined;

  otelLogger.emit({
    severityNumber: getSeverityNumber(level),
    severityText: level.toUpperCase(),
    body: toLogBody(message),
    attributes: normalizedAttributes,
    context: context.active(),
    timestamp: new Date(),
    observedTimestamp: new Date(),
  });
}
