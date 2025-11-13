// ./lib/deepseek.ts
import { EssayGrade } from "@/types/essay-grade";
import { devLog } from "@/utils/devLog";
import OpenAI from "openai";

const apiKeys = [
  process.env.OPENROUTER_API_KEY_1,
  process.env.OPENROUTER_API_KEY_2,
  process.env.OPENROUTER_API_KEY_3,
  process.env.OPENROUTER_API_KEY_4,
  process.env.OPENROUTER_API_KEY_5,
].filter(Boolean);

export async function essayGraderDeepseek({
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
}): Promise<EssayGrade> {
  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[i];

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: key!,
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL || "",
        "X-Title": process.env.SITE_NAME || "",
      },
    });

    try {
      const res = await openai.chat.completions.create({
        model: "openai/gpt-oss-20b:free",
        messages: [
          {
            role: "system",
            content:
              `Kamu adalah penilai jawaban soal essay. Berikan skor dari ${minScore} hingga ${maxScore}. ` +
              `Jika jawaban tidak relevan, berikan skor ${minScore}. Jika relevan, berikan skor ${maxScore}. ` +
              `Berikan Balasan dengan format. Score: <Whole Number(score)> Explanation: <explanation>`,
          },
          {
            role: "user",
            content: `Pertanyaannya adalah : ${questionText}\n
            Kunci jawabannya adalah : ${answerKey}\n
            Jawaban peserta adalah : ${answer}`,
          },
        ],
      });

      const reply = res.choices[0].message.content || "";

      devLog(`Key ${i + 1} response: ${reply}`);

      const match = reply
        .replace(/\r/g, "")
        .match(/Score:\s*(\d+)\s*Explanation:\s*([\s\S]*)/);

      if (match) {
        const score = parseInt(match[1], 10);
        const explanation = match[2].trim();

        devLog(
          `Key ${i + 1} returned score: ${score}, explanation: ${explanation}`
        );

        if (!isNaN(score) && score >= minScore && score <= maxScore) {
          return { score, explanation };
        }
      }

      console.warn(`Key ${i + 1} returned invalid score:`, reply);
    } catch (err) {
      console.warn(`Key ${i + 1} failed:`, err);
    }
  }

  throw new Error("All API keys failed or returned invalid response.");
}
