import { prisma } from "@/lib/prisma";
import { devLog } from "@/utils/devLog";

/**
 * Hitung skor untuk soal multiple Select:
 * +1 untuk setiap pilihan benar yang dipilih,
 * -0.5 untuk setiap pilihan salah yang dipilih,
 * lalu dinormalisasi ke maxScore dan dibulatkan ke bilangan bulat positif.
 */
export async function gradeMultipleSelectAnswer(
  selectedChoiceIds: string[]
): Promise<number> {
  devLog("=== Mulai gradeMultipleSelectAnswer ===");
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

  // Hitung rawScore
  let rawScore = 0;
  for (const selectedId of selectedChoiceIds) {
    if (correctChoiceIds.includes(selectedId)) {
      rawScore += 1; // Pilihan benar
      devLog(
        `Pilihan ${selectedId} BENAR (+1), rawScore sekarang = ${rawScore}`
      );
    } else {
      rawScore -= 0.5; // Pilihan salah
      devLog(
        `Pilihan ${selectedId} SALAH (-0.5), rawScore sekarang = ${rawScore}`
      );
    }
  }

  const maxRawScore = allChoiceIds.length;

  devLog("Max Raw Score (jumlah pilihan benar):", maxRawScore);

  if (maxRawScore === 0) {
    devLog("Tidak ada pilihan benar. Skor = 0");
    return 0;
  }

  // Normalisasi
  let normalizedScore = (rawScore / maxRawScore) * maxScore;
  devLog("Skor setelah normalisasi (sebelum dibulatkan):", normalizedScore);

  normalizedScore = Math.max(0, normalizedScore);
  devLog("Skor setelah dicek minimal 0:", normalizedScore);

  const finalScore = Math.round(normalizedScore);

  devLog("Final Score setelah dibulatkan:", finalScore);
  devLog("=== Selesai gradeMultipleSelectAnswer ===");

  return finalScore;
}
