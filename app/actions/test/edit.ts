"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { testSchema, TestValidation } from "@/lib/validations/test";
import { revalidatePath } from "next/cache";

export async function editTest(
  testId: string,
  testData: Partial<TestValidation>
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

    // Check if the test exists and belongs to the user
    const existingTest = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!existingTest) {
      return {
        success: false,
        error: "Test not found",
      };
    }

    if (existingTest.creatorId !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to edit this test",
      };
    }

    // Validate the test data
    const validatedData = testSchema.partial().parse(testData);

    // Update the test in the database
    const updatedTest = await prisma.test.update({
      where: { id: testId },
      data: {
        ...(validatedData.title !== undefined && {
          title: validatedData.title,
        }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.testDuration !== undefined && {
          testDuration: validatedData.testDuration,
        }),
        ...(validatedData.startTime !== undefined && {
          startTime: validatedData.startTime,
        }),
        ...(validatedData.endTime !== undefined && {
          endTime: validatedData.endTime,
        }),
        ...(validatedData.isAcceptingResponses !== undefined && {
          isAcceptingResponses: validatedData.isAcceptingResponses,
        }),
        ...(validatedData.loggedInUserOnly !== undefined && {
          loggedInUserOnly: validatedData.loggedInUserOnly,
        }),
        ...(validatedData.maxAttempts !== undefined && {
          maxAttempts: validatedData.maxAttempts,
        }),
        ...(validatedData.showDetailedScore !== undefined && {
          showDetailedScore: validatedData.showDetailedScore,
        }),
        ...(validatedData.showCorrectAnswers !== undefined && {
          showCorrectAnswers: validatedData.showCorrectAnswers,
        }),
        ...(validatedData.isQuestionsOrdered !== undefined && {
          isQuestionsOrdered: validatedData.isQuestionsOrdered,
        }),
      },
    });

    // Revalidate the test edit page to refresh the data
    revalidatePath(`/test/${existingTest.joinCode}/edit`);

    return {
      success: true,
      test: updatedTest,
    };
  } catch (error) {
    console.error("Error editing test:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to edit test",
    };
  }
}
