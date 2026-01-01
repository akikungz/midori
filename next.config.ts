import { env } from "@midori/lib/env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  rewrites: async () => {
    if (env.APP_ENV === "production" || !env.SERVER_API_URL) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${env.SERVER_API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
