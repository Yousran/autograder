import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";

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
