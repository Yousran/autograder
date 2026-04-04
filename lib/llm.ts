// ./lib/llm.ts
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { EssayGradingModel } from "./generated/prisma/browser";
import { callOpenRouter } from "./openrouter";
import * as Iron from "iron-webcrypto";

/**
 * Uses AI (via Vercel AI SDK) to grade an essay answer against a key.
 * Uses custom essay grading model if provided, otherwise falls back to OpenRouter.
 * Returns a score and explanation. Respects the 8-second timeout to avoid Vercel's 10s limit.
 *
 * @param questionText - The original essay question
 * @param answer - The participant's written answer to grade
 * @param answerKey - The expected/model answer for comparison
 * @param minScore - The minimum score (used when answer is incorrect/irrelevant)
 * @param maxScore - The maximum score (used when answer is correct/relevant)
 * @param essayGradingModel - Optional custom essay grading model configuration
 * @returns Promise resolving to { score, explanation } where score is between minScore and maxScore
 * @throws Error if all API keys fail or return invalid response
 *
 * @example
 * const result = await llm({
 *   questionText: "What is 2+2?",
 *   answer: "4",
 *   answerKey: "2+2=4",
 *   minScore: 0,
 *   maxScore: 100,
 *   essayGradingModel: customModel // Optional custom model
 * });
 * // => { score: 100, explanation: "Correct answer" }
 */
export async function llm({
  questionText,
  answer,
  answerKey,
  minScore,
  maxScore,
  essayGradingModel,
}: {
  questionText: string;
  answer: string;
  answerKey: string;
  minScore: number;
  maxScore: number;
  essayGradingModel?: EssayGradingModel;
}) {
  try {
    // Use custom model if provided, otherwise fall back to OpenRouter
    if (essayGradingModel) {
      const reply = await generateTextWithCustomModel({
        essayGradingModel,
        questionText,
        answer,
        answerKey,
        minScore,
        maxScore,
      });
      console.log("Custom LLM grading response");
      return parseGradingResponse(reply, minScore, maxScore);
    } else {
      // Fallback to OpenRouter
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
      console.log("OpenRouter grading response");
      return parseGradingResponse(reply, minScore, maxScore);
    }
  } catch (error) {
    console.error("Error in llm grading:", error);
    throw error;
  }
}

/**
 * Helper function to generate text using custom essay grading model via Vercel AI SDK
 */
async function generateTextWithCustomModel({
  essayGradingModel,
  questionText,
  answer,
  answerKey,
  minScore,
  maxScore,
}: {
  essayGradingModel: EssayGradingModel;
  questionText: string;
  answer: string;
  answerKey: string;
  minScore: number;
  maxScore: number;
}): Promise<string> {
  // Decrypt the API key if it exists
  let decryptedApiKey = null;
  if (essayGradingModel.apiKey) {
    decryptedApiKey = (await Iron.unseal(
      essayGradingModel.apiKey,
      process.env.BETTER_AUTH_SECRET!,
      Iron.defaults,
    )) as string;
  }

  // Create OpenAI-compatible provider instance with custom configuration
  const openaiProvider = createOpenAI({
    apiKey: decryptedApiKey || undefined,
    baseURL: essayGradingModel.baseUrl,
  });

  // Create model instance
  const model = openaiProvider(essayGradingModel.model);

  const reply = await generateText({
    model,
    system:
      `Kamu adalah penilai jawaban soal essay. Berikan skor dari ${minScore} hingga ${maxScore}. ` +
      `Jika jawaban tidak relevan, berikan skor ${minScore}. Jika relevan, berikan skor ${maxScore}. ` +
      `Respond ONLY dengan format: Score: [angka]\nExplanation: [penjelasan]. Jangan gunakan simbol atau formatting lain.`,
    prompt: `Pertanyaannya adalah : ${questionText}\n
      Kunci jawabannya adalah : ${answerKey}\n
      Jawaban peserta adalah : ${answer}`,
  });

  return reply.text;
}

/**
 * Helper function to parse and validate grading response
 */
function parseGradingResponse(
  reply: string,
  minScore: number,
  maxScore: number,
): { score: number; explanation: string } {
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
