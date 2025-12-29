"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function getQuestionById(questionId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            creatorId: true,
          },
        },
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

    if (!question) {
      return {
        success: false,
        error: "Question not found",
      };
    }

    // Check if user has permission to view full question details
    const isCreator = session?.user?.id === question.test.creatorId;

    return {
      success: true,
      question,
      isCreator,
    };
  } catch (error) {
    console.error("Error getting question by ID:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get question",
    };
  }
}

export async function getQuestionsByTestId(testId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Get the test to verify ownership
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: {
        id: true,
        creatorId: true,
      },
    });

    if (!test) {
      return {
        success: false,
        error: "Test not found",
      };
    }

    const isCreator = session?.user?.id === test.creatorId;

    // Get all questions for the test
    const questions = await prisma.question.findMany({
      where: { testId },
      orderBy: {
        order: "asc",
      },
      include: {
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

    return {
      success: true,
      questions,
      isCreator,
    };
  } catch (error) {
    console.error("Error getting questions by test ID:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get questions",
    };
  }
}
