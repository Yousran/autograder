// file: /app/api/v1/user/tests/created/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  // Authenticate the user
  const userLoggedIn = await getCurrentUser(req);
  console.log("[Tests Created] User:", userLoggedIn?.id, userLoggedIn?.email);
  if (!userLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all tests created by the logged-in user
    const tests = await prisma.test.findMany({
      where: { creatorId: userLoggedIn.id },
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
