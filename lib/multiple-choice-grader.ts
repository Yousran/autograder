import { prisma } from "@/lib/prisma";

/**
 * Hitung skor untuk soal multiple choice berdasarkan pilihan yang dipilih.
 * Skor maksimal diberikan jika dan hanya jika semua jawaban benar dipilih, dan tidak ada jawaban salah yang dipilih.
 */
export async function gradeMultipleChoiceAnswer(
  selectedChoiceIds: string[]
): Promise<number> {
  if (selectedChoiceIds.length === 0) return 0;

  // Ambil semua pilihan dari DB berdasarkan selectedChoiceIds
  const selectedChoices = await prisma.multipleChoice.findMany({
    where: {
      id: { in: selectedChoiceIds },
    },
    include: {
      question: {
        select: { id: true, maxScore: true },
      },
    },
  });

  if (selectedChoices.length === 0) {
    throw new Error("Invalid selected choice IDs");
  }

  const questionId = selectedChoices[0].question.id;

  // Ambil semua pilihan yang benar untuk soal tersebut
  const correctChoices = await prisma.multipleChoice.findMany({
    where: {
      questionId,
      isCorrect: true,
    },
  });

  const correctChoiceIds = correctChoices.map((c) => c.id).sort();
  const selectedSorted = [...selectedChoiceIds].sort();

  const isFullyCorrect =
    JSON.stringify(correctChoiceIds) === JSON.stringify(selectedSorted);

  return isFullyCorrect ? selectedChoices[0].question.maxScore : 0;
}
