import env from "@midori/libs/env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  redirects: async () => {
    return [
      {
        source: "/api/:path*",
        destination: `${env.BACKEND_API_URL}/api/v1/:path*`,
        permanent: false,
      }
    ];
  }
};

export default nextConfig;
