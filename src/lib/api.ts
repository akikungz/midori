import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";

import type { paths } from "@midori/types/api";

export const fetchClinet = createFetchClient<paths>();

export const api = createClient(fetchClinet);
