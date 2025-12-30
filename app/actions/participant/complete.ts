"use server";

import { prisma } from "@/lib/prisma";

/**
 * Mark a participant's test as completed
 * This prevents further answer modifications
 */
export async function completeParticipantTest(participantId: string) {
  try {
    if (!participantId) {
      return {
        success: false,
        error: "Invalid participant ID",
      };
    }

    // Check if participant exists
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      select: { isCompleted: true },
    });

    if (!participant) {
      return {
        success: false,
        error: "Participant not found",
      };
    }

    if (participant.isCompleted) {
      return {
        success: true,
        message: "Test already completed",
      };
    }

    // Mark as completed
    await prisma.participant.update({
      where: { id: participantId },
      data: { isCompleted: true },
    });

    return {
      success: true,
      message: "Test completed successfully",
    };
  } catch (error) {
    console.error("Error completing participant test:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete test",
    };
  }
}
