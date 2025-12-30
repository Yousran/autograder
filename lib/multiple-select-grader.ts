import { prisma } from "@/lib/prisma";

/**
 * Grade a multiple select answer
 * Uses proportional scoring: (correct selections - incorrect selections) / total correct options
 * Score cannot go below 0
 */
export async function gradeMultipleSelectAnswer(
  selectedChoiceIds: string[]
): Promise<number> {
  if (selectedChoiceIds.length === 0) {
    return 0;
  }

  // Get the first choice to find the question
  const firstChoice = await prisma.multipleSelectChoice.findUnique({
    where: { id: selectedChoiceIds[0] },
    select: { questionId: true },
  });

  if (!firstChoice) {
    return 0;
  }

  // Get all choices for this question
  const allChoices = await prisma.multipleSelectChoice.findMany({
    where: { questionId: firstChoice.questionId },
    select: {
      id: true,
      isCorrect: true,
    },
  });

  // Get the question's max score
  const question = await prisma.multipleSelectQuestion.findUnique({
    where: { id: firstChoice.questionId },
    select: { maxScore: true },
  });

  if (!question) {
    return 0;
  }

  const correctChoices = allChoices.filter((c) => c.isCorrect);
  const totalCorrect = correctChoices.length;

  if (totalCorrect === 0) {
    return 0;
  }

  // Count correct and incorrect selections
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

  // Calculate score: (correct - incorrect) / totalCorrect * maxScore
  // Ensure score doesn't go below 0
  const scoreRatio = Math.max(
    0,
    (correctSelections - incorrectSelections) / totalCorrect
  );
  const score = Math.round(scoreRatio * question.maxScore);

  return score;
}
