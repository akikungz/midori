import { z } from 'zod';

const envSchema = z.object({
  // Base URL for the backend and frontend
  BACKEND_API_URL: z.url({
    message: 'BACKEND_API_URL must be a valid URL'
  }).default('http://localhost:3000'),
  FRONTEND_BASE_URL: z.url({
    message: 'FRONTEND_BASE_URL must be a valid URL'
  }).default('http://localhost:3001'),
});

const envVariables = envSchema.safeParse(process.env);
if (!envVariables.success) {
  console.error('Invalid environment variables:', envVariables.error.message);
  process.exit(1);
}

export const env = envVariables.data;
export type EnvVariables = z.infer<typeof envSchema>;

export default env;