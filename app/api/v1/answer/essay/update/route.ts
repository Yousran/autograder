// app/api/v1/answer/essay/update/route.ts
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { PrismaClient } from "@prisma/client";
import { gradeEssay } from "@/lib/grade";

const prisma = new PrismaClient();

async function handleGrading(existingAnswerId: number, answerText: string, modelAnswer: string) {
  try {
    const score = await gradeEssay(answerText, modelAnswer, 0, 5);
    console.log("Calculated score:", score);

    if (!isNaN(score)) {
      await prisma.essayAnswer.update({
        where: { id: existingAnswerId },
        data: { score },
      });
    }
  } catch (error) {
    console.error("Error in background grading:", error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { questionId, answerText } = body;

    if (!questionId || answerText === undefined) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ message: "Missing token" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = (await jwtVerify(token, secret)) as {
      payload: { id: number; username: string };
    };

    const participantId = payload.id;

    // Cek tipe pertanyaan
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { 
        essay: true,
        test: {
          select: {
            acceptResponses: true,
          },
        },
      },
    });

    if (!question || !question.essay) {
      return NextResponse.json(
        { message: "Question not found or not an essay question" },
        { status: 404 }
      );
    }

    if (!question.test.acceptResponses) {
      return NextResponse.json(
        { message: "Test doesn't accept responses" },
        { status: 403 }
      );
    }

    // Check if the answer already exists
    let existingAnswer = await prisma.essayAnswer.findFirst({
      where: {
        questionId: question.essay.id,
        participantId: participantId,
      },
    });

    // Save the answer if not existing
    if (existingAnswer) {
      await prisma.essayAnswer.update({
        where: { id: existingAnswer.id },
        data: { answerText },
      });
    } else {
      existingAnswer = await prisma.essayAnswer.create({
        data: {
          questionId: question.essay.id,
          participantId: participantId,
          answerText,
        },
      });
    }

    // Grading and updating the score after saving the answer
    await handleGrading(existingAnswer.id, answerText, question.essay.answerText)
      .catch(error => console.error("Grading process failed:", error));

    // Ambil jawaban essay & choice peserta
    const [essayAnswers, choiceAnswers] = await Promise.all([
      prisma.essayAnswer.findMany({
        where: { participantId },
      }),
      prisma.choiceAnswer.findMany({
        where: { participantId },
        include: { choice: true },
      }),
    ]);

    // Hitung total skor
    let totalScore = 0;
    let maxScore = 0;

    // Skor dari essay
    for (const answer of essayAnswers) {
      if (answer.score !== null && answer.score !== undefined) {
        totalScore += answer.score;
        maxScore += 5; // anggap skor maksimal essay = 100 per soal (atau sesuaikan)
      }
    }

    // Skor dari pilihan ganda
    for (const answer of choiceAnswers) {
      if (answer.score !== null && answer.score !== undefined) {
        totalScore += answer.score;
        maxScore += 1; // anggap skor maksimal choice = 100 per soal (atau sesuaikan)
      }
    }

    // Normalisasi skor ke skala 0-100
    const finalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    // Simpan total skor ke database
    await prisma.participant.update({
      where: { id: participantId },
      data: { totalScore: finalScore },
    });
    return NextResponse.json({ message: "Answer updated and scored successfully" });
  } catch (err) {
    console.error("Error updating essay answer:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}