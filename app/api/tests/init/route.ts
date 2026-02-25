import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";

export async function POST() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Api.tests" });

  try {
    const test = await prisma.test.create({
      data: {
        creatorId: auth.session.user.id,
        title: "Untitled Test",
      },
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error("Error creating test:", error);
    return NextResponse.json({ error: t("createFailed") }, { status: 500 });
  }
}
