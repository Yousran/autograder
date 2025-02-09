import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { joinCode: string } }
) {
  const { joinCode } = await params;

  try {
    const test = await prisma.test.findUnique({
      where: { join_code: joinCode },
      select: { id: true },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const participantCount = await prisma.participant.count({
      where: { test_id: test.id },
    });

    return NextResponse.json({ participant_count: participantCount });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
