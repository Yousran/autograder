//app/api/v1/show-created-test/[joinCode]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { joinCode: string } }) {
  try {
    const { joinCode } = params;
    if (!joinCode) {
      return NextResponse.json({ error: "Missing join code" }, { status: 400 });
    }

    const test = await prisma.test.findUnique({
      where: { join_code: joinCode },
      include: {
        EssayQuestions: true,
        ChoiceQuestions: {
          include: { Choices: true },
        },
        Participants: true,
      },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Test retrieved successfully", test }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving test:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}