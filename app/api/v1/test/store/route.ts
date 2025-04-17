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

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const BASE = CHARS.length;
const CODE_LENGTH = 6;
const MAX_ID = Math.pow(BASE, CODE_LENGTH) - 1; // 729,000,000 - 1

function feistelRound(value: number, roundKey: number): number {
    return ((value ^ roundKey) + 0xabcd) & 0x7fff; // Operasi sederhana dengan XOR dan penambahan
}

function feistelEncrypt30(id: number, keys: number[]): number {
    let left = (id >> 15) & 0x7fff; // 15 bit kiri
    let right = id & 0x7fff;        // 15 bit kanan
    
    for (const key of keys) {
        const temp = left ^ feistelRound(right, key);
        left = right;
        right = temp;
    }
    
    return (left << 15) | right;
}

function encodeJoinCode(id: number): string {
    if (id > MAX_ID) throw new Error("ID terlalu besar");

    const secretKey = [0x1234, 0x5678, 0x9abc];
    
    const encryptedId = feistelEncrypt30(id, secretKey);
    let code = "";
    let current = encryptedId;
    
    for (let i = 0; i < CODE_LENGTH; i++) {
        code = CHARS[current % BASE] + code;
        current = Math.floor(current / BASE);
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