import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { defaultTestResponse, testResponseSchema } from "@/lib/schemas/test";
import { getLocale, getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const TTL_DAYS = 7;
const MAX_RETRIES = 5;

export async function POST() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Api.tests" });

  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();

  // Generate a unique join code, retrying on collision
  let joinCode: string | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const candidate = nanoid();
    const conflict = await prisma.test.findFirst({
      where: {
        joinCode: candidate,
        OR: [{ joinCodeExpiresAt: null }, { joinCodeExpiresAt: { gt: now } }],
      },
      select: { id: true },
    });
    if (!conflict) {
      joinCode = candidate;
      break;
    }
  }

  try {
    const test = await prisma.test.create({
      data: {
        creatorId: auth.session.user.id,
        title: defaultTestResponse.title,
        description: defaultTestResponse.description,
        testDuration: defaultTestResponse.testDuration,
        maxAttempts: defaultTestResponse.maxAttempts,
        isAcceptingResponses: defaultTestResponse.isAcceptingResponses,
        isLoggedInUserOnly: defaultTestResponse.isLoggedInUserOnly,
        isShowDetailedScore: defaultTestResponse.isShowDetailedScore,
        isShowCorrectAnswers: defaultTestResponse.isShowCorrectAnswers,
        isQuestionsOrdered: defaultTestResponse.isQuestionsOrdered,
        joinCode,
        joinCodeExpiresAt: joinCode ? expiresAt : null,
      },
    });

    return NextResponse.json(testResponseSchema.parse(test), { status: 201 });
  } catch (error) {
    console.error("Error creating test:", error);
    return NextResponse.json({ error: t("createFailed") }, { status: 500 });
  }
}
