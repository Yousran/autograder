import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/middleware/auth";

export async function POST(req: Request) {
  try {
    // Validasi token JWT
    const user = authenticate(req);
    if (!user) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }
    if (typeof user === "string") {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 }
      );
    }
    if (!("id" in user)) {
      return NextResponse.json(
        { error: "User id not found in token" },
        { status: 401 }
      );
    }

    // Ambil data dari body request
    const {
      test_title,
      test_duration,
      accept_responses,
      show_detailed_score,
      is_ordered,
      questions, // Array soal
    } = await req.json();

    if (!test_title || !test_duration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate join_code unik
    const join_code = Math.random().toString(36).substr(2, 8).toUpperCase();

    // Siapkan data nested untuk soal essay dan soal pilihan ganda
    const essayQuestionsData: { question: string; answer_key: string }[] = [];
    const choiceQuestionsData: {
      question: string;
      Choices: {
        create: { choice_text: string; is_right: boolean }[];
      };
    }[] = [];

    if (questions && Array.isArray(questions)) {
      for (const q of questions) {
        if (q.type === "essay") {
          essayQuestionsData.push({
            question: q.text,
            answer_key: q.answerKey,
          });
        } else if (q.type === "multipleChoice") {
          choiceQuestionsData.push({
            question: q.text,
            Choices: {
              create: q.choices.map((choice: string, index: number) => ({
                choice_text: choice,
                is_right: index === q.correctChoiceIndex, // Tandai jawaban benar
              })),
            },
          });
        }
      }
    }

    // Buat test beserta soal-soal terkait secara nested
    const newTest = await prisma.test.create({
      data: {
        creator_id: user.id,
        test_title,
        test_duration,
        accept_responses: accept_responses ?? false,
        show_detailed_score: show_detailed_score ?? false,
        //TODO: ganti menjadi is_ordered
        is_unordered: is_ordered ?? false,
        join_code,
        EssayQuestions: {
          create: essayQuestionsData,
        },
        ChoiceQuestions: {
          create: choiceQuestionsData,
        },
      },
      include: {
        EssayQuestions: true,
        ChoiceQuestions: {
          include: {
            Choices: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Test created successfully", test: newTest },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating test:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
