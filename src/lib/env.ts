import z from "zod";

export const envSchema = z.object({
  APP_ENV: z.enum(["development", "production", "test"]),
  SERVER_API_URL: z.url().default("http://momoi-development:3000"),
  AUTH_API_URL: z.url().default("http://arisu:3001"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
  OTEL_SERVICE_NAME: z.string().default("midori-dev"),
  LOKI_URL: z.url().optional(),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
});

export type Env = z.infer<typeof envSchema>;

export const getEnv = (): Env => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      z.formatError(parsed.error),
    );
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
};

export const env = getEnv();
