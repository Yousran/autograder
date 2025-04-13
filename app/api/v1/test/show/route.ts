// app/api/v1/test/show/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();

async function getUserFromToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const verified = await jwtVerify(token, secret);
    return verified.payload as { userId: number };
  } catch (err) {
    console.error("JWT verification error:", err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const joinCode = req.nextUrl.searchParams.get("joinCode");
  const user = await getUserFromToken(req);

  if (!joinCode) {
    return NextResponse.json({ message: "Missing joinCode" }, { status: 400 });
  }

  const test = await prisma.test.findUnique({
    where: { joinCode },
    include: {
      questions: {
        orderBy: { id: "asc" },
        include: {
          essay: true,
          choice: {
            include: {
              choices: true,
            },
          },
        },
      },
      participants: true,
    },
  });

  if (!test) {
    return NextResponse.json({ message: "Test not found" }, { status: 404 });
  }
// TODO: edit tidak bisa diakses jika bukan creator
  // If user is not the creator, return limited information
  if (!user || user.userId !== test.creatorId) {
    return NextResponse.json({
      testTitle: test.testTitle,
      testDuration: test.testDuration,
      joinCode: test.joinCode,
      acceptResponses: test.acceptResponses,
      questionCount: test.questions.length,
      participantCount: test.participants.length,
    });
  }

  // If user is the creator, return full information
  const normalizedQuestions = test.questions.map((q) => {
    if (q.essay) {
      return {
        id: q.id,
        type: "essay",
        question: q.essay.questionText,
        answerKey: q.essay.answerText,
      };
    } else if (q.choice) {
      return {
        id: q.id,
        type: "choice",
        question: q.choice.questionText,
        choices: q.choice.choices.map((c) => ({
          id: c.id,
          text: c.choiceText,
          isCorrect: c.isCorrect,
        })),
      };
    } else {
      throw new Error(`Question with ID ${q.id} has neither essay nor choice data`);
    }
  });

  return NextResponse.json({
    testTitle: test.testTitle,
    testDuration: test.testDuration,
    joinCode: test.joinCode,
    acceptResponses: test.acceptResponses,
    showDetailedScore: test.showDetailedScores,
    isOrdered: test.isOrdered,
    questionCount: test.questions.length,
    participantCount: test.participants.length,
    questions: normalizedQuestions,
  });
}
