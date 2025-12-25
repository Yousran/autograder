"use server";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createParticipantSchema } from "@/lib/validations/participant";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function createParticipant(input: {
  testId: string;
  username?: string;
}): Promise<
  { success: true; participantId: string } | { error: string; code?: string }
> {
  try {
    // Validate input
    const validationResult = createParticipantSchema.safeParse(input);
    if (!validationResult.success) {
      return {
        error: validationResult.error.message || "Invalid input",
      };
    }

    const { testId, username } = validationResult.data;

    // Get session from betterauth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user?.id;
    const userName = session?.user?.name;

    // Get test details
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: true,
        participants: {
          where: userId ? { userId } : { name: username },
          include: {
            essayAnswers: true,
            choiceAnswers: true,
            multipleSelectAnswers: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!test) {
      return { error: "Test not found" };
    }

    // Check if test is accepting responses
    if (!test.isAcceptingResponses) {
      return {
        error: "This test is not accepting responses",
      };
    }

    // Check if test requires logged-in users
    if (test.loggedInUserOnly && !userId) {
      return {
        error: "This test requires you to be logged in",
      };
    }

    // For guests, username is required
    if (!userId && !username) {
      return {
        error: "Username is required for guest users",
      };
    }

    const totalQuestions = test.questions.length;
    const existingParticipants = test.participants;

    // Check for a participant with incomplete test (currently working)
    for (const participant of existingParticipants) {
      const totalAnswers =
        participant.essayAnswers.length +
        participant.choiceAnswers.length +
        participant.multipleSelectAnswers.length;

      // If participant hasn't answered all questions, they're still working on it
      if (totalAnswers < totalQuestions) {
        return { success: true, participantId: participant.id };
      }
    }

    // All existing participants have completed the test
    // Check if within maxAttempts limit
    const completedAttempts = existingParticipants.length;
    const maxAttempts = test.maxAttempts || Infinity;

    if (completedAttempts >= maxAttempts) {
      return {
        error: `Maximum attempts (${maxAttempts}) reached`,
      };
    }

    // Create new participant
    const newParticipant = await prisma.participant.create({
      data: {
        testId,
        userId: userId || null,
        name: userId ? userName || "User" : username!,
      },
    });

    return { success: true, participantId: newParticipant.id };
  } catch (error) {
    console.error("Error creating participant:", error);
    return {
      error: "Failed to create participant",
    };
  }
}
