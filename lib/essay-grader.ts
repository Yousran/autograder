import { essayGraderDeepseek } from "@/lib/deepseek";
import { essayGraderDeepseekV3 } from "@/lib/deepseek-v3";
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
  answer,
  answerKey,
  minScore,
  maxScore,
}: {
  answer: string;
  answerKey: string;
  minScore: number;
  maxScore: number;
}): Promise<number> {
  try {
    return await essayGraderDeepseek({ answer, answerKey, minScore, maxScore });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid AI response") {
      console.warn(
        "Fallback to essayGraderDeepseekV3 due to invalid AI response"
      );
      try {
        return await essayGraderDeepseekV3({
          answer,
          answerKey,
          minScore,
          maxScore,
        });
      } catch (err) {
        console.error("Fallback essayGraderDeepseekV3 failed:", err);
      }
    } else {
      console.error("Unexpected error in essayGraderDeepseek:", error);
    }
  }

  // Jika semua gagal, return minScore
  return minScore;
}
