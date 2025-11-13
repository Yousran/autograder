// file: lib/auth-client.ts
"use client";

import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";
import Cookies from "js-cookie";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  plugins: [anonymousClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;

// Helper functions for participant management (not user auth)
export function getParticipantId(): string | null {
  return Cookies.get("participantId") || null;
}

export function removeParticipantId(): void {
  Cookies.remove("participantId");
}
