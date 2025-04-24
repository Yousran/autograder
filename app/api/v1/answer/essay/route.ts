import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  gradeExactEssayAnswer,
  gradeSubjectiveEssayAnswer,
} from "@/lib/essay-grader";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { answerId, participantId, answerText } = body;

    if (!answerId || !participantId || typeof answerText !== "string") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        test: true,
      },
    });

    if (participant?.test?.acceptResponses === false) {
      return NextResponse.json(
        { error: "Test is not accepting responses" },
        { status: 403 }
      );
    }

    // Ambil data untuk validasi dan grading
    const answer = await prisma.essayAnswer.findUnique({
      where: { id: answerId },
      select: {
        participantId: true,
        question: {
          select: {
            isExactAnswer: true,
            maxScore: true,
            answerText: true, // ini adalah kunci jawaban
          },
        },
      },
    });

    if (!answer || answer.participantId !== participantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { isExactAnswer, maxScore, answerText: answerKey } = answer.question;
    const minScore = 1;

    const score = isExactAnswer
      ? gradeExactEssayAnswer({
          answer: answerText,
          answerKey,
          minScore,
          maxScore,
        })
      : await gradeSubjectiveEssayAnswer({
          answer: answerText,
          answerKey,
          minScore,
          maxScore,
        });

    const updated = await prisma.essayAnswer.update({
      where: { id: answerId },
      data: {
        answerText,
        score,
      },
    });

    return NextResponse.json({ success: true, answer: updated });
  } catch (error) {
    console.error("Error updating essay answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
