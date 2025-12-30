"use server";

import { prisma } from "@/lib/prisma";
import { shuffleArray } from "@/lib/shuffle";
import type {
  ParticipantTestData,
  QuestionWithAnswer,
} from "@/types/participant-test";

/**
 * Get participant test data including test info and questions with answers
 * This is used for the test-taking page
 */
export async function getParticipantTestData(participantId: string): Promise<{
  success: boolean;
  data?: ParticipantTestData;
  error?: string;
}> {
  try {
    // Get participant with test
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

    // Check if test is already completed
    if (participant.isCompleted) {
      return {
        success: false,
        error: "Test has already been completed. You can view your results.",
      };
    }

    const test = participant.test;

    // Get all questions for this test with their answers
    const questions = await prisma.question.findMany({
      where: { testId: test.id },
      orderBy: test.isQuestionsOrdered ? { order: "asc" } : undefined,
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

    // Create answers for questions that don't have them yet
    for (const question of questions) {
      if (question.type === "ESSAY" && question.essay) {
        if (question.essay.answers.length === 0) {
          await prisma.essayAnswer.create({
            data: {
              participantId,
              questionId: question.essay.id,
              answerText: "",
              score: 0,
            },
          });
        }
      } else if (question.type === "CHOICE" && question.choice) {
        if (question.choice.answers.length === 0) {
          await prisma.choiceAnswer.create({
            data: {
              participantId,
              questionId: question.choice.id,
              selectedChoiceId: null,
              score: 0,
            },
          });
        }
      } else if (
        question.type === "MULTIPLE_SELECT" &&
        question.multipleSelect
      ) {
        if (question.multipleSelect.answers.length === 0) {
          await prisma.multipleSelectAnswer.create({
            data: {
              participantId,
              questionId: question.multipleSelect.id,
              score: 0,
            },
          });
        }
      }
    }

    // Re-fetch questions with newly created answers
    const questionsWithAnswers = await prisma.question.findMany({
      where: { testId: test.id },
      orderBy: test.isQuestionsOrdered ? { order: "asc" } : undefined,
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

    // Transform to QuestionWithAnswer format
    let transformedQuestions: QuestionWithAnswer[] = questionsWithAnswers.map(
      (q) => {
        const base = {
          id: q.id,
          testId: q.testId,
          questionText: q.questionText,
          type: q.type,
          order: q.order,
        };

        if (q.type === "ESSAY" && q.essay) {
          const answer = q.essay.answers[0];
          return {
            ...base,
            essay: {
              id: q.essay.id,
              answerText: q.essay.answerText,
              isExactAnswer: q.essay.isExactAnswer,
              maxScore: q.essay.maxScore,
              answer: {
                id: answer.id,
                participantId: answer.participantId,
                questionId: answer.questionId,
                answerText: answer.answerText,
                score: answer.score,
              },
            },
            choice: null,
            multipleSelect: null,
          };
        } else if (q.type === "CHOICE" && q.choice) {
          const answer = q.choice.answers[0];
          // Shuffle choices if randomization is enabled
          let choices = q.choice.choices.map((c) => ({
            id: c.id,
            questionId: c.questionId,
            choiceText: c.choiceText,
          }));
          if (q.choice.isChoiceRandomized) {
            choices = shuffleArray(choices);
          }
          return {
            ...base,
            essay: null,
            choice: {
              id: q.choice.id,
              isChoiceRandomized: q.choice.isChoiceRandomized,
              maxScore: q.choice.maxScore,
              choices,
              answer: {
                id: answer.id,
                questionId: answer.questionId,
                participantId: answer.participantId,
                score: answer.score,
                selectedChoiceId: answer.selectedChoiceId,
              },
            },
            multipleSelect: null,
          };
        } else if (q.type === "MULTIPLE_SELECT" && q.multipleSelect) {
          const answer = q.multipleSelect.answers[0];
          // Shuffle choices if randomization is enabled
          let choices = q.multipleSelect.multipleSelectChoices.map((c) => ({
            id: c.id,
            questionId: c.questionId,
            choiceText: c.choiceText,
          }));
          if (q.multipleSelect.isChoiceRandomized) {
            choices = shuffleArray(choices);
          }
          return {
            ...base,
            essay: null,
            choice: null,
            multipleSelect: {
              id: q.multipleSelect.id,
              isChoiceRandomized: q.multipleSelect.isChoiceRandomized,
              maxScore: q.multipleSelect.maxScore,
              multipleSelectChoices: choices,
              answer: {
                id: answer.id,
                questionId: answer.questionId,
                participantId: answer.participantId,
                score: answer.score,
                selectedChoices: answer.selectedChoices.map((sc) => ({
                  id: sc.id,
                  questionId: sc.questionId,
                  choiceText: sc.choiceText,
                })),
              },
            },
          };
        }

        // Should never reach here
        return base as QuestionWithAnswer;
      }
    );

    // Shuffle questions if not ordered
    if (!test.isQuestionsOrdered) {
      transformedQuestions = shuffleArray(transformedQuestions);
    }

    return {
      success: true,
      data: {
        participant: {
          id: participant.id,
          testId: participant.testId,
          userId: participant.userId,
          name: participant.name,
          score: participant.score,
          createdAt: participant.createdAt,
          updatedAt: participant.updatedAt,
        },
        test: {
          id: test.id,
          creatorId: test.creatorId,
          title: test.title,
          joinCode: test.joinCode,
          description: test.description,
          testDuration: test.testDuration,
          startTime: test.startTime,
          endTime: test.endTime,
          isAcceptingResponses: test.isAcceptingResponses,
          showDetailedScore: test.showDetailedScore,
          showCorrectAnswers: test.showCorrectAnswers,
          isQuestionsOrdered: test.isQuestionsOrdered,
        },
        questions: transformedQuestions,
      },
    };
  } catch (error) {
    console.error("Error getting participant test data:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get participant test data",
    };
  }
}
