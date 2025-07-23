import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";

import env from "./env";

export const authClient = createAuthClient({
  baseURL: `${env.BACKEND_API_URL}/api/v1/auth`,
  plugins: [
    customSessionClient()
  ]
});

export const { useSession } = authClient;