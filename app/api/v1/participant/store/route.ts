// app/api/v1/participant/store/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { signJwt } from "@/lib/jwt";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { joinCode, username: guestUsername } = body;

    if (!joinCode) {
      return NextResponse.json({ message: "joinCode is required" }, { status: 400 });
    }

    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    let userId: number | null = null;
    let username = guestUsername;

    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        userId = payload.userId as number;
        username = payload.username as string;
      } catch (err) {
        console.error("Token verification failed:", err);
        return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
      }
    }

    if (!username) {
      return NextResponse.json({ message: "Username is required" }, { status: 400 });
    }

    // Cari test berdasarkan joinCode
    const test = await prisma.test.findUnique({
      where: { joinCode },
    });

    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    // Cek apakah participant sudah pernah dibuat (dengan userId atau guest username)
    const existingParticipant = await prisma.participant.findFirst({
      where: {
        testId: test.id,
        ...(userId ? { userId } : { username }),
      },
    });

    if (existingParticipant) {
      return NextResponse.json({ message: "You have already joined this test." }, { status: 400 });
    }

    // Buat participant baru
    const participant = await prisma.participant.create({
      data: {
        testId: test.id,
        userId,
        username,
      },
    });

    // Ambil semua pertanyaan dan jenisnya
    const questions = await prisma.question.findMany({
      where: { testId: test.id },
      include: {
        essay: true,
        choice: true,
      },
    });

    const essayAnswers = questions
      .filter((q) => q.essay !== null)
      .map((q) => ({
        participantId: participant.id,
        questionId: q.essay!.id,
        answerText: "",
      }));

    const choiceAnswers = questions
      .filter((q) => q.choice !== null)
      .map((q) => ({
        participantId: participant.id,
        questionId: q.choice!.id,
        selectedChoiceId: null,
      }));

    if (essayAnswers.length > 0) {
      await prisma.essayAnswer.createMany({ data: essayAnswers });
    }

    if (choiceAnswers.length > 0) {
      await prisma.choiceAnswer.createMany({ data: choiceAnswers });
    }

    return NextResponse.json({ message: "Participant and answers created", participant: signJwt(participant) });
  } catch (err) {
    console.error("Error creating participant:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}