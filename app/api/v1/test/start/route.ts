// app/api/v1/test/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Fungsi untuk mengacak array menggunakan algoritma Fisher-Yates
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const testId = searchParams.get("testId");

  if (!testId) {
    return NextResponse.json({ error: "Missing testId" }, { status: 400 });
  }

  try {
    const test = await prisma.test.findUnique({
      where: { id: Number(testId) },
      select: {
        test_title: true,
        test_duration: true,
        is_ordered: true,
        EssayQuestions: {
          select: {
            id: true,
            question: true,
          },
          orderBy: { id: 'asc' } 
        },
        ChoiceQuestions: {
          select: {
            id: true,
            question: true,
            Choices: {
              select: {
                id: true,
                choice_text: true,
              },
              orderBy: { id: 'asc' }
            }
          },
          orderBy: { id: 'asc' }
        },
      }
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Gabungkan soal essay dan choice ke dalam satu array
    let questions = [
      ...test.EssayQuestions.map(q => ({ ...q, type: "essay" })),
      ...test.ChoiceQuestions.map(q => ({ ...q, type: "choice" }))
    ];

    // Acak soal jika test tidak harus diurutkan
    if (!test.is_ordered) {
      questions = shuffleArray(questions);
    }

    return NextResponse.json({
      test: {
        test_title: test.test_title,
        test_duration: test.test_duration,
        questions,
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
