import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "@midori/lib/env";
import { PrismaClient } from "./generated/client";

export const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: env.DATABASE_URL,
      max: 20,
      min: 4,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  ),
});
