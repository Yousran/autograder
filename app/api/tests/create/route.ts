import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { defaultTestData, TestSchema } from "@/lib/schemas/test";
import { getLocale, getTranslations } from "next-intl/server";
import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { addDays } from "date-fns";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const TTL_DAYS = 7;
const MAX_RETRIES = 5;

/**
 * POST /api/tests/create
 * Creates a new test with default settings (authenticated user only).
 * Generates a unique 6-character join code with 7-day TTL.
 * Returns the created test with default question placeholder.
 *
 * @param req - The Next.js request (no body required)
 * @returns 200 with newly created TestSchema, or 401 if not authenticated
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Api.tests" });

  const expiresAt = addDays(new Date(), TTL_DAYS);
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
        title: defaultTestData.title,
        description: defaultTestData.description,
        testDuration: defaultTestData.testDuration,
        maxAttempts: defaultTestData.maxAttempts,
        isAcceptingResponses: defaultTestData.isAcceptingResponses,
        isLoggedInUserOnly: defaultTestData.isLoggedInUserOnly,
        isShowDetailedScore: defaultTestData.isShowDetailedScore,
        isShowCorrectAnswers: defaultTestData.isShowCorrectAnswers,
        isQuestionsOrdered: defaultTestData.isQuestionsOrdered,
        joinCode,
        joinCodeExpiresAt: joinCode ? expiresAt : null,
      },
    });

    return NextResponse.json(TestSchema.parse(test), { status: 201 });
  } catch (error) {
    console.error("Error creating test:", error);
    return NextResponse.json({ error: t("createFailed") }, { status: 500 });
  }
}
