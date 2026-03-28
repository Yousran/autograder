/**
 * Auth Layout — Server Component Guard
 *
 * Redirects already-authenticated users away from /auth/signin and
 * /auth/signup so they cannot reach the login forms once signed in.
 *
 * Proxy already handles this via the session cookie, but this layout
 * provides a server-side safety net in case the cookie check is bypassed
 * (e.g. a fresh cookie that middleware hasn't seen yet).
 */
import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return <>{children}</>;
}
