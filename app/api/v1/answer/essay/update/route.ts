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
    handleGrading(existingAnswer.id, answerText, question.essay.answerText)
      .catch(error => console.error("Grading process failed:", error));

    return NextResponse.json({ message: "Answer updated and scored successfully" });
  } catch (err) {
    console.error("Error updating essay answer:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}