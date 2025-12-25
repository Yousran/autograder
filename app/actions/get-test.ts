"use server";

import { auth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { headers } from "next/headers";
import { PrismaPg } from "@prisma/adapter-pg";
import type { TestWithRelations, CreatorTestWithRelations } from "@/types/test";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

// Public function - returns test WITHOUT correct answers (for participants)
export async function getTestByJoinCode(
  joinCode: string
): Promise<{ success: true; test: TestWithRelations } | { error: string }> {
  if (!joinCode) {
    return { error: "Missing joinCode" };
  }

  try {
    const test = await prisma.test.findUnique({
      where: { joinCode },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            essay: {
              select: {
                id: true,
                isExactAnswer: true,
                maxScore: true,
                // Exclude answerText - this is the correct answer
              },
            },
            choice: {
              include: {
                choices: {
                  select: {
                    id: true,
                    choiceText: true,
                    // Exclude isCorrect - this reveals the answer
                  },
                },
              },
            },
            multipleSelect: {
              include: {
                multipleSelectChoices: {
                  select: {
                    id: true,
                    choiceText: true,
                    // Exclude isCorrect - this reveals the answer
                  },
                },
              },
            },
          },
        },
        prerequisites: {
          select: { prerequisiteTestId: true, minScoreRequired: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        participants: {
          select: { id: true },
        },
      },
    });

    if (!test) {
      return { error: "Test not found" };
    }

    return { success: true, test: test as TestWithRelations };
  } catch (error) {
    console.error("Error fetching test by joinCode:", error);
    return { error: "Failed to fetch test" };
  }
}

// Creator function - returns test WITH all correct answers and submissions
// Only accessible by the test creator
export async function creatorGetTestByJoinCode(
  joinCode: string
): Promise<
  { success: true; test: CreatorTestWithRelations } | { error: string }
> {
  if (!joinCode) {
    return { error: "Missing joinCode" };
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const test = await prisma.test.findUnique({
      where: { joinCode },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            essay: {
              include: {
                answers: true, // Include all essay answer submissions
              },
            },
            choice: {
              include: {
                choices: true, // Includes isCorrect for creator
                answers: true, // Include all choice answer submissions
              },
            },
            multipleSelect: {
              include: {
                multipleSelectChoices: true, // Includes isCorrect for creator
                answers: {
                  include: {
                    selectedChoices: true, // Include selected choices
                  },
                },
              },
            },
          },
        },
        prerequisites: {
          select: { prerequisiteTestId: true, minScoreRequired: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        participants: {
          include: {
            essayAnswers: true,
            choiceAnswers: true,
            multipleSelectAnswers: true,
          },
        },
      },
    });

    if (!test) {
      return { error: "Test not found" };
    }

    // Verify the current user is the test creator
    if (test.creatorId !== session.user.id) {
      return { error: "Forbidden: You are not the creator of this test" };
    }

    return { success: true, test: test as CreatorTestWithRelations };
  } catch (error) {
    console.error("Error fetching test by joinCode:", error);
    return { error: "Failed to fetch test" };
  }
}
