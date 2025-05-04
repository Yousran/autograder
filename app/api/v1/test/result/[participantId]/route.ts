// file: /app/api/v1/test/result/[participantId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const { participantId } = await params;

  try {
    // Ambil data participant berdasarkan participantId
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      select: {
        username: true,
        score: true,
        testId: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Calculate total score from all answer types
    const essayAnswers = await prisma.essayAnswer.findMany({
      where: { participantId },
      include: {
        question: {
          select: { maxScore: true },
        },
      },
    });

    const choiceAnswers = await prisma.choiceAnswer.findMany({
      where: { participantId },
      include: {
        question: {
          select: { maxScore: true },
        },
      },
    });

    const multipleSelectAnswers = await prisma.multipleSelectAnswer.findMany({
      where: { participantId },
      include: {
        question: {
          select: { maxScore: true },
        },
      },
    });
    const totalScore =
      essayAnswers.reduce((sum, answer) => sum + answer.score, 0) +
      choiceAnswers.reduce((sum, answer) => sum + answer.score, 0) +
      multipleSelectAnswers.reduce((sum, answer) => sum + answer.score, 0);

    const maxPossibleScore =
      essayAnswers.reduce((sum, answer) => sum + answer.question.maxScore, 0) +
      choiceAnswers.reduce((sum, answer) => sum + answer.question.maxScore, 0) +
      multipleSelectAnswers.reduce(
        (sum, answer) => sum + answer.question.maxScore,
        0
      );

    const normalizedScore = (totalScore / maxPossibleScore) * 100;

    console.log("Total Score:", totalScore);
    console.log("Max Possible Score:", maxPossibleScore);
    console.log("Normalized Score (0-100):", normalizedScore);

    if (normalizedScore !== participant.score) {
      // Update participant score if it doesn't match the calculated normalized score
      await prisma.participant.update({
        where: { id: participantId },
        data: { score: normalizedScore },
      });
    }

    // Ambil data test berdasarkan testId yang dimiliki oleh participant
    const test = await prisma.test.findUnique({
      where: { id: participant.testId },
      select: { title: true },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const normalizedParticipant = {
      ...participant,
      score: normalizedScore, // Update score to normalized score
    };
    // Kirimkan response dengan data participant dan test title
    return NextResponse.json({
      participant: normalizedParticipant,
      test,
    });
  } catch (error) {
    console.error("Error fetching participant:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
