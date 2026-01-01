import createFetchClient from "openapi-fetch";
import { cookies } from "next/headers";

import type { paths } from "@midori/types/api";
import { env } from "./env";

/**
 * Creates a server-side API client for use in React Server Components.
 * Automatically forwards cookies for authentication.
 */
export async function createServerApiClient() {
  const baseUrl = env.SERVER_API_URL || "";
  const cookieStore = await cookies();

  return createFetchClient<paths>({
    baseUrl,
    headers: {
      cookie: cookieStore.toString(),
    },
  });
}

/**
 * Get the current user session on the server side.
 * Returns null if not authenticated.
 */
export async function getServerSession() {
  try {
    const api = await createServerApiClient();
    const { data, error } = await api.GET("/api/user/me");

    if (error || !data) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
