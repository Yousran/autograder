// ./lib/deepseek.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "",
    "X-Title": process.env.SITE_NAME || "",
  },
});

export async function gradeEssayWithAI({
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
            content:
              `Jawaban peserta: ${answer}\nKunci jawaban: ${answerKey}\n\nBeri nilai hanya berupa angka.`,
          },
        ],
      });
      

    const reply = res.choices[0].message.content;

    // Pastikan AI mengembalikan angka valid
    const score = parseInt(reply || "");
    if (!isNaN(score) && score >= minScore && score <= maxScore) {
      return score;
    }

    throw new Error("Invalid AI response");
  } catch (error) {
    console.error("AI grading failed:", error);
    throw error;
  }
}
