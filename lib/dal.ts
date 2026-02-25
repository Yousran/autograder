import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  const session = await getSession();
  if (!session) {
    const locale = await getLocale();
    const t = await getTranslations({ locale, namespace: "Upload" });
    return {
      ok: false,
      response: NextResponse.json(
        { error: t("unauthorized") },
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
