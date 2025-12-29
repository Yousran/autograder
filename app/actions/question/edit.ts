"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuestionType } from "@/lib/generated/prisma/client";
import { headers } from "next/headers";
import { questionSchema, QuestionValidation } from "@/lib/validations/question";

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

    // Determine the target type - prioritize incoming type if provided
    const targetType = questionData.type ?? existingQuestion.type;
    const isTypeChanging =
      questionData.type && questionData.type !== existingQuestion.type;

    // Construct complete data object for validation based on target type
    let dataToValidate: QuestionValidation;

    if (targetType === QuestionType.ESSAY) {
      // When changing to ESSAY, use incoming data; otherwise merge with existing
      const essayData =
        questionData.type === QuestionType.ESSAY ? questionData : {};
      dataToValidate = {
        type: QuestionType.ESSAY,
        questionText:
          questionData.questionText ?? existingQuestion.questionText,
        order: questionData.order ?? existingQuestion.order,
        answerText: isTypeChanging
          ? essayData.answerText || "Enter your answer key here..."
          : essayData.answerText ??
            existingQuestion.essay?.answerText ??
            "Enter your answer key here...",
        isExactAnswer: isTypeChanging
          ? essayData.isExactAnswer ?? false
          : essayData.isExactAnswer ??
            existingQuestion.essay?.isExactAnswer ??
            false,
        maxScore: isTypeChanging
          ? essayData.maxScore ?? questionData.maxScore ?? 0
          : essayData.maxScore ??
            questionData.maxScore ??
            existingQuestion.essay?.maxScore ??
            0,
      };
    } else if (targetType === QuestionType.CHOICE) {
      // When changing to CHOICE, use incoming data; otherwise merge with existing
      const choiceData =
        questionData.type === QuestionType.CHOICE ? questionData : {};
      const defaultChoices = [
        { choiceText: "Option 1", isCorrect: true },
        { choiceText: "Option 2", isCorrect: false },
      ];
      dataToValidate = {
        type: QuestionType.CHOICE,
        questionText:
          questionData.questionText ?? existingQuestion.questionText,
        order: questionData.order ?? existingQuestion.order,
        isChoiceRandomized: isTypeChanging
          ? choiceData.isChoiceRandomized ?? false
          : choiceData.isChoiceRandomized ??
            existingQuestion.choice?.isChoiceRandomized ??
            false,
        maxScore: isTypeChanging
          ? choiceData.maxScore ?? questionData.maxScore ?? 0
          : choiceData.maxScore ??
            questionData.maxScore ??
            existingQuestion.choice?.maxScore ??
            0,
        choices: isTypeChanging
          ? choiceData.choices ?? defaultChoices
          : choiceData.choices ??
            existingQuestion.choice?.choices.map((c) => ({
              choiceText: c.choiceText,
              isCorrect: c.isCorrect,
            })) ??
            defaultChoices,
      };
    } else if (targetType === QuestionType.MULTIPLE_SELECT) {
      // When changing to MULTIPLE_SELECT, use incoming data; otherwise merge with existing
      const multipleSelectData =
        questionData.type === QuestionType.MULTIPLE_SELECT ? questionData : {};
      const defaultChoices = [
        { choiceText: "Option 1", isCorrect: true },
        { choiceText: "Option 2", isCorrect: false },
      ];
      dataToValidate = {
        type: QuestionType.MULTIPLE_SELECT,
        questionText:
          questionData.questionText ?? existingQuestion.questionText,
        order: questionData.order ?? existingQuestion.order,
        isChoiceRandomized: isTypeChanging
          ? multipleSelectData.isChoiceRandomized ?? false
          : multipleSelectData.isChoiceRandomized ??
            existingQuestion.multipleSelect?.isChoiceRandomized ??
            false,
        maxScore: isTypeChanging
          ? multipleSelectData.maxScore ?? questionData.maxScore ?? 0
          : multipleSelectData.maxScore ??
            questionData.maxScore ??
            existingQuestion.multipleSelect?.maxScore ??
            0,
        choices: isTypeChanging
          ? multipleSelectData.choices ?? defaultChoices
          : multipleSelectData.choices ??
            existingQuestion.multipleSelect?.multipleSelectChoices.map((c) => ({
              choiceText: c.choiceText,
              isCorrect: c.isCorrect,
            })) ??
            defaultChoices,
      };
    } else {
      return {
        success: false,
        error: "Invalid question type",
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
