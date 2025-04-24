import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MultipleChoice } from "@/types/question";
import { gradeMultipleChoiceAnswer } from "@/lib/multiple-choice-grader";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { answerId, participantId, answers } = body;

    if (!answerId || !participantId || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Cek kepemilikan jawaban
    const existingAnswer = await prisma.multipleChoiceAnswer.findUnique({
      where: { id: answerId },
      select: { participantId: true },
    });

    if (!existingAnswer || existingAnswer.participantId !== participantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const selectedChoiceIds = answers.map(
      (choice: MultipleChoice) => choice.id
    );

    // Grading sebelum update
    const score = await gradeMultipleChoiceAnswer(selectedChoiceIds);

    // Update selected choices dan skor
    const updatedAnswer = await prisma.multipleChoiceAnswer.update({
      where: { id: answerId },
      data: {
        selectedChoices: {
          set: [], // kosongkan dulu
          connect: selectedChoiceIds.map((id) => ({ id })),
        },
        score,
      },
      include: {
        selectedChoices: true,
      },
    });

    return NextResponse.json({ success: true, answer: updatedAnswer });
  } catch (error) {
    console.error("Error updating multiple choice answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
