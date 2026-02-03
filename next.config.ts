import { env } from "@midori/lib/env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  logging: {
    incomingRequests: true,
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
  // Exclude pino and transports from bundling for proper runtime resolution
  serverExternalPackages: ["pino", "pino-loki", "pino-pretty"],
  experimental: {
    proxyClientMaxBodySize: "1gb",
    optimizePackageImports: ["lucide-react"],
  },
  rewrites: async () => {
    if (process.env.NODE_ENV === "production") return [];

    return [
      {
        source: "/api/auth/:path*",
        destination: `${env.AUTH_API_URL}/api/auth/:path*`,
      },
      {
        // Exclude /api/metrics from proxy - handled by Next.js
        source: "/api/:path((?!metrics).*)",
        destination: `${env.SERVER_API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
