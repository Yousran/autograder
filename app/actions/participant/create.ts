"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import {
  participantJoinSchema,
  type ParticipantJoinValidation,
} from "@/lib/validations/participant";
import { checkTestPrerequisites } from "@/app/actions/prerequisite";

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
        prerequisites: true, // Include prerequisites to check if any exist
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

    // Check prerequisites (only for logged-in users)
    if (session?.user?.id && test.prerequisites.length > 0) {
      const prereqResult = await checkTestPrerequisites(test.id);

      if (!prereqResult.success) {
        return {
          success: false,
          error: prereqResult.error || "Failed to check prerequisites",
        };
      }

      if (!prereqResult.canJoin) {
        // Find the first failed prerequisite to show in error message
        const failedPrereq = prereqResult.prerequisites?.find((p) => !p.passed);
        if (failedPrereq) {
          const scoreMsg =
            failedPrereq.userBestScore === null
              ? "You haven't completed"
              : `Your best score (${failedPrereq.userBestScore.toFixed(
                  1
                )}) doesn't meet the required score (${
                  failedPrereq.requiredScore
                }) for`;

          return {
            success: false,
            error: `${scoreMsg} "${failedPrereq.prerequisiteTestTitle}". Please complete the prerequisite test first.`,
            prerequisiteJoinCode: failedPrereq.prerequisiteTestJoinCode,
          };
        }

        return {
          success: false,
          error: "You don't meet the prerequisites for this test",
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
