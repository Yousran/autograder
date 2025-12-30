"use server";

import { prisma } from "@/lib/prisma";
import { gradeChoiceAnswer } from "@/lib/choice-grader";

export interface UpdateChoiceAnswerInput {
  answerId: string;
  participantId: string;
  selectedChoiceId: string;
}

export async function updateChoiceAnswer(input: UpdateChoiceAnswerInput) {
  try {
    const { answerId, participantId, selectedChoiceId } = input;

    if (!answerId || !participantId || !selectedChoiceId) {
      return {
        success: false,
        error: "Invalid request body",
      };
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        test: true,
      },
    });

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

    // Check if the answer belongs to the participant
    const answer = await prisma.choiceAnswer.findUnique({
      where: { id: answerId },
      select: { participantId: true },
    });

    if (!answer || answer.participantId !== participantId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const score = await gradeChoiceAnswer(selectedChoiceId);

    // Update the answer
    const updated = await prisma.choiceAnswer.update({
      where: { id: answerId },
      data: { selectedChoiceId, score },
    });

    return {
      success: true,
      answer: updated,
    };
  } catch (error) {
    console.error("Error updating choice answer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}
