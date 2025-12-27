"use server";

import { auth } from "@/lib/auth";
import { PrismaClient, QuestionType } from "@/lib/generated/prisma/client";
import { headers } from "next/headers";
import { PrismaPg } from "@prisma/adapter-pg";
import { questionSchema, QuestionValidation } from "@/lib/validations/question";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function editQuestion(
  questionId: string,
  questionData: Partial<QuestionValidation>
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get the question and verify ownership through test
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        test: true,
        essay: true,
        choice: {
          include: {
            choices: true,
          },
        },
        multipleSelect: {
          include: {
            multipleSelectChoices: true,
          },
        },
      },
    });

    if (!existingQuestion) {
      return {
        success: false,
        error: "Question not found",
      };
    }

    if (existingQuestion.test.creatorId !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to edit this question",
      };
    }

    // Construct complete data object for validation based on existing type
    let dataToValidate: QuestionValidation;

    if (
      existingQuestion.type === QuestionType.ESSAY &&
      existingQuestion.essay
    ) {
      const essayData =
        questionData.type === QuestionType.ESSAY ? questionData : {};
      dataToValidate = {
        type: QuestionType.ESSAY,
        questionText:
          questionData.questionText ?? existingQuestion.questionText,
        order: questionData.order ?? existingQuestion.order,
        answerText: essayData.answerText ?? existingQuestion.essay.answerText,
        isExactAnswer:
          essayData.isExactAnswer ?? existingQuestion.essay.isExactAnswer,
        maxScore:
          essayData.maxScore ??
          questionData.maxScore ??
          existingQuestion.essay.maxScore,
      };
    } else if (
      existingQuestion.type === QuestionType.CHOICE &&
      existingQuestion.choice
    ) {
      const choiceData =
        questionData.type === QuestionType.CHOICE ? questionData : {};
      dataToValidate = {
        type: QuestionType.CHOICE,
        questionText:
          questionData.questionText ?? existingQuestion.questionText,
        order: questionData.order ?? existingQuestion.order,
        isChoiceRandomized:
          choiceData.isChoiceRandomized ??
          existingQuestion.choice.isChoiceRandomized,
        maxScore:
          choiceData.maxScore ??
          questionData.maxScore ??
          existingQuestion.choice.maxScore,
        choices:
          choiceData.choices ??
          existingQuestion.choice.choices.map((c) => ({
            choiceText: c.choiceText,
            isCorrect: c.isCorrect,
          })),
      };
    } else if (
      existingQuestion.type === QuestionType.MULTIPLE_SELECT &&
      existingQuestion.multipleSelect
    ) {
      const multipleSelectData =
        questionData.type === QuestionType.MULTIPLE_SELECT ? questionData : {};
      dataToValidate = {
        type: QuestionType.MULTIPLE_SELECT,
        questionText:
          questionData.questionText ?? existingQuestion.questionText,
        order: questionData.order ?? existingQuestion.order,
        isChoiceRandomized:
          multipleSelectData.isChoiceRandomized ??
          existingQuestion.multipleSelect.isChoiceRandomized,
        maxScore:
          multipleSelectData.maxScore ??
          questionData.maxScore ??
          existingQuestion.multipleSelect.maxScore,
        choices:
          multipleSelectData.choices ??
          existingQuestion.multipleSelect.multipleSelectChoices.map((c) => ({
            choiceText: c.choiceText,
            isCorrect: c.isCorrect,
          })),
      };
    } else {
      return {
        success: false,
        error: "Invalid question type or missing type-specific data",
      };
    }

    // Validate the merged data
    const validatedData = questionSchema.parse(dataToValidate);

    // Check if type changed - if so, we need to delete old type data
    if (validatedData.type !== existingQuestion.type) {
      // Delete old type-specific data
      if (
        existingQuestion.type === QuestionType.ESSAY &&
        existingQuestion.essay
      ) {
        await prisma.essayQuestion.delete({
          where: { id: existingQuestion.id },
        });
      } else if (
        existingQuestion.type === QuestionType.CHOICE &&
        existingQuestion.choice
      ) {
        await prisma.choiceQuestion.delete({
          where: { id: existingQuestion.id },
        });
      } else if (
        existingQuestion.type === QuestionType.MULTIPLE_SELECT &&
        existingQuestion.multipleSelect
      ) {
        await prisma.multipleSelectQuestion.delete({
          where: { id: existingQuestion.id },
        });
      }
    }

    // Update the question based on type
    let question;

    if (validatedData.type === QuestionType.ESSAY) {
      question = await prisma.question.update({
        where: { id: questionId },
        data: {
          questionText: validatedData.questionText,
          type: validatedData.type,
          order: validatedData.order,
          essay: {
            upsert: {
              create: {
                answerText: validatedData.answerText,
                isExactAnswer: validatedData.isExactAnswer,
                maxScore: validatedData.maxScore,
              },
              update: {
                answerText: validatedData.answerText,
                isExactAnswer: validatedData.isExactAnswer,
                maxScore: validatedData.maxScore,
              },
            },
          },
        },
        include: {
          essay: true,
        },
      });
    } else if (validatedData.type === QuestionType.CHOICE) {
      // Delete existing choices if updating
      if (existingQuestion.choice) {
        await prisma.choice.deleteMany({
          where: { questionId: existingQuestion.id },
        });
      }

      question = await prisma.question.update({
        where: { id: questionId },
        data: {
          questionText: validatedData.questionText,
          type: validatedData.type,
          order: validatedData.order,
          choice: {
            upsert: {
              create: {
                isChoiceRandomized: validatedData.isChoiceRandomized,
                maxScore: validatedData.maxScore,
                choices: {
                  create: validatedData.choices,
                },
              },
              update: {
                isChoiceRandomized: validatedData.isChoiceRandomized,
                maxScore: validatedData.maxScore,
                choices: {
                  create: validatedData.choices,
                },
              },
            },
          },
        },
        include: {
          choice: {
            include: {
              choices: true,
            },
          },
        },
      });
    } else if (validatedData.type === QuestionType.MULTIPLE_SELECT) {
      // Delete existing choices if updating
      if (existingQuestion.multipleSelect) {
        await prisma.multipleSelectChoice.deleteMany({
          where: { questionId: existingQuestion.id },
        });
      }

      question = await prisma.question.update({
        where: { id: questionId },
        data: {
          questionText: validatedData.questionText,
          type: validatedData.type,
          order: validatedData.order,
          multipleSelect: {
            upsert: {
              create: {
                isChoiceRandomized: validatedData.isChoiceRandomized,
                maxScore: validatedData.maxScore,
                multipleSelectChoices: {
                  create: validatedData.choices,
                },
              },
              update: {
                isChoiceRandomized: validatedData.isChoiceRandomized,
                maxScore: validatedData.maxScore,
                multipleSelectChoices: {
                  create: validatedData.choices,
                },
              },
            },
          },
        },
        include: {
          multipleSelect: {
            include: {
              multipleSelectChoices: true,
            },
          },
        },
      });
    }

    return {
      success: true,
      question,
    };
  } catch (error) {
    console.error("Error editing question:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to edit question",
    };
  }
}
