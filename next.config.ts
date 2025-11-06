import type { NextConfig } from "next";

import { env } from "@midori/libs/env";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination: `${env.API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
