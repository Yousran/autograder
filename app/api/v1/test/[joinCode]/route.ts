//app/api/v1/test/[joinCode]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { joinCode: string } }
) {
  const { joinCode } = await params;

  try {
    const test = await prisma.test.findUnique({
      where: { join_code: joinCode },
      select: {
        test_title: true,
        test_duration: true,
        EssayQuestions: { select: { id: true } },
        ChoiceQuestions: { select: { id: true } },
      },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const totalQuestions =
      test.EssayQuestions.length + test.ChoiceQuestions.length;

    return NextResponse.json({
      test_title: test.test_title,
      test_duration: test.test_duration,
      total_questions: totalQuestions,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
