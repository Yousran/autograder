import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerAuth } from "@/lib/auth-server";

// Enable detailed auth logging in production only when the env var is present.
// Set LOG_AUTH_SESSIONS=true in production to enable.
const LOG_AUTH_SESSIONS =
  process.env.NODE_ENV === "production" &&
  process.env.LOG_AUTH_SESSIONS === "true";

function maskEmail(email?: string | null) {
  if (!email) return "<no-email>";
  const [local, domain] = email.split("@");
  if (!local || !domain) return "<invalid-email>";
  return `${local.charAt(0)}***@${domain}`;
}

export async function middleware(request: NextRequest) {
  // Check for Better Auth session using the server auth instance. We prefer
  // verifying the session rather than relying on the cookie presence only.
  const serverAuth = getServerAuth();
  const session = await serverAuth.api.getSession({
    headers: request.headers,
  });

  if (LOG_AUTH_SESSIONS) {
    const userId = (session && session.user && session.user.id) || "<anon>";
    const maskedEmail = session ? maskEmail(session.user?.email) : "<none>";
    console.log(
      "[AuthMiddleware] path=",
      request.nextUrl.pathname,
      "userId=",
      userId,
      "email=",
      maskedEmail
    );
  }

  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/test/create", "/test/:joinCode/edit"],
};
