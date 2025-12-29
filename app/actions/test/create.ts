"use server";

import { auth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { headers } from "next/headers";
import { PrismaPg } from "@prisma/adapter-pg";
import { encodeJoinCodeFromNumber } from "@/lib/feistelEncrypt";
import { testSchema, TestValidation } from "@/lib/validations/test";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function createTest() {
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

    // Prepare default test data
    const defaultTestData: TestValidation = {
      title: "Untitled Test",
      testDuration: 30,
      maxAttempts: 1,
      description: "",
      isAcceptingResponses: true,
      loggedInUserOnly: false,
      showDetailedScore: true,
      showCorrectAnswers: false,
      isQuestionsOrdered: false,
    };

    // Validate the test data
    const validatedData = testSchema.parse(defaultTestData);

    // Create the test in the database
    const test = await prisma.test.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        testDuration: validatedData.testDuration,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        isAcceptingResponses: validatedData.isAcceptingResponses,
        loggedInUserOnly: validatedData.loggedInUserOnly,
        maxAttempts: validatedData.maxAttempts,
        showDetailedScore: validatedData.showDetailedScore,
        showCorrectAnswers: validatedData.showCorrectAnswers,
        isQuestionsOrdered: validatedData.isQuestionsOrdered,
        creatorId: session.user.id,
        joinCode: "",
      },
    });

    // Generate join code from the test ID
    const numericId = parseInt(test.id.replace(/\D/g, "").slice(0, 10)) || 1;
    const joinCode = encodeJoinCodeFromNumber(numericId);

    // Update the test with the generated join code
    await prisma.test.update({
      where: { id: test.id },
      data: { joinCode },
    });

    return {
      success: true,
      joinCode,
    };
  } catch (error) {
    console.error("Error creating test:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create test",
    };
  }
}
