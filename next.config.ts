import { env } from "@midori/lib/env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  rewrites: async () => {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${env.API_URL}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
