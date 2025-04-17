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

const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Hindari karakter ambigu
const base = chars.length;
const secretKey = 0x5a3c; // Contoh secret key (bisa angka acak rahasia)

// Encode
export function encodeJoinCode(id: number): string {
  const obfuscated = id ^ secretKey; // XOR dengan secret key
  let code = "";
  let current = obfuscated;

  while (current > 0) {
    code = chars[current % base] + code;
    current = Math.floor(current / base);
  }

  while (code.length < 6) {
    code = chars[0] + code;
  }

  return code;
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

    const createdTest = await prisma.test.create({
      data: {
        creatorId: user.userId,
        testTitle: body.testTitle,
        testDuration: body.testDuration,
        joinCode: "",
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

    const joinCode = encodeJoinCode(createdTest.id);

    // Update test dengan joinCode
    await prisma.test.update({
      where: { id: createdTest.id },
      data: { joinCode },
    });

    const updatedTest = await prisma.test.findUnique({
      where: { id: createdTest.id },
      include: { questions: true },
    });

    return NextResponse.json({ message: "Test created successfully", test: updatedTest }, { status: 201 });
  } catch (error) {
    console.error("Error creating test:", error);
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}