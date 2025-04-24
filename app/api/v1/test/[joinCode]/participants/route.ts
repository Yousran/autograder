// file: app/api/v1/test/[joinCode]/participants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken, getUserFromToken } from "@/lib/auth-server";

export async function GET(
  req: Request,
  context: { params: { joinCode: string } }
) {
  const { joinCode } = context.params;

  const user = await getUserFromToken(getToken(req));
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find the test by joinCode
    const test = await prisma.test.findUnique({
      where: { joinCode },
      include: {
        participants: true, // Include participants in the response
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

    // Return the participants
    return NextResponse.json(test.participants);
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
