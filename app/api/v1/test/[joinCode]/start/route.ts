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

export async function GET(
    req: NextRequest,
    { params }: { params: { joinCode: string } }
) {
    const { joinCode } = params;

    try {
        const test = await prisma.test.findUnique({
            where: { join_code: joinCode },
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
            return NextResponse.json({ error: "Test tidak ditemukan" }, { status: 404 });
        }

        // Gabungkan pertanyaan ke dalam satu array
        let questions = [
            ...test.EssayQuestions.map(q => ({ ...q, type: "essay" })),
            ...test.ChoiceQuestions.map(q => ({ ...q, type: "choice" }))
        ];

        // Acak urutan pertanyaan jika test tidak diurutkan
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
        return NextResponse.json(
            { error: "Kesalahan server internal" },
            { status: 500 }
        );
    }
}
