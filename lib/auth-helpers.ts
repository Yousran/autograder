import { getServerAuth } from "./auth-server";
import { headers as getHeaders } from "next/headers";

/**
 * Get the current session from Better Auth
 * Use this in API routes and server components
 */
export async function getSession(req?: Request) {
  const headersList = req ? req.headers : await getHeaders();

  // Use the server auth instance when running on the server.
  // `getServerAuth()` returns `configuredAuth` when the secret is present,
  // otherwise falls back to `auth` (dev-friendly).
  const serverAuth = getServerAuth();

  const session = await serverAuth.api.getSession({
    headers: headersList,
  });

  return session;
}

/**
 * Get the current user from session
 * Returns null if no session exists
 */
export async function getCurrentUser(req?: Request) {
  const session = await getSession(req);
  return session?.user || null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(req?: Request): Promise<boolean> {
  const session = await getSession(req);
  return !!session;
}
