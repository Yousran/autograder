// file: /api/v1/participant/creator/[participantId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const { participantId } = await params;

  try {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        user: true,
        test: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    const test = await prisma.test.findUnique({
      where: { id: participant.testId },
      include: {
        user: true,
        questions: {
          orderBy: { order: "asc" },
          include: {
            essay: {
              include: {
                answers: {
                  where: { participantId: participant.id },
                },
              },
            },
            choice: {
              include: {
                choices: true,
                answers: {
                  where: { participantId: participant.id },
                },
              },
            },
            multipleSelect: {
              include: {
                multipleSelectChoices: true,
                answers: {
                  where: { participantId: participant.id },
                  include: {
                    selectedChoices: true,
                  },
                },
              },
            },
          },
        },
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Calculate total score and normalized score
    const essayAnswers = test.questions
      .filter((q) => q.essay)
      .flatMap((q) => q.essay?.answers);

    const choiceAnswers = test.questions
      .filter((q) => q.choice)
      .flatMap((q) => q.choice?.answers);

    const multipleSelectAnswers = test.questions
      .filter((q) => q.multipleSelect)
      .flatMap((q) => q.multipleSelect?.answers);

    const totalScore =
      essayAnswers.reduce((sum, answer) => sum + (answer?.score || 0), 0) +
      choiceAnswers.reduce((sum, answer) => sum + (answer?.score || 0), 0) +
      multipleSelectAnswers.reduce(
        (sum, answer) => sum + (answer?.score || 0),
        0
      );

    const maxPossibleScore =
      test.questions
        .filter((q) => q.essay)
        .reduce((sum, q) => sum + (q.essay?.maxScore || 0), 0) +
      test.questions
        .filter((q) => q.choice)
        .reduce((sum, q) => sum + (q.choice?.maxScore || 0), 0) +
      test.questions
        .filter((q) => q.multipleSelect)
        .reduce((sum, q) => sum + (q.multipleSelect?.maxScore || 0), 0);

    const normalizedScore = maxPossibleScore
      ? (totalScore / maxPossibleScore) * 100
      : 0;

    // Update participant score if necessary
    if (normalizedScore !== participant.score) {
      await prisma.participant.update({
        where: { id: participantId },
        data: { score: normalizedScore },
      });
    }

    const transformedQuestions = test.questions.map((q) => {
      const type = q.type;
      let maxScore = 0;

      if (q.essay) maxScore = q.essay.maxScore;
      if (q.choice) maxScore = q.choice.maxScore;
      if (q.multipleSelect) maxScore = q.multipleSelect.maxScore;

      return {
        id: q.id,
        questionText: q.questionText,
        type: type,
        order: q.order,
        maxScore: maxScore,

        essay: q.essay
          ? { ...q.essay, participantAnswer: q.essay.answers[0] || null }
          : null,
        choice: q.choice
          ? { ...q.choice, participantAnswer: q.choice.answers[0] || null }
          : null,
        multipleSelect: q.multipleSelect
          ? {
              ...q.multipleSelect,
              participantAnswer: q.multipleSelect.answers[0]
                ? {
                    ...q.multipleSelect.answers[0],
                    selectedChoices:
                      q.multipleSelect.answers[0].selectedChoices || [],
                  }
                : null,
            }
          : null,
      };
    });

    return NextResponse.json({
      participant: { ...participant, score: normalizedScore },
      test,
      questions: transformedQuestions,
    });
  } catch (error) {
    console.error("Error fetching participant data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
