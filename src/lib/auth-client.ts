import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  basePath: "/_api/auth",
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});
