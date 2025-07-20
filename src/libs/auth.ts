import { createAuthClient } from "better-auth/react";
import env from "./env";

export const authClient = createAuthClient({
  baseURL: `${env.BACKEND_API_URL}/api/v1/auth`,
});

export const { useSession } = authClient;