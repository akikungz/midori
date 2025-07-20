import { edenFetch, treaty } from "@elysiajs/eden";

import type { App } from "@midori/types/server";

import { env } from "./env";

export const eden = treaty<App>(env.BACKEND_API_URL, {
  fetch: {
    credentials: "include",
  }
});
export const fetch = edenFetch<App>(env.BACKEND_API_URL, {
  credentials: "include",
});