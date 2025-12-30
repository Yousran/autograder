"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuestionType } from "@/lib/generated/prisma/enums";
import { headers } from "next/headers";
import { questionSchema } from "@/lib/validations/question";

/**
 * Creates a new question for a test
 * @param testId - The ID of the test to add the question to
 * @param insertAtIndex - Optional index to insert the question at. If provided, all questions at and after this index will have their order incremented.
 */
export async function createQuestion(testId: string, insertAtIndex?: number) {
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

    // Verify that the test exists and belongs to the user
    const test = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return {
        success: false,
        error: "Test not found",
      };
    }

    if (test.creatorId !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to add questions to this test",
      };
    }

    let targetOrder: number;

    if (insertAtIndex !== undefined && insertAtIndex >= 0) {
      // Insert at specific index: shift all questions at and after this index
      targetOrder = insertAtIndex;

      // Increment order for all questions at or after the target index
      await prisma.question.updateMany({
        where: {
          testId,
          order: { gte: targetOrder },
        },
        data: {
          order: { increment: 1 },
        },
      });
    } else {
      // Append at end: get the current max order
      const maxOrderQuestion = await prisma.question.findFirst({
        where: { testId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      targetOrder = (maxOrderQuestion?.order ?? -1) + 1;
    }

    // Prepare default question data for CHOICE type
    const defaultQuestionData = {
      type: QuestionType.CHOICE,
      questionText: "Untitled Question",
      order: targetOrder,
      isChoiceRandomized: false,
      maxScore: 10,
      choices: [
        { choiceText: "Option 1", isCorrect: false },
        { choiceText: "Option 2", isCorrect: true },
      ],
    } as const;

    // Validate the question data
    const validatedData = questionSchema.parse(defaultQuestionData);

    // Type guard to ensure we have CHOICE type data
    if (validatedData.type !== QuestionType.CHOICE) {
      return {
        success: false,
        error: "Invalid question type",
      };
    }

    const question = await prisma.question.create({
      data: {
        testId,
        questionText: validatedData.questionText,
        type: validatedData.type,
        order: validatedData.order,
        choice: {
          create: {
            isChoiceRandomized: validatedData.isChoiceRandomized,
            maxScore: validatedData.maxScore,
            choices: {
              create: validatedData.choices,
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

    return {
      success: true,
      question,
    };
  } catch (error) {
    console.error("Error creating question:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create question",
    };
  }
}
