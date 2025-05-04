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
    const start = performance.now();

    if (!answerId || !participantId || typeof answerText !== "string") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Jalankan paralel
    const [participant, answer] = await Promise.all([
      prisma.participant.findUnique({
        where: { id: participantId },
        include: { test: true },
      }),
      prisma.essayAnswer.findUnique({
        where: { id: answerId },
        select: {
          participantId: true,
          question: {
            select: {
              question: true,
              isExactAnswer: true,
              maxScore: true,
              answerText: true, // kunci jawaban
            },
          },
        },
      }),
    ]);

    if (!participant?.test?.acceptResponses) {
      return NextResponse.json(
        { error: "Test is not accepting responses" },
        { status: 403 }
      );
    }

    if (!answer || answer.participantId !== participantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { isExactAnswer, maxScore, answerText: answerKey } = answer.question;
    const minScore = 1;

    let score: number;
    let explanation: string | null = null; // Initialize explanation

    if (isExactAnswer) {
      score = gradeExactEssayAnswer({
        answer: answerText,
        answerKey,
        minScore,
        maxScore,
      });
    } else {
      const result = await gradeSubjectiveEssayAnswer({
        questionText: answer.question.question.questionText,
        answer: answerText,
        answerKey,
        minScore,
        maxScore,
      });

      score = result.score;
      explanation = result.explanation || null; // Ensure explanation is assigned
    }

    const updated = await prisma.essayAnswer.update({
      where: { id: answerId },
      data: {
        answerText,
        score,
        ...(explanation && { scoreExplanation: explanation }), // Conditionally include scoreExplanation
      },
    });

    const duration = performance.now() - start;
    console.log(`Update-essay-answer finished in ${duration.toFixed(2)}ms`);
    return NextResponse.json({ success: true, answer: updated });
  } catch (error) {
    console.error("Error updating essay answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
