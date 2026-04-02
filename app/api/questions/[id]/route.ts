import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { generateKeyBetween } from "fractional-indexing";
import { requireTestCreator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { QuestionType } from "@/lib/generated/prisma/enums";
import {
  patchQuestionSchema,
  defaultEssayQuestionData,
  defaultChoiceQuestionData,
  defaultMultipleSelectQuestionData,
  defaultQuestionData,
} from "@/lib/schemas/question";

/**
 * DELETE /api/questions/[id]
 * Deletes a question from a test (test owner only).
 * Also deletes all related answers for that question.
 *
 * @param req - Not used
 * @param params - URL parameters { id: questionId }
 * @returns 200 with empty response, or 401/403/404 on error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const t = await getTranslations();
  const { id } = await params;

  const question = await prisma.question.findUnique({
    where: { id },
    select: { testId: true, type: true },
  });

  if (!question) {
    return NextResponse.json(
      { error: t("Api.questions.questionNotFound") },
      { status: 404 },
    );
  }

  const auth = await requireTestCreator(question.testId);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      return NextResponse.json(
        { error: t("Api.questions.unauthorized") },
        { status: 401 },
      );
    }
    if (auth.reason === "not_found") {
      return NextResponse.json(
        { error: t("Api.questions.notFound") },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: t("Api.questions.forbidden") },
      { status: 403 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (question.type === QuestionType.CHOICE) {
        await tx.choice.deleteMany({ where: { questionId: id } });
        await tx.choiceQuestion.deleteMany({ where: { id } });
      } else if (question.type === QuestionType.MULTIPLE_SELECT) {
        await tx.multipleSelectChoice.deleteMany({ where: { questionId: id } });
        await tx.multipleSelectQuestion.deleteMany({ where: { id } });
      }
      await tx.question.delete({ where: { id } });
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: t("Api.questions.deleteFailed") },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/questions/[id]
 * Updates a question's settings and details (test owner only).
 * Supports changing question type, reordering, and all type-specific properties.
 * Type switching uses a transaction to maintain consistency.
 *
 * @param req - The Next.js request with JSON body (partial question fields)
 * @param params - URL parameters { id: questionId }
 * @returns 200 with updated question, or 400/401/403/404 on error
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const t = await getTranslations();

  // Find the question to get its testId and current type
  const question = await prisma.question.findUnique({
    where: { id },
    select: { testId: true, type: true },
  });

  if (!question) {
    return NextResponse.json(
      { error: t("Api.questions.questionNotFound") },
      { status: 404 },
    );
  }

  // Auth + ownership check via test creator
  const auth = await requireTestCreator(question.testId);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      return NextResponse.json(
        { error: t("Api.questions.unauthorized") },
        { status: 401 },
      );
    }
    if (auth.reason === "not_found") {
      return NextResponse.json(
        { error: t("Api.questions.notFound") },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: t("Api.questions.forbidden") },
      { status: 403 },
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: t("Api.questions.updateFailed") },
      { status: 400 },
    );
  }

  // Validate with discriminated union schema
  const schema = patchQuestionSchema((key) => t("Validation." + key));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? t("Api.questions.updateFailed"),
      },
      { status: 422 },
    );
  }

  const data = parsed.data;

  try {
    if ("beforeId" in data && "afterId" in data) {
      const reorderData = data as {
        beforeId: string | null;
        afterId: string | null;
      };

      const siblings = await prisma.question.findMany({
        where: { testId: question.testId, NOT: { id } },
        orderBy: { order: "asc" },
        select: { id: true, order: true },
      });

      const beforeOrder =
        siblings.find((s) => s.id === reorderData.beforeId)?.order ?? null;
      const afterOrder =
        siblings.find((s) => s.id === reorderData.afterId)?.order ?? null;

      const newOrder = generateKeyBetween(beforeOrder, afterOrder);

      await prisma.question.update({
        where: { id },
        data: { order: newOrder },
      });

      // Return ALL siblings + moved item so client can fully sync order strings
      const allUpdated = await prisma.question.findMany({
        where: { testId: question.testId },
        orderBy: { order: "asc" },
        select: { id: true, order: true },
      });

      return NextResponse.json(allUpdated);
    }

    // Type guard: narrowing to discriminated union after reorder check
    if (!("type" in data)) {
      return NextResponse.json(
        { error: t("Api.questions.updateFailed") },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If the question type changed, delete the old sub-question record
      // (cascade will handle its children)
      if (data.type !== question.type) {
        if (question.type === QuestionType.ESSAY) {
          await tx.essayQuestion.deleteMany({ where: { id } });
        } else if (question.type === QuestionType.CHOICE) {
          await tx.choiceQuestion.deleteMany({ where: { id } });
        } else if (question.type === QuestionType.MULTIPLE_SELECT) {
          await tx.multipleSelectQuestion.deleteMany({ where: { id } });
        }
      }

      if (data.type === QuestionType.ESSAY) {
        return tx.question.update({
          where: { id },
          data: {
            ...(data.questionText !== undefined && {
              questionText: data.questionText,
            }),
            type: data.type,
            essay: {
              upsert: {
                create: {
                  answerText:
                    data.answerText ?? defaultEssayQuestionData.answerText,
                  isExactAnswer:
                    data.isExactAnswer ??
                    defaultEssayQuestionData.isExactAnswer,
                  maxScore: data.maxScore ?? defaultEssayQuestionData.maxScore,
                },
                update: {
                  ...(data.answerText !== undefined && {
                    answerText: data.answerText,
                  }),
                  ...(data.isExactAnswer !== undefined && {
                    isExactAnswer: data.isExactAnswer,
                  }),
                  ...(data.maxScore !== undefined && {
                    maxScore: data.maxScore,
                  }),
                },
              },
            },
          },
          include: { essay: true },
        });
      }

      if (data.type === QuestionType.CHOICE) {
        // Only replace choices when the client explicitly sends them
        if (data.choices !== undefined) {
          await tx.choice.deleteMany({ where: { questionId: id } });
        }

        // If the client didn't send choices and we're converting from a
        // non-choice type, seed the default starter choices so the question
        // isn't left without any options.
        const choicesToCreate =
          data.choices !== undefined
            ? data.choices
            : question.type !== QuestionType.CHOICE
              ? defaultQuestionData.defaultChoices
              : [];

        return tx.question.update({
          where: { id },
          data: {
            ...(data.questionText !== undefined && {
              questionText: data.questionText,
            }),
            type: data.type,
            choice: {
              upsert: {
                create: {
                  isChoiceRandomized:
                    data.isChoiceRandomized ??
                    defaultChoiceQuestionData.isChoiceRandomized,
                  maxScore: data.maxScore ?? defaultChoiceQuestionData.maxScore,
                  choices: {
                    createMany: {
                      data: choicesToCreate.map((c) => ({
                        choiceText: c.choiceText,
                        isCorrect: c.isCorrect,
                      })),
                    },
                  },
                },
                update: {
                  ...(data.isChoiceRandomized !== undefined && {
                    isChoiceRandomized: data.isChoiceRandomized,
                  }),
                  ...(data.maxScore !== undefined && {
                    maxScore: data.maxScore,
                  }),
                  ...(data.choices !== undefined && {
                    choices: {
                      createMany: {
                        data: data.choices.map((c) => ({
                          choiceText: c.choiceText,
                          isCorrect: c.isCorrect,
                        })),
                      },
                    },
                  }),
                },
              },
            },
          },
          include: {
            choice: { include: { choices: { orderBy: { createdAt: "asc" } } } },
          },
        });
      }

      // MULTIPLE_SELECT
      if (data.choices !== undefined) {
        await tx.multipleSelectChoice.deleteMany({ where: { questionId: id } });
      }

      // If the client didn't provide choices and we're converting from a
      // non-multiple-select type, seed starter choices so the question isn't
      // left without any options.
      const choicesToCreate =
        data.choices !== undefined
          ? data.choices
          : question.type !== QuestionType.MULTIPLE_SELECT
            ? defaultQuestionData.defaultChoices
            : [];

      return tx.question.update({
        where: { id },
        data: {
          ...(data.questionText !== undefined && {
            questionText: data.questionText,
          }),
          type: data.type,
          multipleSelect: {
            upsert: {
              create: {
                isChoiceRandomized:
                  data.isChoiceRandomized ??
                  defaultMultipleSelectQuestionData.isChoiceRandomized,
                maxScore:
                  data.maxScore ?? defaultMultipleSelectQuestionData.maxScore,
                multipleSelectChoices: {
                  createMany: {
                    data: (choicesToCreate ?? []).map((c) => ({
                      choiceText: c.choiceText,
                      isCorrect: c.isCorrect,
                    })),
                  },
                },
              },
              update: {
                ...(data.isChoiceRandomized !== undefined && {
                  isChoiceRandomized: data.isChoiceRandomized,
                }),
                ...(data.maxScore !== undefined && {
                  maxScore: data.maxScore,
                }),
                ...(data.choices !== undefined && {
                  multipleSelectChoices: {
                    createMany: {
                      data: data.choices.map((c) => ({
                        choiceText: c.choiceText,
                        isCorrect: c.isCorrect,
                      })),
                    },
                  },
                }),
              },
            },
          },
        },
        include: {
          multipleSelect: {
            include: {
              multipleSelectChoices: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: t("Api.questions.updateFailed") },
      { status: 500 },
    );
  }
}
