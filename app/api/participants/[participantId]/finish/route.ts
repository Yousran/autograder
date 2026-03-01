import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/participants/[participantId]/finish
 * Marks a participant as completed (isCompleted = true).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ participantId: string }> },
) {
  const { participantId } = await params;

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { id: true, isCompleted: true },
  });

  if (!participant) {
    return NextResponse.json(
      { error: "Participant not found." },
      { status: 404 },
    );
  }

  if (participant.isCompleted) {
    return NextResponse.json({ success: true });
  }

  await prisma.participant.update({
    where: { id: participantId },
    data: { isCompleted: true },
  });

  return NextResponse.json({ success: true });
}
