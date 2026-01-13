"use server";

import { prisma } from "@/lib/prisma";
import {
  gradeExactEssayAnswer,
  gradeSubjectiveEssayAnswer,
} from "@/lib/essay-grader";
import { devLog } from "@/utils/devLog";

export interface UpdateEssayAnswerInput {
  answerId: string;
  participantId: string;
  answerText: string;
}

/**
 * Save essay answer text immediately without waiting for AI grading.
 * This allows fast navigation between questions.
 * For exact answers, grading is synchronous and fast.
 * For subjective answers, only saves the text - grading should be triggered separately.
 */
export async function saveEssayAnswerText(input: UpdateEssayAnswerInput) {
  try {
    const { answerId, participantId, answerText } = input;

    if (!answerId || !participantId || typeof answerText !== "string") {
      return {
        success: false,
        error: "Invalid request body",
        needsAsyncGrading: false,
      };
    }

    // Fetch participant and answer in parallel
    const [participant, answer] = await Promise.all([
      prisma.participant.findUnique({
        where: { id: participantId },
        include: { test: true },
      }),
      prisma.essayAnswer.findUnique({
        where: { id: answerId },
        select: {
          participantId: true,
          question: {
            select: {
              question: true,
              isExactAnswer: true,
              maxScore: true,
              answerText: true,
            },
          },
        },
      }),
    ]);

    if (!participant?.test?.isAcceptingResponses) {
      return {
        success: false,
        error: "Test is not accepting responses",
        needsAsyncGrading: false,
      };
    }

    if (participant.isCompleted) {
      return {
        success: false,
        error: "Test has been completed and answers cannot be modified",
        needsAsyncGrading: false,
      };
    }

    if (!answer || answer.participantId !== participantId) {
      return {
        success: false,
        error: "Unauthorized",
        needsAsyncGrading: false,
      };
    }

    const { isExactAnswer, maxScore, answerText: answerKey } = answer.question;
    const minScore = 0;

    // For exact answers, grade immediately (fast)
    if (isExactAnswer) {
      const score = gradeExactEssayAnswer({
        answer: answerText,
        answerKey,
        minScore,
        maxScore,
      });

      const updated = await prisma.essayAnswer.update({
        where: { id: answerId },
        data: {
          answerText,
          score,
        },
      });

      return {
        success: true,
        answer: updated,
        needsAsyncGrading: false,
      };
    }

    // For subjective answers, just save the text (grading will be done async)
    const updated = await prisma.essayAnswer.update({
      where: { id: answerId },
      data: {
        answerText,
      },
    });

    devLog(`Essay answer ${answerId} saved, pending async grading`);

    return {
      success: true,
      answer: updated,
      needsAsyncGrading: true,
    };
  } catch (error) {
    console.error("Error saving essay answer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      needsAsyncGrading: false,
    };
  }
}

/**
 * Grade a single essay answer asynchronously.
 * This is called after saving the answer text.
 * Returns a promise that resolves when grading is complete.
 */
export async function gradeEssayAnswerAsync(input: {
  answerId: string;
  participantId: string;
}) {
  try {
    const { answerId, participantId } = input;

    const answer = await prisma.essayAnswer.findUnique({
      where: { id: answerId },
      select: {
        answerText: true,
        participantId: true,
        question: {
          select: {
            question: true,
            maxScore: true,
            answerText: true,
          },
        },
      },
    });

    if (!answer || answer.participantId !== participantId) {
      devLog(`Essay answer ${answerId} not found or unauthorized`);
      return { success: false, error: "Not found or unauthorized" };
    }

    const { maxScore, answerText: answerKey } = answer.question;
    const minScore = 0;

    devLog(`Starting AI grading for essay answer ${answerId}`);

    const result = await gradeSubjectiveEssayAnswer({
      questionText: answer.question.question.questionText,
      answer: answer.answerText,
      answerKey,
      minScore,
      maxScore,
    });

    const updated = await prisma.essayAnswer.update({
      where: { id: answerId },
      data: {
        score: result.score,
        scoreExplanation: result.explanation || null,
      },
    });

    devLog(`Essay answer ${answerId} graded: score=${result.score}`);

    return {
      success: true,
      answer: updated,
    };
  } catch (error) {
    console.error("Error grading essay answer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}

/**
 * Legacy function - updates essay answer with immediate grading (synchronous).
 * Consider using saveEssayAnswerText + gradeEssayAnswerAsync for better UX.
 */
export async function updateEssayAnswer(input: UpdateEssayAnswerInput) {
  try {
    const { answerId, participantId, answerText } = input;

    if (!answerId || !participantId || typeof answerText !== "string") {
      return {
        success: false,
        error: "Invalid request body",
      };
    }

    // Fetch participant and answer in parallel
    const [participant, answer] = await Promise.all([
      prisma.participant.findUnique({
        where: { id: participantId },
        include: { test: true },
      }),
      prisma.essayAnswer.findUnique({
        where: { id: answerId },
        select: {
          participantId: true,
          question: {
            select: {
              question: true,
              isExactAnswer: true,
              maxScore: true,
              answerText: true,
            },
          },
        },
      }),
    ]);

    if (!participant?.test?.isAcceptingResponses) {
      return {
        success: false,
        error: "Test is not accepting responses",
      };
    }

    if (participant.isCompleted) {
      return {
        success: false,
        error: "Test has been completed and answers cannot be modified",
      };
    }

    if (!answer || answer.participantId !== participantId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const { isExactAnswer, maxScore, answerText: answerKey } = answer.question;
    const minScore = 0;

    let score: number;
    let explanation: string | null = null;

    if (isExactAnswer) {
      score = gradeExactEssayAnswer({
        answer: answerText,
        answerKey,
        minScore,
        maxScore,
      });
    } else {
      const result = await gradeSubjectiveEssayAnswer({
        questionText: answer.question.question.questionText,
        answer: answerText,
        answerKey,
        minScore,
        maxScore,
      });

      score = result.score;
      explanation = result.explanation || null;
    }

    const updated = await prisma.essayAnswer.update({
      where: { id: answerId },
      data: {
        answerText,
        score,
        ...(explanation && { scoreExplanation: explanation }),
      },
    });

    return {
      success: true,
      answer: updated,
    };
  } catch (error) {
    console.error("Error updating essay answer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}
