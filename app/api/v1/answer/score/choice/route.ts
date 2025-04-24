// file: /api/v1/answer/score/choice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { answerId, score } = body;

    if (!answerId || typeof score !== "number") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Update score for choice answer
    const updatedAnswer = await prisma.choiceAnswer.update({
      where: { id: answerId },
      data: {
        score,
      },
    });

    return NextResponse.json({ success: true, answer: updatedAnswer });
  } catch (error) {
    console.error("Error updating choice answer score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
