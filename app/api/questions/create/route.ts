import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { generateKeyBetween } from "fractional-indexing";
import { requireTestCreator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  createQuestionRequestSchema,
  defaultQuestionData,
} from "@/lib/schemas/question";

/**
 * Returns the order string if it's a valid fractional-indexing key
 * (starts with a lowercase letter), or null to treat it as an unbounded edge.
 * This guards against legacy integer-cast-to-string values in the DB.
 */
function toFractionalKey(order: string): string | null {
  return /^[a-z]/.test(order) ? order : null;
}

export async function POST(req: NextRequest) {
  const locale = await getLocale();
  const [tQuestions, tValidation] = await Promise.all([
    getTranslations({ locale, namespace: "Api.questions" }),
    getTranslations({ locale, namespace: "Validation" }),
  ]);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: tQuestions("createFailed") },
      { status: 400 },
    );
  }

  const schema = createQuestionRequestSchema((key) => tValidation(key));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? tQuestions("createFailed") },
      { status: 422 },
    );
  }

  const { testId, insertAfterId } = parsed.data;

  const auth = await requireTestCreator(testId);
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

  // --- Resolve the fractional index for the new question ---
  // Fetch all questions ordered so we can find neighbours.
  const allQuestions = await prisma.question.findMany({
    where: { testId },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });

  let newOrder: string;

  if (insertAfterId === undefined) {
    // Append at end
    const last = allQuestions[allQuestions.length - 1];
    newOrder = generateKeyBetween(
      last ? toFractionalKey(last.order) : null,
      null,
    );
  } else if (insertAfterId === null) {
    // Insert at beginning
    const first = allQuestions[0];
    newOrder = generateKeyBetween(
      null,
      first ? toFractionalKey(first.order) : null,
    );
  } else {
    // Insert after the question with insertAfterId
    const afterIndex = allQuestions.findIndex((q) => q.id === insertAfterId);
    if (afterIndex === -1) {
      return NextResponse.json(
        { error: tQuestions("questionNotFound") },
        { status: 404 },
      );
    }
    const afterOrder = toFractionalKey(allQuestions[afterIndex].order);

    // Find the next item with a different order (skip duplicates)
    let nextOrder: string | null = null;
    for (let i = afterIndex + 1; i < allQuestions.length; i++) {
      const potentialOrder = toFractionalKey(allQuestions[i].order);
      if (potentialOrder !== afterOrder) {
        nextOrder = potentialOrder;
        break;
      }
    }

    newOrder = generateKeyBetween(afterOrder, nextOrder);
  }

  try {
    const question = await prisma.question.create({
      data: {
        testId,
        type: defaultQuestionData.type,
        questionText: defaultQuestionData.questionText,
        order: newOrder,
        choice: {
          create: {
            isChoiceRandomized: defaultQuestionData.isChoiceRandomized,
            maxScore: defaultQuestionData.maxScore,
            choices: {
              createMany: {
                data: [...defaultQuestionData.defaultChoices],
              },
            },
          },
        },
      },

      include: {
        choice: {
          include: { choices: true },
        },
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: tQuestions("createFailed") },
      { status: 500 },
    );
  }
}
