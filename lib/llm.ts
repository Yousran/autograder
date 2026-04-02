// ./lib/llm.ts
import { callOpenRouter } from "./openrouter";

/**
 * Uses AI (via OpenRouter) to grade an essay answer against a key.
 * Tries multiple API keys for redundancy. Returns a score and explanation.
 * Respects the 8-second timeout to avoid Vercel's 10s limit.
 *
 * @param questionText - The original essay question
 * @param answer - The participant's written answer to grade
 * @param answerKey - The expected/model answer for comparison
 * @param minScore - The minimum score (used when answer is incorrect/irrelevant)
 * @param maxScore - The maximum score (used when answer is correct/relevant)
 * @returns Promise resolving to { score, explanation } where score is between minScore and maxScore
 * @throws Error if all API keys fail or return invalid response
 *
 * @example
 * const result = await llm({
 *   questionText: "What is 2+2?",
 *   answer: "4",
 *   answerKey: "2+2=4",
 *   minScore: 0,
 *   maxScore: 100
 * });
 * // => { score: 100, explanation: "Correct answer" }
 */
export async function llm({
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
}) {
  const reply = await callOpenRouter([
    {
      role: "system",
      content:
        `Kamu adalah penilai jawaban soal essay. Berikan skor dari ${minScore} hingga ${maxScore}. ` +
        `Jika jawaban tidak relevan, berikan skor ${minScore}. Jika relevan, berikan skor ${maxScore}. ` +
        `Respond ONLY dengan format: Score: [angka]\nExplanation: [penjelasan]. Jangan gunakan simbol atau formatting lain.`,
    },
    {
      role: "user",
      content: `Pertanyaannya adalah : ${questionText}\n
      Kunci jawabannya adalah : ${answerKey}\n
      Jawaban peserta adalah : ${answer}`,
    },
  ]);

  // More flexible regex to handle various formats
  const match = reply
    .replace(/\r/g, "")
    .match(/Score:\s*(\d+)\s*(?:Explanation:|Penjelasan:)\s*([\s\S]*)/i);

  if (match) {
    const score = parseInt(match[1], 10);
    const explanation = match[2].trim();

    console.log(`LLM returned score: ${score}, explanation: ${explanation}`);

    if (!isNaN(score) && score >= minScore && score <= maxScore) {
      return { score, explanation };
    } else {
      throw new Error(
        `LLM score out of range: ${score} (expected ${minScore}-${maxScore})`,
      );
    }
  } else {
    throw new Error(`LLM failed to parse response: ${reply}`);
  }
}
