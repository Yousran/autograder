// app/api/v1/test/store/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromToken } from "@/lib/jwt";

const prisma = new PrismaClient();

interface ChoicePayload {
  id?: number;
  text: string;
  isCorrect: boolean;
}

interface QuestionPayload {
  id?: number;
  type: "choice" | "essay";
  question: string;
  answerKey?: string;
  choices?: ChoicePayload[];
}

interface TestPayload {
  testTitle: string;
  testDuration: number;
  acceptResponses: boolean;
  showDetailedScore: boolean;
  isOrdered: boolean;
  questions: QuestionPayload[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TestPayload;

    // Ambil token dari cookies
    const token = req.headers.get("cookie")?.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];

    if (!token) {
      return NextResponse.json({ message: "Unauthorized: Token not found" }, { status: 401 });
    }

    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized: Invalid token" }, { status: 401 });
    }

    // Validasi input basic
    if (!body.testTitle || !body.testDuration || !Array.isArray(body.questions)) {
      return NextResponse.json({ message: "Invalid test data" }, { status: 400 });
    }

    // Generate unique joinCode
    const joinCode = Array.from({ length: 6 }, () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      return chars[Math.floor(Math.random() * chars.length)];
    }).join("");

    const createdTest = await prisma.test.create({
      data: {
        creatorId: user.userId,
        testTitle: body.testTitle,
        testDuration: body.testDuration,
        joinCode,
        acceptResponses: body.acceptResponses,
        showDetailedScores: body.showDetailedScore,
        isOrdered: body.isOrdered,
        questions: {
          create: body.questions.map((q) => ({
            ...(q.type === "essay" && {
              essay: {
                create: {
                  questionText: q.question,
                  answerText: q.answerKey || "",
                },
              },
            }),
            ...(q.type === "choice" && {
              choice: {
                create: {
                  questionText: q.question,
                  choices: {
                    create: q.choices?.map((c) => ({
                      choiceText: c.text,
                      isCorrect: c.isCorrect,
                    })) || [],
                  },
                },
              },
            }),
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json({ message: "Test created successfully", test: createdTest }, { status: 201 });
  } catch (error) {
    console.error("Error creating test:", error);
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}