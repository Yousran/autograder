// app/api/v1/answer/choice/update/route.ts

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { PrismaClient } from "@prisma/client";
import { gradeChoice } from "@/lib/grade";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { questionId, selectedChoiceId } = body;

        if (!questionId || selectedChoiceId === undefined) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        const token = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({ message: "Missing token" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = (await jwtVerify(token, secret)) as {
            payload: { id: number; username: string };
        };

        const participantId = payload.id;

        // Cek tipe pertanyaan
        const question = await prisma.choiceQuestion.findUnique({
            where: { id: questionId },
            include: { 
                choices: true,
                question: {
                    include: {
                      test: {
                        select: {
                          acceptResponses: true,
                        },
                      },
                    },
                  },
            },
        });

        if (!question || !question.choices) {
            return NextResponse.json(
                { message: "Question not found or not a choice question" },
                { status: 404 }
            );
        };

        if (!question.question.test.acceptResponses) {
            return NextResponse.json(
              { message: "Test doesn't accept responses" },
              { status: 403 }
            );
          }

        // Cari pilihan yang benar
        const correctChoice = question.choices.find((choice) => choice.isCorrect);
        if (!correctChoice) {
            return NextResponse.json(
                { message: "No correct choice found for this question" },
                { status: 400 }
            );
        }

        // Hitung skor
        const score = gradeChoice(selectedChoiceId, correctChoice.id);

        // Update/Create jawaban
        const existingAnswer = await prisma.choiceAnswer.findFirst({
            where: {
                questionId: question.id,
                participantId: participantId,
            },
        });

        if (existingAnswer) {
            await prisma.choiceAnswer.update({
                where: { id: existingAnswer.id },
                data: { selectedChoiceId, score },
            });
        } else {
            await prisma.choiceAnswer.create({
                data: {
                    questionId: question.id,
                    participantId: participantId,
                    selectedChoiceId,
                    score,
                },
            });
        }

        return NextResponse.json({ message: "Answer updated successfully" });
    } catch (err) {
        console.error("Error updating choice answer:", err);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}