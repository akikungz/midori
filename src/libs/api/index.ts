import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";

import env from "../env";
import type { paths } from "./types";

const fetchClient = createFetchClient<paths>({
  baseUrl: env.API_URL,
  credentials: "include",
});

export const apiClient = createClient<paths>(fetchClient);

export type ApiClient = typeof apiClient;

export * from "./types";

export default apiClient;
