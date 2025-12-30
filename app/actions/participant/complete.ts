"use server";

import { prisma } from "@/lib/prisma";

/**
 * Calculate percentage score (0-100) based on total score and max possible score
 */
async function calculatePercentageScore(
  participantId: string
): Promise<number> {
  // Get participant with test info
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      test: {
        include: {
          questions: {
            include: {
              essay: true,
              choice: true,
              multipleSelect: true,
            },
          },
        },
      },
    },
  });

  if (!participant) {
    return 0;
  }

  // Calculate total max score from all questions
  let totalMaxScore = 0;
  for (const question of participant.test.questions) {
    if (question.type === "ESSAY" && question.essay) {
      totalMaxScore += question.essay.maxScore;
    } else if (question.type === "CHOICE" && question.choice) {
      totalMaxScore += question.choice.maxScore;
    } else if (question.type === "MULTIPLE_SELECT" && question.multipleSelect) {
      totalMaxScore += question.multipleSelect.maxScore;
    }
  }

  // Get all answers and calculate total score
  const [essayAnswers, choiceAnswers, multipleSelectAnswers] =
    await Promise.all([
      prisma.essayAnswer.findMany({
        where: { participantId },
        select: { score: true },
      }),
      prisma.choiceAnswer.findMany({
        where: { participantId },
        select: { score: true },
      }),
      prisma.multipleSelectAnswer.findMany({
        where: { participantId },
        select: { score: true },
      }),
    ]);

  const totalScore =
    essayAnswers.reduce((sum, a) => sum + a.score, 0) +
    choiceAnswers.reduce((sum, a) => sum + a.score, 0) +
    multipleSelectAnswers.reduce((sum, a) => sum + a.score, 0);

  // Calculate percentage (0-100)
  if (totalMaxScore === 0) {
    return 0;
  }

  const percentage = (totalScore / totalMaxScore) * 100;
  return Math.round(percentage * 100) / 100; // Round to 2 decimal places
}

/**
 * Mark a participant's test as completed and calculate final percentage score
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

    // Calculate percentage score
    const percentageScore = await calculatePercentageScore(participantId);

    // Mark as completed and update score
    await prisma.participant.update({
      where: { id: participantId },
      data: {
        isCompleted: true,
        score: percentageScore,
      },
    });

    return {
      success: true,
      message: "Test completed successfully",
      score: percentageScore,
    };
  } catch (error) {
    console.error("Error completing participant test:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete test",
    };
  }
}
