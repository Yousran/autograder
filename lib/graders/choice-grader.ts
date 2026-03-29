import { prisma } from "@/lib/prisma";

/**
 * Grades a single-choice answer.
 * Returns `maxScore` when the selected choice is correct, otherwise 0.
 * A null selectedChoiceId (skipped) always scores 0.
 *
 * @param maxScore - The maximum points possible for this question
 * @param selectedChoice - The choice object with isCorrect flag, or null if skipped
 * @returns The score (0 or maxScore) based on correctness
 */
export function gradeChoiceAnswer(
  maxScore: number,
  selectedChoice: { isCorrect: boolean } | null,
): number {
  if (!selectedChoice) return 0;
  return selectedChoice.isCorrect ? maxScore : 0;
}

/**
 * Synchronously grades and returns the score for a choice answer.
 * This is a fast operation that can be done immediately in the request.
 *
 * @param questionId - The ID of the choice question
 * @param selectedChoiceId - The ID of the selected choice, or null if skipped
 * @returns Promise resolving to the calculated score
 * @throws Error if the question is not found in the database
 */
export async function gradeChoiceAnswerSync(
  questionId: string,
  selectedChoiceId: string | null,
): Promise<number> {
  const choiceQuestion = await prisma.choiceQuestion.findUnique({
    where: { id: questionId },
    select: { id: true, maxScore: true },
  });

  if (!choiceQuestion) {
    throw new Error(`Choice question not found: ${questionId}`);
  }

  const selectedChoice = selectedChoiceId
    ? await prisma.choice.findUnique({
        where: { id: selectedChoiceId },
        select: { isCorrect: true },
      })
    : null;

  return gradeChoiceAnswer(choiceQuestion.maxScore, selectedChoice);
}
