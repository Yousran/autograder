import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// Do NOT import the server-side auth here; `better-auth` uses dynamic code evaluation
// and is not allowed in the Edge runtime. Use cookie presence checks in middleware
// for a light-weight auth gate and use real session validation in API routes.

// Always log auth session presence from the middleware. This is a lightweight
// log that prints whether a session cookie is present and a short preview
// (first 8 chars) of the cookie value plus the length. This is safe to
// enable because we mask the token and do not log the full cookie contents.



export async function middleware(request: NextRequest) {
  // Light-weight cookie presence check. We avoid importing Better Auth code here
  // because Edge (middleware) doesn't allow the dynamic evaluation it uses.
  const sessionToken = request.cookies.get("better-auth.session_token");
  const tokenValue = typeof sessionToken === "string" ? sessionToken : sessionToken?.value;
  const sessionPresent = !!tokenValue;

  // Always log. The middleware runs for the matcher routes only,
  // so this remains focused and not overly verbose.
  {
    // Don't log the whole session token (sensitive). Log length and a small preview.
    const tokenPreview = tokenValue
      ? `${tokenValue.slice(0, 8)}...(${tokenValue.length} chars)`
      : "<none>";
    console.log(
      "[AuthMiddleware] path=",
      request.nextUrl.pathname,
      "sessionPresent=",
      sessionPresent,
      "tokenPreview=",
      tokenPreview
    );
  }

  if (!sessionPresent) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/test/create", "/test/:joinCode/edit"],
};
