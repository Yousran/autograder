// file: /api/v1/user/tests/taken/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  // Authenticate the user
  const userLoggedIn = await getCurrentUser(req);
  console.log("[Tests Taken] User:", userLoggedIn?.id, userLoggedIn?.email);
  if (!userLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all tests taken by the logged-in user through the Participant table
    const testsTaken = await prisma.participant.findMany({
      where: { userId: userLoggedIn.id },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            description: true,
            startTime: true,
            endTime: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" }, // Order by participation date (newest first)
    });

    // Map the results to include only the test details
    const formattedTests = testsTaken.map((participant) => ({
      ...participant.test,
      participantId: participant.id,
      score: participant.score,
    }));

    return NextResponse.json(formattedTests);
  } catch (error) {
    console.error("Error fetching taken tests:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
