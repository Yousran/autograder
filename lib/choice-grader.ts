import { prisma } from "@/lib/prisma";

/**
 * Grade a choice answer by checking if the selected choice is correct
 * Returns the max score if correct, 0 otherwise
 */
export async function gradeChoiceAnswer(
  selectedChoiceId: string
): Promise<number> {
  const choice = await prisma.choice.findUnique({
    where: { id: selectedChoiceId },
    include: {
      question: {
        select: {
          maxScore: true,
        },
      },
    },
  });

  if (!choice) {
    return 0;
  }

  return choice.isCorrect ? choice.question.maxScore : 0;
}
