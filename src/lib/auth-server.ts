import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "./env";
import { prisma } from "./prisma";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/auth-api",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: env.JWT_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 3, // 3 hours
      strategy: "jwt",
    },
  },
  trustedOrigins: env.ALLOW_CORS_ORIGINS,
  socialProviders: {
    google: {
      // biome-ignore lint/style/noNonNullAssertion: Google client ID is required if Google client secret is provided
      clientId: env.GOOGLE_CLIENT_ID!,
      // biome-ignore lint/style/noNonNullAssertion: Google client secret is required if Google client ID is provided
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      scope: ["email", "profile"],
      accessType: "offline",
      prompt: "select_account",
      pkce: true,
    },
  },
  emailAndPassword: {
    enabled: env.APP_ENV !== "production",
    requireEmailVerification: false,
  },
  advanced: {
    disableCSRFCheck: true,
    ...(
      env.APP_ENV === "production"
        ? {
          defaultCookieAttributes: {
            sameSite: "lax",
            secure: true,
            path: "/",
          },
          useSecureCookies: true,
        } : {
          defaultCookieAttributes: {
            sameSite: "lax",
            secure: env.BETTER_AUTH_URL?.startsWith("https://") || false,
            path: "/",
          },
          useSecureCookies: env.BETTER_AUTH_URL?.startsWith("https://") || false,
        }
    )
  },
  logger: {
    disabled: false,
    level: "debug",
    log: (level, message, ...args) => {
      console.log(`[better-auth][${level.toUpperCase()}]:`, message, ...args);
    },
  },
});