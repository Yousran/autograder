// file /api/v1/test/[joinCode]/accept-responses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: { joinCode: string } }
) {
  const { joinCode } = context.params;

  try {
    const test = await prisma.test.findUnique({
      where: { joinCode },
      select: {
        acceptResponses: true,
        participants: {
          select: {
            id: true,
          },
        },
        questions: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const participantCount = test.participants.length;
    const questionCount = test.questions.length;

    return NextResponse.json({
      acceptResponses: test.acceptResponses,
      participantCount,
      questionCount,
    });
  } catch (error) {
    console.error("Error fetching test data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
