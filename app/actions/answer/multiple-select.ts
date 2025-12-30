"use server";

import { prisma } from "@/lib/prisma";
import { gradeMultipleSelectAnswer } from "@/lib/multiple-select-grader";

export interface UpdateMultipleSelectAnswerInput {
  answerId: string;
  participantId: string;
  selectedChoiceIds: string[];
}

export async function updateMultipleSelectAnswer(
  input: UpdateMultipleSelectAnswerInput
) {
  try {
    const { answerId, participantId, selectedChoiceIds } = input;

    if (!answerId || !participantId || !Array.isArray(selectedChoiceIds)) {
      return {
        success: false,
        error: "Invalid request body",
      };
    }

    // Fetch participant and existing answer in parallel
    const [participant, existingAnswer] = await Promise.all([
      prisma.participant.findUnique({
        where: { id: participantId },
        include: { test: true },
      }),
      prisma.multipleSelectAnswer.findUnique({
        where: { id: answerId },
        select: { participantId: true },
      }),
    ]);

    if (!participant?.test?.isAcceptingResponses) {
      return {
        success: false,
        error: "Test is not accepting responses",
      };
    }

    if (!existingAnswer || existingAnswer.participantId !== participantId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Grade the answer
    const score = await gradeMultipleSelectAnswer(selectedChoiceIds);

    // Update answer and score
    const updatedAnswer = await prisma.multipleSelectAnswer.update({
      where: { id: answerId },
      data: {
        selectedChoices: {
          set: [], // Clear existing selections
          connect: selectedChoiceIds.map((id) => ({ id })),
        },
        score,
      },
      include: {
        selectedChoices: true,
      },
    });

    return {
      success: true,
      answer: updatedAnswer,
    };
  } catch (error) {
    console.error("Error updating multiple select answer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}
