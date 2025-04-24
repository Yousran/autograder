// file: /app/api/v1/answer/essay/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Check if the answer belongs to the participant
    const answer = await prisma.essayAnswer.findUnique({
      where: { id: answerId },
      select: { participantId: true },
    });

    if (!answer || answer.participantId !== participantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update the answer
    const updated = await prisma.essayAnswer.update({
      where: { id: answerId },
      data: { answerText },
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
