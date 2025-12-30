"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import type {
  ParticipantResultData,
  QuestionAnswerDetail,
} from "@/types/answer";

/**
 * Get participant result data for the result page
 * This includes participant info, test info, and basic score
 */
export async function getParticipantResult(participantId: string): Promise<{
  success: boolean;
  data?: {
    participant: {
      id: string;
      name: string;
      score: number;
      isCompleted: boolean;
    };
    test: {
      id: string;
      title: string;
      joinCode: string;
      showDetailedScore: boolean;
      showCorrectAnswers: boolean;
      creatorId: string;
    };
  };
  error?: string;
}> {
  try {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        test: true,
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
      data: {
        participant: {
          id: participant.id,
          name: participant.name,
          score: participant.score,
          isCompleted: participant.isCompleted,
        },
        test: {
          id: participant.test.id,
          title: participant.test.title,
          joinCode: participant.test.joinCode,
          showDetailedScore: participant.test.showDetailedScore,
          showCorrectAnswers: participant.test.showCorrectAnswers,
          creatorId: participant.test.creatorId,
        },
      },
    };
  } catch (error) {
    console.error("Error getting participant result:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get participant result",
    };
  }
}

/**
 * Get detailed participant result data including all questions and answers
 * For creator: shows all answers with correct answers
 * For participant: shows answers based on test settings (showDetailedScore, showCorrectAnswers)
 */
export async function getParticipantResultDetails(
  participantId: string
): Promise<{
  success: boolean;
  data?: ParticipantResultData;
  isCreator?: boolean;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        test: true,
      },
    });

    if (!participant) {
      return {
        success: false,
        error: "Participant not found",
      };
    }

    const test = participant.test;
    const isCreator = session?.user?.id === test.creatorId;

    // If not creator and detailed score is not allowed
    if (!isCreator && !test.showDetailedScore) {
      return {
        success: false,
        error: "Detailed results are not available for this test",
      };
    }

    // Get all questions with answers for this participant
    const questions = await prisma.question.findMany({
      where: { testId: test.id },
      orderBy: { order: "asc" },
      include: {
        essay: {
          include: {
            answers: {
              where: { participantId },
              take: 1,
            },
          },
        },
        choice: {
          include: {
            choices: true,
            answers: {
              where: { participantId },
              take: 1,
            },
          },
        },
        multipleSelect: {
          include: {
            multipleSelectChoices: true,
            answers: {
              where: { participantId },
              include: {
                selectedChoices: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    // Transform to QuestionAnswerDetail format
    const transformedQuestions: QuestionAnswerDetail[] = questions.map((q) => {
      const base = {
        id: q.id,
        questionText: q.questionText,
        type: q.type as "ESSAY" | "CHOICE" | "MULTIPLE_SELECT",
        order: q.order,
      };

      if (q.type === "ESSAY" && q.essay) {
        const answer = q.essay.answers[0];
        return {
          ...base,
          maxScore: q.essay.maxScore,
          essay: {
            id: q.essay.id,
            answerText: q.essay.answerText,
            isExactAnswer: q.essay.isExactAnswer,
            maxScore: q.essay.maxScore,
            participantAnswer: answer
              ? {
                  id: answer.id,
                  participantId: answer.participantId,
                  questionId: answer.questionId,
                  answerText: answer.answerText,
                  scoreExplanation: answer.scoreExplanation,
                  score: answer.score,
                }
              : null,
          },
          choice: null,
          multipleSelect: null,
        };
      } else if (q.type === "CHOICE" && q.choice) {
        const answer = q.choice.answers[0];
        return {
          ...base,
          maxScore: q.choice.maxScore,
          essay: null,
          choice: {
            id: q.choice.id,
            isChoiceRandomized: q.choice.isChoiceRandomized,
            maxScore: q.choice.maxScore,
            choices: q.choice.choices.map((c) => ({
              id: c.id,
              questionId: c.questionId,
              choiceText: c.choiceText,
              isCorrect: c.isCorrect,
            })),
            participantAnswer: answer
              ? {
                  id: answer.id,
                  questionId: answer.questionId,
                  participantId: answer.participantId,
                  selectedChoiceId: answer.selectedChoiceId,
                  score: answer.score,
                }
              : null,
          },
          multipleSelect: null,
        };
      } else if (q.type === "MULTIPLE_SELECT" && q.multipleSelect) {
        const answer = q.multipleSelect.answers[0];
        return {
          ...base,
          maxScore: q.multipleSelect.maxScore,
          essay: null,
          choice: null,
          multipleSelect: {
            id: q.multipleSelect.id,
            isChoiceRandomized: q.multipleSelect.isChoiceRandomized,
            maxScore: q.multipleSelect.maxScore,
            multipleSelectChoices: q.multipleSelect.multipleSelectChoices.map(
              (c) => ({
                id: c.id,
                questionId: c.questionId,
                choiceText: c.choiceText,
                isCorrect: c.isCorrect,
              })
            ),
            participantAnswer: answer
              ? {
                  id: answer.id,
                  questionId: answer.questionId,
                  participantId: answer.participantId,
                  selectedChoices: answer.selectedChoices.map((sc) => ({
                    id: sc.id,
                    questionId: sc.questionId,
                    choiceText: sc.choiceText,
                    isCorrect: sc.isCorrect,
                  })),
                  score: answer.score,
                }
              : null,
          },
        };
      }

      // Fallback (shouldn't happen)
      return {
        ...base,
        maxScore: 0,
        essay: null,
        choice: null,
        multipleSelect: null,
      };
    });

    return {
      success: true,
      isCreator,
      data: {
        participant: {
          id: participant.id,
          name: participant.name,
          score: participant.score,
          isCompleted: participant.isCompleted,
        },
        test: {
          id: test.id,
          title: test.title,
          showDetailedScore: test.showDetailedScore,
          showCorrectAnswers: test.showCorrectAnswers,
          creatorId: test.creatorId,
        },
        questions: transformedQuestions,
      },
    };
  } catch (error) {
    console.error("Error getting participant result details:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get participant result details",
    };
  }
}

/**
 * Check if current user is the creator of the test for a participant
 */
export async function isTestCreator(participantId: string): Promise<{
  success: boolean;
  isCreator?: boolean;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: true,
        isCreator: false,
      };
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        test: {
          select: {
            creatorId: true,
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
      isCreator: session.user.id === participant.test.creatorId,
    };
  } catch (error) {
    console.error("Error checking test creator:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to check creator status",
    };
  }
}
