import { prisma } from "@/lib/prisma";

/**
 * Grades a single-choice answer.
 * Returns `maxScore` when the selected choice is correct, otherwise 0.
 * A null selectedChoiceId (skipped) always scores 0.
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
