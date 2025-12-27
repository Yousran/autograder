"use server";

import { auth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { headers } from "next/headers";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

/**
 * Get a participant by ID
 */
export async function getParticipantById(participantId: string) {
  try {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        test: true,
        user: true,
      },
    });

    if (!participant) {
      return {
        success: false,
        error: "Participant not found",
      };
    }

    return {
      success: true,
      participant,
    };
  } catch (error) {
    console.error("Error getting participant by ID:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get participant",
    };
  }
}

/**
 * Get a participant by ID with their answers
 */
export async function getParticipantWithAnswers(participantId: string) {
  try {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        test: true,
        user: true,
        essayAnswers: {
          include: {
            question: true,
          },
        },
        choiceAnswers: {
          include: {
            question: true,
            choice: true,
          },
        },
        multipleSelectAnswers: {
          include: {
            question: true,
            selectedChoices: true,
          },
        },
      },
    });

    if (!participant) {
      return {
        success: false,
        error: "Participant not found",
      };
    }

    return {
      success: true,
      participant,
    };
  } catch (error) {
    console.error("Error getting participant with answers:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get participant",
    };
  }
}

/**
 * Get all participants for a specific test (requires test creator authorization)
 */
export async function getParticipantsByTestId(testId: string) {
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

    // Check if the user is the test creator
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
        error: "You are not authorized to view participants for this test",
      };
    }

    const participants = await prisma.participant.findMany({
      where: { testId },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      participants,
    };
  } catch (error) {
    console.error("Error getting participants by test ID:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get participants",
    };
  }
}
/**
 * Get participant count and attempt info for a test (for max attempts check)
 */
export async function getParticipantAttempts(testId: string) {
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

    const attempts = await prisma.participant.count({
      where: {
        testId,
        userId: session.user.id,
      },
    });

    return {
      success: true,
      attempts,
    };
  } catch (error) {
    console.error("Error getting participant attempts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get attempts",
    };
  }
}
