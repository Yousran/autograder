import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
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

function toFractionalKey(order: string): string | null {
  return /^[a-z]/.test(order) ? order : null;
}

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const locale = await getLocale();

  const tQuestions = await getTranslations({
    locale,
    namespace: "Api.questions",
  });

  const question = await prisma.question.findUnique({
    where: { id },
    select: { testId: true, type: true },
  });

  if (!question) {
    return NextResponse.json(
      { error: tQuestions("questionNotFound") },
      { status: 404 },
    );
  }

  const auth = await requireTestCreator(question.testId);
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
      { error: tQuestions("deleteFailed") },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const locale = await getLocale();

  const [tQuestions, tValidation] = await Promise.all([
    getTranslations({ locale, namespace: "Api.questions" }),
    getTranslations({ locale, namespace: "Validation" }),
  ]);

  // Find the question to get its testId and current type
  const question = await prisma.question.findUnique({
    where: { id },
    select: { testId: true, type: true },
  });

  if (!question) {
    return NextResponse.json(
      { error: tQuestions("questionNotFound") },
      { status: 404 },
    );
  }

  // Auth + ownership check via test creator
  const auth = await requireTestCreator(question.testId);
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

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: tQuestions("updateFailed") },
      { status: 400 },
    );
  }

  // Validate with discriminated union schema
  const schema = patchQuestionSchema((key) => tValidation(key));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? tQuestions("updateFailed") },
      { status: 422 },
    );
  }

  const data = parsed.data;

  try {
    // Handle reorder: `data.order` is the order of the displaced item (the one
    // that will sit after the moved question), or null if moved to the end.
    if ("order" in data) {
      // Fetch all sibling questions EXCEPT the moved one, sorted by order.
      const siblings = await prisma.question.findMany({
        where: { testId: question.testId, NOT: { id } },
        orderBy: { order: "asc" },
        select: { order: true },
      });

      let newOrder: string;

      if (data.order === null) {
        // Moving to the very end.
        const last = siblings[siblings.length - 1];
        newOrder = generateKeyBetween(
          last ? toFractionalKey(last.order) : null,
          null,
        );
      } else {
        // `data.order` is the order of the displaced item (the one that will sit
        // after the moved question). Find what comes before it to generate between.
        const displacedKey = toFractionalKey(data.order);
        const displacedIdx = siblings.findIndex((s) => s.order === data.order);

        // Find the nearest sibling before the displaced item with a different
        // order value (guards against legacy duplicate-order rows).
        let beforeKey: string | null = null;
        const start =
          displacedIdx === -1 ? siblings.length - 1 : displacedIdx - 1;
        for (let i = start; i >= 0; i--) {
          const key = toFractionalKey(siblings[i].order);
          if (key !== displacedKey) {
            beforeKey = key;
            break;
          }
        }

        newOrder = generateKeyBetween(beforeKey, displacedKey);
      }

      const updated = await prisma.question.update({
        where: { id },
        data: { order: newOrder },
      });
      return NextResponse.json(updated);
    }

    // Type guard: narrowing to discriminated union after reorder check
    if (!("type" in data)) {
      return NextResponse.json(
        { error: tQuestions("updateFailed") },
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
      { error: tQuestions("updateFailed") },
      { status: 500 },
    );
  }
}
