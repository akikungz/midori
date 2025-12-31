import { env } from "@midori/lib/env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  rewrites: async () => {
    if (env.APP_ENV === "production" || !env.API_URL) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${env.API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
