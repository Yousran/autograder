// file: /app/api/v1/user/tests/created/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken, getUserFromToken } from "@/lib/auth-server";

export async function GET(req: Request) {
  // Authenticate the user
  const token = await getToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Authorize the user
  const userLoggedIn = await getUserFromToken(token);
  if (!userLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 404 });
  }

  try {
    // Fetch all tests created by the logged-in user
    const tests = await prisma.test.findMany({
      where: { creatorId: userLoggedIn.userId },
      orderBy: { createdAt: "desc" }, // Order by creation date (newest first)
    });

    return NextResponse.json(tests);
  } catch (error) {
    console.error("Error fetching created tests:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
