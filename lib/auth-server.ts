// file: lib/auth-server.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { anonymous } from "better-auth/plugins";
import { prisma } from "./prisma";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Only enable Google OAuth if credentials are provided
const socialProviders =
  googleClientId && googleClientSecret
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      }
    : undefined;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  ...(socialProviders && { socialProviders }),
  plugins: [
    anonymous({
      // Allow guests to create anonymous accounts to join tests
      // These accounts will be linked to a user if they sign up later
    }),
  ],
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ],
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
if (process.env.NODE_ENV === "production" && !BETTER_AUTH_SECRET) {
  throw new Error(
    "Missing BETTER_AUTH_SECRET environment variable in production. Set BETTER_AUTH_SECRET to a strong secret."
  );
}

// Re-export `auth` configured with an optional secret value. In production we require a
// secret but in development it's optional to avoid making local dev harder.
export const configuredAuth = BETTER_AUTH_SECRET
  ? betterAuth({
      database: prismaAdapter(prisma, {
        provider: "postgresql",
      }),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      ...(socialProviders && { socialProviders }),
      plugins: [anonymous({})],
      trustedOrigins: [
        process.env.BETTER_AUTH_URL || "http://localhost:3000",
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      ],
      secret: BETTER_AUTH_SECRET,
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    })
  : undefined;

// Convenience getter so server code can get the "best" auth object to use on the server.
// This will return `configuredAuth` when present (production) and fall back to the
// non-secret `auth` implementation when running locally.
export function getServerAuth() {
  return configuredAuth ?? auth;
}
