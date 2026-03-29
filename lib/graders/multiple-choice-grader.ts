import { prisma } from "@/lib/prisma";

type MultipleSelectChoiceInfo = { id: string; isCorrect: boolean };

/**
 * Grades a multiple-select answer using proportional (merciful) scoring.
 * Formula: max(0, (correctSelections - incorrectSelections) / totalCorrect) * maxScore
 * Rounded to the nearest integer. Score cannot go below 0.
 *
 * @param maxScore - The maximum points possible for this question
 * @param allChoices - All available choices with their correctness flags
 * @param selectedChoiceIds - IDs of choices the participant selected
 * @returns The calculated score based on proportional formula
 */
export function gradeMultipleSelectAnswer(
  maxScore: number,
  allChoices: MultipleSelectChoiceInfo[],
  selectedChoiceIds: string[],
): number {
  if (selectedChoiceIds.length === 0) return 0;

  const totalCorrect = allChoices.filter((c) => c.isCorrect).length;
  if (totalCorrect === 0) return 0;

  let correctSelections = 0;
  let incorrectSelections = 0;

  for (const selectedId of selectedChoiceIds) {
    const choice = allChoices.find((c) => c.id === selectedId);
    if (choice) {
      if (choice.isCorrect) {
        correctSelections++;
      } else {
        incorrectSelections++;
      }
    }
  }

  const scoreRatio = Math.max(
    0,
    (correctSelections - incorrectSelections) / totalCorrect,
  );
  return Math.round(scoreRatio * maxScore);
}

/**
 * Synchronously grades and returns the score for a multiple-select answer.
 * Fetches question data and calls gradeMultipleSelectAnswer for calculation.
 * This is a fast operation that can be done immediately in the request.
 *
 * @param questionId - The ID of the multiple-select question
 * @param selectedChoiceIds - Array of IDs of choices the participant selected
 * @returns Promise resolving to the calculated score
 * @throws Error if the question is not found in the database
 */
export async function gradeMultipleSelectAnswerSync(
  questionId: string,
  selectedChoiceIds: string[],
): Promise<number> {
  const msQuestion = await prisma.multipleSelectQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      maxScore: true,
      multipleSelectChoices: { select: { id: true, isCorrect: true } },
    },
  });

  if (!msQuestion) {
    throw new Error(`Multiple-select question not found: ${questionId}`);
  }

  return gradeMultipleSelectAnswer(
    msQuestion.maxScore,
    msQuestion.multipleSelectChoices,
    selectedChoiceIds,
  );
}
