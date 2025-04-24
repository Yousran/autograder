// file: /app/api/v1/participant/[participantId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shuffleArray } from "@/lib/shuffle";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const { participantId } = await params;

  try {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
    });
    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    const test = await prisma.test.findUnique({
      where: { id: participant.testId },
    });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const questions = await prisma.question.findMany({
      where: { testId: test.id },
      include: {
        essay: {
          include: {
            answers: {
              take: 1,
              where: {
                participantId: participant.id,
              },
            },
          },
        },
        choice: {
          include: {
            choices: {
              select: {
                id: true,
                choiceText: true,
              },
              orderBy: { createdAt: "asc" },
            },
            answers: {
              take: 1,
              where: {
                participantId: participant.id,
              },
            },
          },
        },
        multipleChoice: {
          include: {
            multipleChoices: {
              select: {
                id: true,
                choiceText: true,
              },
              orderBy: { createdAt: "asc" },
            },
            answers: {
              where: {
                participantId: participant.id,
              },
              include: {
                selectedChoices: {
                  select: {
                    id: true,
                    choiceText: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!questions) {
      return NextResponse.json(
        { error: "Questions not found" },
        { status: 404 }
      );
    }

    let transformedQuestions = questions.map((q) => ({
      ...q,
      essay: q.essay
        ? { ...q.essay, answer: q.essay.answers[0] || null }
        : null,
      choice: q.choice
        ? { ...q.choice, answer: q.choice.answers[0] || null }
        : null,
      multipleChoice: q.multipleChoice
        ? {
            ...q.multipleChoice,
            answer: q.multipleChoice.answers[0]
              ? {
                  ...q.multipleChoice.answers[0],
                  selectedChoices: q.multipleChoice.answers[0].selectedChoices,
                }
              : null,
          }
        : null,
    }));

    if (!test.isOrdered) {
      transformedQuestions = shuffleArray(transformedQuestions); // Fungsi untuk mengacak array
    }

    return NextResponse.json({
      participant,
      test,
      questions: transformedQuestions,
    });
  } catch (error) {
    console.error("Error fetching participant:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
