// ./lib/grade.ts
import { gradeEssayWithAI } from "./deepseek";

export async function gradeEssay(
  answer: string,
  answerKey: string,
  minScore: number,
  maxScore: number,
): Promise<number> {
  try {
    const score = await gradeEssayWithAI({ answer, answerKey, minScore, maxScore });
    return score;
  } catch {
    // fallback ke metode sederhana jika AI gagal
    if (answer.toLowerCase().includes(answerKey.toLowerCase())) {
      return (minScore + maxScore) / 2;
    }
    return 0;
  }
}

export function gradeChoice(
  selectedChoice: number,
  correctChoice: number,
): number {
  return selectedChoice === correctChoice ? 1 : 0;
}
