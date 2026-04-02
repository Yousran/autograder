import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Retrieves the current user session from Better Auth.
 * Returns null if no valid session exists.
 *
 * @returns The session object if authenticated, null otherwise
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

type AuthSuccess = {
  ok: true;
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
};
type AuthFailure = { ok: false; response: NextResponse };

/**
 * Middleware: Validates that the user is authenticated.
 * Returns an error response if authentication fails.
 * Use this in API routes that require user authentication.
 *
 * @returns AuthSuccess with the session if authenticated, AuthFailure with 401 response if not
 *
 * @example
 * const auth = await requireAuth();
 * if (!auth.ok) return auth.response;
 * const { session } = auth; // now safe to use
 */
export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  const session = await getSession();
  if (!session) {
    const t = await getTranslations();
    return {
      ok: false,
      response: NextResponse.json(
        { error: t("Api.upload.unauthorized") },
        { status: 401 },
      ),
    };
  }
  return { ok: true, session };
}

type TestCreatorSuccess = {
  ok: true;
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  test: { creatorId: string };
};
type TestCreatorFailure = {
  ok: false;
  reason: "unauthenticated" | "forbidden" | "not_found";
};

/**
 * Middleware: Validates that the user is authenticated AND is the creator/owner of the test.
 * Returns different failure reasons to help route handlers determine the appropriate HTTP status.
 * Use this in API routes that require test ownership (e.g., editing test settings, viewing results).
 *
 * @param testId - The CUID of the test to check ownership
 * @returns TestCreatorSuccess with session and test data if authorized, TestCreatorFailure with specific reason if not
 *
 * @example
 * const auth = await requireTestCreator(testId);
 * if (!auth.ok) {
 *   if (auth.reason === "unauthenticated") return respond(401, "Unauthorized");
 *   if (auth.reason === "not_found") return respond(404, "Test not found");
 *   if (auth.reason === "forbidden") return respond(403, "Forbidden");
 * }
 * const { session, test } = auth; // now safe to use
 */
export async function requireTestCreator(
  testId: string,
): Promise<TestCreatorSuccess | TestCreatorFailure> {
  const session = await getSession();
  if (!session) return { ok: false, reason: "unauthenticated" };

  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: { creatorId: true },
  });

  if (!test) return { ok: false, reason: "not_found" };
  if (test.creatorId !== session.user.id)
    return { ok: false, reason: "forbidden" };

  return { ok: true, session, test };
}
