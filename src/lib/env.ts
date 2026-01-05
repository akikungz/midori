import z from "zod";

export const envSchema = z.object({
  APP_ENV: z.enum(["development", "production", "test"]),
  SERVER_API_URL: z.url().default("http://momoi-development:3000"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
  OTEL_SERVICE_NAME: z.string().default("midori-dev"),
  JWT_SECRET: z.string().min(32).optional(),
  DATABASE_URL: z.url({ pattern: /^postgres(?:ql):\/\// }).optional(),
  BETTER_AUTH_URL: z.url().optional(),
  ALLOW_CORS_ORIGINS: z
    .string()
    .transform((val) => val.split(",").map((s) => s.trim()))
    .default(["*"]),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
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
