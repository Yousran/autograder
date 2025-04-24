import { prisma } from "@/lib/prisma";

/**
 * Hitung score berdasarkan selectedChoiceId.
 * Jika pilihan benar, return maxScore, kalau salah return 0.
 *
 * @param selectedChoiceId - ID dari choice yang dipilih
 * @returns skor yang harus diberikan
 */
export async function gradeChoiceAnswer(
  selectedChoiceId: string
): Promise<number> {
  const choice = await prisma.choice.findUnique({
    where: { id: selectedChoiceId },
    include: {
      question: {
        select: { maxScore: true },
      },
    },
  });

  if (!choice || !choice.question) {
    throw new Error("Invalid selectedChoiceId");
  }

  const score = choice.isCorrect ? choice.question.maxScore : 0;
  return score;
}
