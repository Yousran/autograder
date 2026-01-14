"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import {
  testPrerequisiteSchema,
  TestPrerequisiteValidation,
} from "@/lib/validations/test-prerequisite";
import {
  TestPrerequisiteWithTest,
  AvailablePrerequisiteTest,
} from "@/types/test-prerequisite";

// Type for prerequisite check result
export type PrerequisiteCheckResult = {
  passed: boolean;
  prerequisiteTestTitle: string;
  prerequisiteTestJoinCode: string;
  requiredScore: number;
  userBestScore: number | null; // null if user hasn't taken the test
};

// Type for tests that this test is a prerequisite for
export type NextTestInfo = {
  id: string;
  title: string;
  joinCode: string;
  minScoreRequired: number;
  userMeetsRequirement: boolean;
};

/**
 * Check if a logged-in user meets all prerequisites for a test
 * Returns detailed info about each prerequisite and whether user passes
 */
export async function checkTestPrerequisites(testId: string): Promise<{
  success: boolean;
  canJoin?: boolean;
  prerequisites?: PrerequisiteCheckResult[];
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Prerequisites only apply to logged-in users
    if (!session?.user?.id) {
      return {
        success: true,
        canJoin: true,
        prerequisites: [],
      };
    }

    // Get the test with its prerequisites
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        prerequisites: {
          include: {
            prerequisiteTest: {
              select: {
                id: true,
                title: true,
                joinCode: true,
              },
            },
          },
        },
      },
    });

    if (!test) {
      return {
        success: false,
        error: "Test not found",
      };
    }

    // If no prerequisites, user can join
    if (test.prerequisites.length === 0) {
      return {
        success: true,
        canJoin: true,
        prerequisites: [],
      };
    }

    // Check each prerequisite
    const prerequisiteResults: PrerequisiteCheckResult[] = [];

    for (const prereq of test.prerequisites) {
      // Get user's best score from all their attempts on the prerequisite test
      const userAttempts = await prisma.participant.findMany({
        where: {
          testId: prereq.prerequisiteTestId,
          userId: session.user.id,
          isCompleted: true,
        },
        select: {
          score: true,
        },
        orderBy: {
          score: "desc",
        },
      });

      const bestScore = userAttempts.length > 0 ? userAttempts[0].score : null;
      const passed = bestScore !== null && bestScore >= prereq.minScoreRequired;

      prerequisiteResults.push({
        passed,
        prerequisiteTestTitle: prereq.prerequisiteTest.title,
        prerequisiteTestJoinCode: prereq.prerequisiteTest.joinCode,
        requiredScore: prereq.minScoreRequired,
        userBestScore: bestScore,
      });
    }

    const canJoin = prerequisiteResults.every((p) => p.passed);

    return {
      success: true,
      canJoin,
      prerequisites: prerequisiteResults,
    };
  } catch (error) {
    console.error("Error checking test prerequisites:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to check prerequisites",
    };
  }
}

/**
 * Get tests that this test is a prerequisite for (for the "continue to next test" feature)
 * Only returns tests where user meets the score requirement
 */
export async function getNextTests(
  testId: string,
  userScore: number
): Promise<{
  success: boolean;
  nextTests?: NextTestInfo[];
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Only for logged-in users
    if (!session?.user?.id) {
      return {
        success: true,
        nextTests: [],
      };
    }

    // Get tests that have this test as a prerequisite
    const prerequisites = await prisma.testPrerequisite.findMany({
      where: {
        prerequisiteTestId: testId,
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            joinCode: true,
            isAcceptingResponses: true,
          },
        },
      },
    });

    const nextTests: NextTestInfo[] = prerequisites
      .filter((prereq) => prereq.test.isAcceptingResponses) // Only show tests that are accepting responses
      .map((prereq) => ({
        id: prereq.test.id,
        title: prereq.test.title,
        joinCode: prereq.test.joinCode,
        minScoreRequired: prereq.minScoreRequired,
        userMeetsRequirement: userScore >= prereq.minScoreRequired,
      }));

    return {
      success: true,
      nextTests,
    };
  } catch (error) {
    console.error("Error getting next tests:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get next tests",
    };
  }
}

// Get all prerequisites for a test
export async function getTestPrerequisites(testId: string): Promise<{
  success: boolean;
  prerequisites?: TestPrerequisiteWithTest[];
  error?: string;
}> {
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

    // Check if test exists and belongs to user
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
        error: "You don't have permission to view this test's prerequisites",
      };
    }

    const prerequisites = await prisma.testPrerequisite.findMany({
      where: { testId },
      include: {
        prerequisiteTest: {
          select: {
            id: true,
            title: true,
            joinCode: true,
          },
        },
      },
    });

    return {
      success: true,
      prerequisites,
    };
  } catch (error) {
    console.error("Error getting test prerequisites:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get test prerequisites",
    };
  }
}

// Get available tests that can be added as prerequisites
export async function getAvailablePrerequisiteTests(testId: string): Promise<{
  success: boolean;
  tests?: AvailablePrerequisiteTest[];
  error?: string;
}> {
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

    // Get the current test
    const currentTest = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!currentTest) {
      return {
        success: false,
        error: "Test not found",
      };
    }

    if (currentTest.creatorId !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to modify this test",
      };
    }

    // Get existing prerequisite IDs
    const existingPrerequisites = await prisma.testPrerequisite.findMany({
      where: { testId },
      select: { prerequisiteTestId: true },
    });

    const existingIds = existingPrerequisites.map((p) => p.prerequisiteTestId);

    // Get all other tests by this creator that are not already prerequisites
    // and are not the current test itself
    const availableTests = await prisma.test.findMany({
      where: {
        creatorId: session.user.id,
        id: {
          notIn: [testId, ...existingIds],
        },
      },
      select: {
        id: true,
        title: true,
        joinCode: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      tests: availableTests,
    };
  } catch (error) {
    console.error("Error getting available prerequisite tests:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get available tests",
    };
  }
}

// Add a prerequisite to a test
export async function addTestPrerequisite(
  testId: string,
  data: TestPrerequisiteValidation
): Promise<{
  success: boolean;
  prerequisite?: TestPrerequisiteWithTest;
  error?: string;
}> {
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

    // Validate input
    const validatedData = testPrerequisiteSchema.parse(data);

    // Check if test exists and belongs to user
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
        error: "You don't have permission to modify this test",
      };
    }

    // Check if prerequisite test exists and belongs to the same creator
    const prerequisiteTest = await prisma.test.findUnique({
      where: { id: validatedData.prerequisiteTestId },
    });

    if (!prerequisiteTest) {
      return {
        success: false,
        error: "Prerequisite test not found",
      };
    }

    if (prerequisiteTest.creatorId !== session.user.id) {
      return {
        success: false,
        error: "You can only add your own tests as prerequisites",
      };
    }

    // Prevent self-reference
    if (testId === validatedData.prerequisiteTestId) {
      return {
        success: false,
        error: "A test cannot be a prerequisite of itself",
      };
    }

    // Check for existing prerequisite
    const existing = await prisma.testPrerequisite.findUnique({
      where: {
        testId_prerequisiteTestId: {
          testId,
          prerequisiteTestId: validatedData.prerequisiteTestId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: "This prerequisite already exists",
      };
    }

    // Create the prerequisite
    const prerequisite = await prisma.testPrerequisite.create({
      data: {
        testId,
        prerequisiteTestId: validatedData.prerequisiteTestId,
        minScoreRequired: validatedData.minScoreRequired,
      },
      include: {
        prerequisiteTest: {
          select: {
            id: true,
            title: true,
            joinCode: true,
          },
        },
      },
    });

    return {
      success: true,
      prerequisite,
    };
  } catch (error) {
    console.error("Error adding test prerequisite:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add prerequisite",
    };
  }
}

// Update a prerequisite's minimum score
export async function updateTestPrerequisite(
  prerequisiteId: string,
  minScoreRequired: number
): Promise<{
  success: boolean;
  prerequisite?: TestPrerequisiteWithTest;
  error?: string;
}> {
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

    // Validate minimum score
    if (minScoreRequired < 0 || minScoreRequired > 100) {
      return {
        success: false,
        error: "Minimum score must be between 0 and 100",
      };
    }

    // Get the prerequisite with its test
    const prerequisite = await prisma.testPrerequisite.findUnique({
      where: { id: prerequisiteId },
      include: {
        test: true,
      },
    });

    if (!prerequisite) {
      return {
        success: false,
        error: "Prerequisite not found",
      };
    }

    if (prerequisite.test.creatorId !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to modify this prerequisite",
      };
    }

    // Update the prerequisite
    const updatedPrerequisite = await prisma.testPrerequisite.update({
      where: { id: prerequisiteId },
      data: { minScoreRequired },
      include: {
        prerequisiteTest: {
          select: {
            id: true,
            title: true,
            joinCode: true,
          },
        },
      },
    });

    return {
      success: true,
      prerequisite: updatedPrerequisite,
    };
  } catch (error) {
    console.error("Error updating test prerequisite:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update prerequisite",
    };
  }
}

// Get the minimum score required if this test is used as a prerequisite for other tests
// Returns the minimum of all minScoreRequired values (most restrictive)
export async function getPrerequisiteMinScore(testId: string): Promise<{
  success: boolean;
  minScore?: number | null; // null means this test is not a prerequisite for any other test
  error?: string;
}> {
  try {
    // Get all prerequisites where this test is the prerequisite
    const prerequisites = await prisma.testPrerequisite.findMany({
      where: {
        prerequisiteTestId: testId,
      },
      select: {
        minScoreRequired: true,
      },
    });

    if (prerequisites.length === 0) {
      return {
        success: true,
        minScore: null, // Not a prerequisite for any test
      };
    }

    // Return the minimum score required (most restrictive)
    const minScore = Math.min(...prerequisites.map((p) => p.minScoreRequired));

    return {
      success: true,
      minScore,
    };
  } catch (error) {
    console.error("Error getting prerequisite min score:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get prerequisite min score",
    };
  }
}

// Delete a prerequisite
export async function deleteTestPrerequisite(prerequisiteId: string): Promise<{
  success: boolean;
  error?: string;
}> {
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

    // Get the prerequisite with its test
    const prerequisite = await prisma.testPrerequisite.findUnique({
      where: { id: prerequisiteId },
      include: {
        test: true,
      },
    });

    if (!prerequisite) {
      return {
        success: false,
        error: "Prerequisite not found",
      };
    }

    if (prerequisite.test.creatorId !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to delete this prerequisite",
      };
    }

    // Delete the prerequisite
    await prisma.testPrerequisite.delete({
      where: { id: prerequisiteId },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting test prerequisite:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete prerequisite",
    };
  }
}
