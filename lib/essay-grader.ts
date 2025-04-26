import { essayGraderDeepseek } from "@/lib/deepseek";
/**
 * Grading untuk soal essay dengan mode "Exact Answer"
 */
export function gradeExactEssayAnswer({
  answer,
  answerKey,
  minScore,
  maxScore,
}: {
  answer: string;
  answerKey: string;
  minScore: number;
  maxScore: number;
}): number {
  const answerWords = answer.split(/\s+/);
  const keyWords = answerKey.split(/\s+/);

  const matchingWords = answerWords.filter((word) =>
    keyWords.includes(word)
  ).length;

  const totalWords = keyWords.length;
  const score = minScore + ((maxScore - minScore) * matchingWords) / totalWords;

  return Math.round(score);
}

/**
 * Placeholder grading untuk soal essay non-exact.
 */

export async function gradeSubjectiveEssayAnswer({
  questionText,
  answer,
  answerKey,
  minScore,
  maxScore,
}: {
  questionText: string;
  answer: string;
  answerKey: string;
  minScore: number;
  maxScore: number;
}): Promise<number> {
  try {
    return await essayGraderDeepseek({
      questionText,
      answer,
      answerKey,
      minScore,
      maxScore,
    });
  } catch (error) {
    console.error("Unexpected error in essayGraderDeepseek:", error);
  }

  // Jika semua gagal, return minScore
  return minScore;
}
