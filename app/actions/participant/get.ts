"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

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
 * Returns only the best attempt (highest score) for each participant
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

    // Get all participants for the test
    const allParticipants = await prisma.participant.findMany({
      where: { testId },
      include: {
        user: true,
      },
      orderBy: {
        score: "desc",
      },
    });

    // Group participants by userId (for logged-in users) or name (for guests)
    // Keep only the highest scoring attempt for each participant
    const bestAttempts = new Map<string, (typeof allParticipants)[0]>();

    for (const participant of allParticipants) {
      // Use userId if available (logged-in user), otherwise use name+testId combination (guest)
      const key = participant.userId || `guest_${participant.name}`;

      const existing = bestAttempts.get(key);
      if (!existing || participant.score > existing.score) {
        bestAttempts.set(key, participant);
      }
    }

    // Convert map to array and sort by score descending
    const participants = Array.from(bestAttempts.values()).sort(
      (a, b) => b.score - a.score
    );

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
