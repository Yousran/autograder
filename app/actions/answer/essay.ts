"use server";

import { prisma } from "@/lib/prisma";
import {
  gradeExactEssayAnswer,
  gradeSubjectiveEssayAnswer,
} from "@/lib/essay-grader";

export interface UpdateEssayAnswerInput {
  answerId: string;
  participantId: string;
  answerText: string;
}

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
