// file: /app/api/v1/test/result/[participantId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { participantId: string } }
) {
  const { participantId } = await params;

  try {
    // Ambil data participant berdasarkan participantId
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      select: {
        username: true,
        score: true,
        testId: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Ambil data test berdasarkan testId yang dimiliki oleh participant
    const test = await prisma.test.findUnique({
      where: { id: participant.testId },
      select: { title: true },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Kirimkan response dengan data participant dan test title
    return NextResponse.json({
      participant,
      test,
    });
  } catch (error) {
    console.error("Error fetching participant:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
