// file: app/api/v1/test/[joinCode]/participants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ joinCode: string }> }
) {
  const { joinCode } = await params;

  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find the test by joinCode
    const test = await prisma.test.findUnique({
      where: { joinCode },
      include: {
        participants: true,
      },
    });

    const sortedParticipants = test?.participants.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score; // skor tertinggi dulu
      }

      const aDuration =
        new Date(a.updatedAt).getTime() - new Date(a.createdAt).getTime();
      const bDuration =
        new Date(b.updatedAt).getTime() - new Date(b.createdAt).getTime();
      return aDuration - bDuration; // waktu tercepat dulu
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (test.creatorId !== user.id) {
      return NextResponse.json(
        { error: "You are not authorized to view this test" },
        { status: 403 }
      );
    }

    // Return the participants
    return NextResponse.json(sortedParticipants);
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
