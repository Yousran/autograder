// file: app/api/v1/test/[joinCode]/questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken, getUserFromToken } from "@/lib/auth-server";

export async function GET(
  req: NextRequest,
  context: { params: { joinCode: string } }
) {
  const { joinCode } = context.params;

  const user = await getUserFromToken(getToken(req));
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const test = await prisma.test.findUnique({
      where: { joinCode },
      include: {
        questions: {
          include: {
            essay: true,
            choice: {
              include: {
                choices: true,
              },
            },
            multipleChoice: {
              include: {
                multipleChoices: true,
              },
            },
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (test.creatorId !== user.userId) {
      return NextResponse.json(
        { error: "You are not authorized to view this test" },
        { status: 403 }
      );
    }

    return NextResponse.json(test.questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
