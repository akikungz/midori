import z from "zod";

export const envSchema = z.object({
  APP_ENV: z.enum(["development", "production", "test"]),
  SERVER_API_URL: z.url(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.url().default("http://localhost:4318/v1/traces"),
  OTEL_SERVICE_NAME: z.string().default("midori-dev"),
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
