// ./lib/llm.ts
import OpenAI from "openai";

const apiKeys = [
  process.env.OPENROUTER_API_KEY_1,
  process.env.OPENROUTER_API_KEY_2,
  process.env.OPENROUTER_API_KEY_3,
  process.env.OPENROUTER_API_KEY_4,
  process.env.OPENROUTER_API_KEY_5,
].filter(Boolean);

// 8-second timeout (leave 2s buffer before Vercel's 10s limit)
const LLM_TIMEOUT_MS = 8000;

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
  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[i];
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), LLM_TIMEOUT_MS);

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: key!,
      defaultHeaders: {
        "HTTP-Referer":
          process.env.VERCEL_ENV === "production"
            ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
            : process.env.VERCEL_BRANCH_URL
              ? `https://${process.env.VERCEL_BRANCH_URL}`
              : "",
        "X-Title": process.env.NEXT_PUBLIC_APP_NAME || "",
      },
      timeout: LLM_TIMEOUT_MS,
    });

    try {
      const res = await openai.chat.completions.create({
        model: "nvidia/nemotron-nano-12b-v2-vl:free",
        messages: [
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
        ],
      });

      clearTimeout(timeoutId);

      const reply = res.choices[0].message.content || "";

      console.log(`Key ${i + 1} response: ${reply}`);

      // More flexible regex to handle various formats
      const match = reply
        .replace(/\r/g, "")
        .match(/Score:\s*(\d+)\s*(?:Explanation:|Penjelasan:)\s*([\s\S]*)/i);

      if (match) {
        const score = parseInt(match[1], 10);
        const explanation = match[2].trim();

        console.log(
          `Key ${i + 1} returned score: ${score}, explanation: ${explanation}`,
        );

        if (!isNaN(score) && score >= minScore && score <= maxScore) {
          return { score, explanation };
        } else {
          console.warn(
            `Key ${i + 1} score out of range: ${score} (expected ${minScore}-${maxScore})`,
          );
        }
      } else {
        console.warn(`Key ${i + 1} failed to parse response: ${reply}`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`Key ${i + 1} failed (${errorMsg}):`, err);

      // If timeout, skip to next key faster
      if (errorMsg.includes("timeout") || errorMsg.includes("abort")) {
        continue;
      }
    }
  }

  throw new Error("All API keys failed or returned invalid response.");
}
