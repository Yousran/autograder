// file: app/api/v1/test/[joinCode]/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ joinCode: string }> }
) {
  try {
    const { joinCode } = await params;
    const { userId, username } = await req.json();

    if (!username) {
      return NextResponse.json(
        { message: "username are required" },
        { status: 400 }
      );
    }

    // Find the test by joinCode
    const test = await prisma.test.findUnique({
      where: { joinCode: String(joinCode) },
    });

    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    // Check if the test is accepting responses
    if (!test.acceptResponses) {
      return NextResponse.json(
        { message: "Test is not accepting responses" },
        { status: 403 }
      );
    }

    // Check if the participant already exists
    const existingParticipant = await prisma.participant.findFirst({
      where: {
        testId: test.id,
        userId,
        username,
      },
    });

    if (existingParticipant) {
      return NextResponse.json(
        { message: "You have already joined this test" },
        { status: 409 }
      );
    }

    // Create a new participant
    const participantPromise = prisma.participant.create({
      data: {
        testId: test.id,
        userId: userId || null,
        username,
      },
    });

    const questionsPromise = prisma.question.findMany({
      where: { testId: test.id },
      include: {
        essay: true,
        choice: true,
        multipleSelect: true,
      },
    });

    const [participant, questions] = await Promise.all([
      participantPromise,
      questionsPromise,
    ]);

    const essayAnswers = questions
      .filter((q) => q.essay !== null)
      .map((q) => ({
        participantId: participant.id,
        questionId: q.essay!.id,
        answerText: "",
      }));

    const choiceAnswers = questions
      .filter((q) => q.choice !== null)
      .map((q) => ({
        participantId: participant.id,
        questionId: q.choice!.id,
        selectedChoiceId: null,
      }));

    const multipleSelectAnswers = questions
      .filter((q) => q.multipleSelect !== null)
      .map((q) => ({
        participantId: participant.id,
        questionId: q.multipleSelect!.id,
      }));

    const createEssayAnswersPromise =
      essayAnswers.length > 0
        ? prisma.essayAnswer.createMany({ data: essayAnswers })
        : Promise.resolve();

    const createChoiceAnswersPromise =
      choiceAnswers.length > 0
        ? prisma.choiceAnswer.createMany({ data: choiceAnswers })
        : Promise.resolve();

    const createMultipleSelectAnswersPromise =
      multipleSelectAnswers.length > 0
        ? prisma.multipleSelectAnswer.createMany({
            data: multipleSelectAnswers,
          })
        : Promise.resolve();

    await Promise.all([
      createEssayAnswersPromise,
      createChoiceAnswersPromise,
      createMultipleSelectAnswersPromise,
    ]);

    return NextResponse.json(
      {
        participantId: participant.id,
        message: "Test started successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error starting test:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
