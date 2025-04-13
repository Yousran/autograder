// app/api/v1/participant/show/route.ts
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fungsi utilitas untuk mengacak array (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { joinCode } = body;

    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ message: "Missing token" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as {
      payload: { id: number; username: string };
    };

    const participantId = payload.id;

    // Ambil participant dan test beserta pertanyaan
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        test: {
          include: {
            questions: {
              orderBy: { id: "asc" },
              include: {
                essay: true,
                choice: {
                  include: {
                    choices: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!participant || participant.test.joinCode !== joinCode) {
      return NextResponse.json({ message: "Participant or test not found" }, { status: 404 });
    }

    const test = participant.test;

    // Ambil jawaban essay & choice peserta
    const [essayAnswers, choiceAnswers] = await Promise.all([
      prisma.essayAnswer.findMany({
        where: { participantId: participant.id },
      }),
      prisma.choiceAnswer.findMany({
        where: { participantId: participant.id },
        include: { choice: true },
      }),
    ]);

    // Normalisasi soal
    let normalizedQuestions = test.questions.map((q) => {
      if (q.essay) {
        const answer = essayAnswers.find((a) => a.questionId === q.essay!.id);
        return {
          id: q.id,
          type: "essay",
          question: q.essay.questionText,
          answerKey: q.essay.answerText,
          answer: answer?.answerText ?? "",
          score: answer?.score ?? null,
        };
      } else if (q.choice) {
        const answer = choiceAnswers.find((a) => a.questionId === q.choice!.id);
        return {
          id: q.id,
          type: "choice",
          question: q.choice.questionText,
          choices: q.choice.choices.map((c) => ({
            id: c.id,
            text: c.choiceText,
            isCorrect: c.isCorrect,
          })),
          selectedChoiceId: answer?.selectedChoiceId ?? null,
          selectedChoiceText: answer?.choice?.choiceText ?? null,
          score: answer?.score ?? null,
        };
      } else {
        throw new Error(`Question with ID ${q.id} has no valid type`);
      }
    });

    // 🔀 Jika test tidak diatur urut, acak urutan soalnya
    if (!test.isOrdered) {
      normalizedQuestions = shuffleArray(normalizedQuestions);
    }

    // Hitung total skor
    let totalScore = 0;
    let maxScore = 0;

    normalizedQuestions.forEach((q) => {
      if (q.type === "choice") {
        totalScore += q.score ?? 0;
        maxScore += 1;
      } else if (q.type === "essay") {
        totalScore += q.score ?? 0;
        maxScore += 5;
      }
    });

    // Normalisasi skor ke skala 0-100
    totalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    // Simpan total skor ke database
    await prisma.participant.update({
      where: { id: participant.id },
      data: { totalScore },
    });

    return NextResponse.json({
      testTitle: test.testTitle,
      testDuration: test.testDuration,
      joinCode: test.joinCode,
      showDetailedScore: test.showDetailedScores,
      questionCount: test.questions.length,
      participantId: participant.id,
      participantUsername: participant.username,
      participantCreatedAt: participant.createdAt,
      totalScore,
      questions: normalizedQuestions,
    });
  } catch (err) {
    console.error("Error in /participant/show:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}