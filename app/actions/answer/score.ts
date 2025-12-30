"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * Update the score of an essay answer (for manual grading by test creator)
 */
export async function updateEssayScore(answerId: string, score: number) {
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

    // Get the answer with question and test info
    const answer = await prisma.essayAnswer.findUnique({
      where: { id: answerId },
      include: {
        question: {
          include: {
            question: {
              include: {
                test: true,
              },
            },
          },
        },
        participant: true,
      },
    });

    if (!answer) {
      return {
        success: false,
        error: "Answer not found",
      };
    }

    // Check if user is the test creator
    if (answer.question.question.test.creatorId !== session.user.id) {
      return {
        success: false,
        error: "You are not authorized to grade this answer",
      };
    }

    // Validate score
    const maxScore = answer.question.maxScore;
    if (score < 0 || score > maxScore) {
      return {
        success: false,
        error: `Score must be between 0 and ${maxScore}`,
      };
    }

    // Update the score
    const updated = await prisma.essayAnswer.update({
      where: { id: answerId },
      data: { score },
    });

    // Recalculate participant's total score
    await recalculateParticipantScore(answer.participantId);

    return {
      success: true,
      answer: updated,
    };
  } catch (error) {
    console.error("Error updating essay score:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update score",
    };
  }
}

/**
 * Update the score of a choice answer (for manual grading by test creator)
 */
export async function updateChoiceScore(answerId: string, score: number) {
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

    // Get the answer with question and test info
    const answer = await prisma.choiceAnswer.findUnique({
      where: { id: answerId },
      include: {
        question: {
          include: {
            question: {
              include: {
                test: true,
              },
            },
          },
        },
        participant: true,
      },
    });

    if (!answer) {
      return {
        success: false,
        error: "Answer not found",
      };
    }

    // Check if user is the test creator
    if (answer.question.question.test.creatorId !== session.user.id) {
      return {
        success: false,
        error: "You are not authorized to grade this answer",
      };
    }

    // Validate score
    const maxScore = answer.question.maxScore;
    if (score < 0 || score > maxScore) {
      return {
        success: false,
        error: `Score must be between 0 and ${maxScore}`,
      };
    }

    // Update the score
    const updated = await prisma.choiceAnswer.update({
      where: { id: answerId },
      data: { score },
    });

    // Recalculate participant's total score
    await recalculateParticipantScore(answer.participantId);

    return {
      success: true,
      answer: updated,
    };
  } catch (error) {
    console.error("Error updating choice score:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update score",
    };
  }
}

/**
 * Update the score of a multiple select answer (for manual grading by test creator)
 */
export async function updateMultipleSelectScore(
  answerId: string,
  score: number
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

    // Get the answer with question and test info
    const answer = await prisma.multipleSelectAnswer.findUnique({
      where: { id: answerId },
      include: {
        question: {
          include: {
            question: {
              include: {
                test: true,
              },
            },
          },
        },
        participant: true,
      },
    });

    if (!answer) {
      return {
        success: false,
        error: "Answer not found",
      };
    }

    // Check if user is the test creator
    if (answer.question.question.test.creatorId !== session.user.id) {
      return {
        success: false,
        error: "You are not authorized to grade this answer",
      };
    }

    // Validate score
    const maxScore = answer.question.maxScore;
    if (score < 0 || score > maxScore) {
      return {
        success: false,
        error: `Score must be between 0 and ${maxScore}`,
      };
    }

    // Update the score
    const updated = await prisma.multipleSelectAnswer.update({
      where: { id: answerId },
      data: { score },
    });

    // Recalculate participant's total score
    await recalculateParticipantScore(answer.participantId);

    return {
      success: true,
      answer: updated,
    };
  } catch (error) {
    console.error("Error updating multiple select score:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update score",
    };
  }
}

/**
 * Recalculate and update participant's total score based on all their answers
 * Calculates as percentage (0-100) of total possible score
 */
async function recalculateParticipantScore(participantId: string) {
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

  // Get all answers for this participant
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

  // Calculate total score
  const totalScore =
    essayAnswers.reduce((sum, a) => sum + a.score, 0) +
    choiceAnswers.reduce((sum, a) => sum + a.score, 0) +
    multipleSelectAnswers.reduce((sum, a) => sum + a.score, 0);

  // Calculate percentage (0-100)
  let percentageScore = 0;
  if (totalMaxScore > 0) {
    percentageScore = (totalScore / totalMaxScore) * 100;
    percentageScore = Math.round(percentageScore * 100) / 100; // Round to 2 decimal places
  }

  // Update participant's score
  await prisma.participant.update({
    where: { id: participantId },
    data: { score: percentageScore },
  });

  return percentageScore;
}
