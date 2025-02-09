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
      select: { accept_responses: true },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    return NextResponse.json({ accept_responses: test.accept_responses });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
