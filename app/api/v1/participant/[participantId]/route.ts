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
        multipleSelect: {
          include: {
            multipleSelectChoices: {
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
      orderBy: test.isOrdered ? { order: "asc" } : undefined,
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
        ? {
            ...q.choice,
            answer: q.choice.answers[0] || null,
            choices: q.choice.isChoiceRandomized
              ? shuffleArray(q.choice.choices)
              : q.choice.choices,
          }
        : null,
      multipleSelect: q.multipleSelect
        ? {
            ...q.multipleSelect,
            answer: q.multipleSelect.answers[0]
              ? {
                  ...q.multipleSelect.answers[0],
                  selectedChoices: q.multipleSelect.answers[0].selectedChoices,
                }
              : null,
            multipleSelectChoices: q.multipleSelect.isChoiceRandomized
              ? shuffleArray(q.multipleSelect.multipleSelectChoices)
              : q.multipleSelect.multipleSelectChoices,
          }
        : null,
    }));

    if (!test.isOrdered) {
      transformedQuestions = shuffleArray(transformedQuestions);
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
