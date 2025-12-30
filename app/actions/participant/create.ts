"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import {
  participantJoinSchema,
  type ParticipantJoinValidation,
} from "@/lib/validations/participant";

/**
 * Create a new participant for a test
 * Handles both authenticated users and guests
 */
export async function createParticipant(data: ParticipantJoinValidation) {
  try {
    // Get session (may be null for guests)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Validate input
    const validatedData = participantJoinSchema.parse(data);

    // Get the test
    const test = await prisma.test.findUnique({
      where: { joinCode: validatedData.joinCode },
      include: {
        participants: {
          where: session?.user?.id
            ? { userId: session.user.id }
            : { name: validatedData.name, userId: null },
        },
      },
    });

    if (!test) {
      return {
        success: false,
        error: "Test not found",
      };
    }

    // Check if user is logged in when required
    if (test.loggedInUserOnly && !session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to join this test",
      };
    }

    // Check if test is accepting responses
    if (!test.isAcceptingResponses) {
      return {
        success: false,
        error: "This test is not accepting responses",
      };
    }

    // Check time restrictions
    const now = new Date();
    if (test.startTime && now < test.startTime) {
      return {
        success: false,
        error: "This test has not started yet",
      };
    }

    if (test.endTime && now > test.endTime) {
      return {
        success: false,
        error: "This test has ended",
      };
    }

    // Check max attempts
    if (test.maxAttempts !== null && test.maxAttempts > 0) {
      const attemptCount = test.participants.length;
      if (attemptCount >= test.maxAttempts) {
        return {
          success: false,
          error: `You have reached the maximum number of attempts (${test.maxAttempts})`,
        };
      }
    }

    // Create participant
    const participant = await prisma.participant.create({
      data: {
        testId: test.id,
        userId: session?.user?.id || null,
        name: session?.user?.name || validatedData.name,
        score: 0,
      },
    });

    return {
      success: true,
      participantId: participant.id,
      showCorrectAnswers: test.showCorrectAnswers,
    };
  } catch (error) {
    console.error("Error creating participant:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create participant",
    };
  }
}
