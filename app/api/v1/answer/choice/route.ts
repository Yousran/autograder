// file: /app/api/v1/answer/choice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gradeChoiceAnswer } from "@/lib/choice-grader";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { answerId, participantId, selectedChoiceId } = body;

    if (!answerId || !participantId || !selectedChoiceId) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Check if the answer belongs to the participant
    const answer = await prisma.choiceAnswer.findUnique({
      where: { id: answerId },
      select: { participantId: true },
    });

    if (!answer || answer.participantId !== participantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const score = await gradeChoiceAnswer(selectedChoiceId);

    // Update the answer
    const updated = await prisma.choiceAnswer.update({
      where: { id: answerId },
      data: { selectedChoiceId, score },
    });

    return NextResponse.json({ success: true, answer: updated });
  } catch (error) {
    console.error("Error updating choice answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
