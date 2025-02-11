// app/api/v1/test/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { participant_id, essayAnswers, choiceAnswers } = body;

    console.log("Submit payload:", body);

    if (!participant_id) {
      return NextResponse.json({ error: "participant_id is required" }, { status: 400 });
    }

    const participantId = Number(participant_id);
    let totalScore = 0;

    // --- Proses Jawaban Essay ---
    const essays = Array.isArray(essayAnswers) ? essayAnswers : [];
    for (const essay of essays) {
      const score = 3;
      totalScore += score;
      await prisma.essayAnswer.create({
        data: {
          participant_id: participantId,
          essay_question_id: essay.essay_question_id,
          answer: essay.answer,
          score,
        },
      });
    }

    // --- Proses Jawaban Pilihan Ganda ---
    const choices = Array.isArray(choiceAnswers) ? choiceAnswers : [];
    for (const choiceAns of choices) {
      if (!choiceAns.choice_id) continue; // Lewati jika tidak dijawab

      const choiceRecord = await prisma.choice.findUnique({
        where: { id: choiceAns.choice_id },
      });
      const score = choiceRecord?.is_right ? 1 : 0;
      totalScore += score;

      await prisma.choiceAnswer.create({
        data: {
          participant_id: participantId,
          choice_question_id: choiceAns.choice_question_id,
          choice_id: choiceAns.choice_id,
          score,
        },
      });
    }

    // --- Update Total Skor Peserta ---
    await prisma.participant.update({
      where: { id: participantId },
      data: { total_score: totalScore },
    });

    return NextResponse.json({ message: "Test submitted successfully", totalScore });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
