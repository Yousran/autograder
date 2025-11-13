import { auth } from "./auth-server";
import { headers as getHeaders } from "next/headers";

/**
 * Get the current session from Better Auth
 * Use this in API routes and server components
 */
export async function getSession(req?: Request) {
  const headersList = req ? req.headers : await getHeaders();

  const session = await auth.api.getSession({
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
