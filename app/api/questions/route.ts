import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { requireTestCreator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getQuestionsQuerySchema } from "@/lib/schemas/question";

/**
 * GET /api/questions
 * Lists all questions for a test with their details (test owner only).
 * Returns questions with type-specific data (essay, choice, or multipleSelect).
 *
 * @param req - The Next.js request with query param `testid`
 * @returns 200 with array of questions with details, or 401/403/404 if unauthorized
 */
export async function GET(req: NextRequest) {
  const locale = await getLocale();
  const [tQuestions, tValidation] = await Promise.all([
    getTranslations({ locale, namespace: "Api.questions" }),
    getTranslations({ locale, namespace: "Validation" }),
  ]);

  const { searchParams } = req.nextUrl;
  const parsed = getQuestionsQuerySchema.safeParse({
    testid: searchParams.get("testid"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? tValidation("testIdRequired"),
      },
      { status: 422 },
    );
  }

  const { testid } = parsed.data;

  const auth = await requireTestCreator(testid);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      return NextResponse.json(
        { error: tQuestions("unauthorized") },
        { status: 401 },
      );
    }
    if (auth.reason === "not_found") {
      return NextResponse.json(
        { error: tQuestions("notFound") },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: tQuestions("forbidden") },
      { status: 403 },
    );
  }

  try {
    const questions = await prisma.question.findMany({
      where: { testId: testid },
      orderBy: { order: "asc" },
      select: {
        id: true,
        testId: true,
        questionText: true,
        type: true,
        order: true,
        createdAt: true,
        updatedAt: true,
        essay: {
          select: {
            id: true,
            answerText: true,
            isExactAnswer: true,
            maxScore: true,
          },
        },
        choice: {
          select: {
            id: true,
            isChoiceRandomized: true,
            maxScore: true,
            choices: {
              select: {
                id: true,
                choiceText: true,
                isCorrect: true,
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        multipleSelect: {
          select: {
            id: true,
            isChoiceRandomized: true,
            maxScore: true,
            multipleSelectChoices: {
              select: {
                id: true,
                choiceText: true,
                isCorrect: true,
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(questions);
  } catch {
    return NextResponse.json(
      { error: tQuestions("fetchFailed") },
      { status: 500 },
    );
  }
}
