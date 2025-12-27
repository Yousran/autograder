"use server";

import { auth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { QuestionType } from "@/lib/generated/prisma/enums";
import { headers } from "next/headers";
import { PrismaPg } from "@prisma/adapter-pg";
import { questionSchema } from "@/lib/validations/question";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function createQuestion(testId: string) {
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

    // Get the current max order for questions in this test
    const maxOrderQuestion = await prisma.question.findFirst({
      where: { testId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const nextOrder = (maxOrderQuestion?.order ?? -1) + 1;

    // Prepare default question data for CHOICE type
    const defaultQuestionData = {
      type: QuestionType.CHOICE,
      questionText: "Untitled Question",
      order: nextOrder,
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
