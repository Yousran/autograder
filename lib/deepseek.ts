// ./lib/deepseek.ts
import OpenAI from "openai";

const apiKeys = [
  process.env.OPENROUTER_API_KEY_1,
  process.env.OPENROUTER_API_KEY_2,
  process.env.OPENROUTER_API_KEY_3,
  process.env.OPENROUTER_API_KEY_4,
  process.env.OPENROUTER_API_KEY_5,
].filter(Boolean);

export async function essayGraderDeepseek({
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
        model: "deepseek/deepseek-chat:free",
        messages: [
          {
            role: "system",
            content:
              `Kamu adalah penilai jawaban soal essay. Berikan skor dari ${minScore} hingga ${maxScore} berdasarkan seberapa relevan jawaban peserta dengan kunci jawaban. ` +
              `Skor tertinggi (${maxScore}) diberikan jika jawaban sepenuhnya sesuai dengan makna atau informasi inti dari kunci jawaban, meskipun gaya penulisan atau urutan berbeda. ` +
              `Jangan terlalu memperhatikan tanda baca atau sinonim yang tidak memengaruhi makna. kecuali jika soal yang berhubungan dengan kebahasaan` +
              `\n\nBerikan hanya angka tanpa penjelasan.`,
          },
          {
            role: "user",
            content: `Jawaban peserta: ${answer}\nKunci jawaban: ${answerKey}\n\nBeri nilai hanya berupa angka.`,
          },
        ],
      });

      const reply = res.choices[0].message.content;
      const score = parseInt(reply || "");

      if (!isNaN(score) && score >= minScore && score <= maxScore) {
        return score;
      }

      console.warn(`Key ${i + 1} returned invalid score:`, reply);
    } catch (err) {
      console.warn(`Key ${i + 1} failed:`, err);
    }
  }

  throw new Error("All API keys failed or returned invalid response.");
}
