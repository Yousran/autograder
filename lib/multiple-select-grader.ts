import { prisma } from "@/lib/prisma";
import { devLog } from "@/utils/devLog";

/**
 * Hitung skor untuk soal multiple Select dengan metode right minus wrong:
 * Setiap pilihan (benar/salah) bernilai maxScore / jumlah pilihan.
 * Skor = (jumlah benar dipilih * poinPerPilihan) + (jumlah salah dipilih * -poinPerPilihan)
 * Skor minimal 0 (tidak bisa negatif).
 */
export async function gradeMultipleSelectAnswer(
  selectedChoiceIds: string[]
): Promise<number> {
  devLog("=== Mulai gradeMultipleSelectAnswer (right minus wrong) ===");
  devLog("Pilihan yang dipilih:", selectedChoiceIds);

  if (selectedChoiceIds.length === 0) {
    devLog("Tidak ada pilihan yang dipilih. Skor = 0");
    return 0;
  }

  // Ambil data semua pilihan yang dipilih, termasuk info soal dan skor maksimal
  const selectedChoices = await prisma.multipleSelectChoice.findMany({
    where: {
      id: { in: selectedChoiceIds },
    },
    include: {
      question: {
        select: {
          id: true,
          maxScore: true,
        },
      },
    },
  });

  devLog("Pilihan yang ditemukan di database:", selectedChoices);

  if (selectedChoices.length === 0) {
    throw new Error("Invalid selected choice IDs");
  }

  const questionId = selectedChoices[0].question.id;
  const maxScore = selectedChoices[0].question.maxScore;

  devLog("Question ID:", questionId);
  devLog("Max Score untuk soal ini:", maxScore);

  // Ambil semua pilihan yang tersedia untuk soal ini
  const allChoices = await prisma.multipleSelectChoice.findMany({
    where: {
      questionId,
    },
  });

  devLog("Semua pilihan untuk soal ini:", allChoices);

  if (allChoices.length === 0) {
    throw new Error("No choices found for the question");
  }

  const correctChoiceIds = allChoices
    .filter((choice) => choice.isCorrect)
    .map((choice) => choice.id);

  const allChoiceIds = allChoices.map((choice) => choice.id);

  devLog("Pilihan yang benar (ID):", correctChoiceIds);

  // Validasi pilihan dipilih harus bagian dari soal ini
  for (const selectedId of selectedChoiceIds) {
    if (!allChoiceIds.includes(selectedId)) {
      throw new Error(
        `Selected choice ID ${selectedId} does not belong to the question`
      );
    }
  }

  // Right minus wrong grading
  const pointPerChoice = maxScore / allChoices.length;
  let numCorrectSelected = 0;
  let numIncorrectSelected = 0;

  for (const selectedId of selectedChoiceIds) {
    if (correctChoiceIds.includes(selectedId)) {
      numCorrectSelected++;
      devLog(`Pilihan ${selectedId} BENAR (+${pointPerChoice})`);
    } else {
      numIncorrectSelected++;
      devLog(`Pilihan ${selectedId} SALAH (-${pointPerChoice})`);
    }
  }

  let score =
    numCorrectSelected * pointPerChoice - numIncorrectSelected * pointPerChoice;
  devLog("Skor sebelum dibatasi minimal 0:", score);

  score = Math.max(0, score);
  devLog("Final Score setelah dibatasi minimal 0:", score);
  devLog("=== Selesai gradeMultipleSelectAnswer (right minus wrong) ===");

  return Math.round(score);
}
