import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";

import { env } from "@midori/lib/env";
import type { paths } from "@midori/types/api";

export const fetchClinet = createFetchClient<paths>({
  baseUrl: env.API_URL,
});

export const api = createClient(fetchClinet);
