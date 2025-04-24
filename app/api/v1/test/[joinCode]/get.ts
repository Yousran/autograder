// file: /app/api/v1/test/[joinCode]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { getToken, getUserFromToken } from "@/lib/auth-server";

export async function GET(
  req: Request,
  { params }: { params: { joinCode: string } }
) {
  const { joinCode } = params;

  // Authenticate the user
  // const token = await getToken(req);
  // if (!token) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  // Authorize the user
  // const userLoggedIn = await getUserFromToken(token);
  // if (!userLoggedIn) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 404 });
  // }

  try {
    // Fetch the test by joinCode
    const test = await prisma.test.findUnique({
      where: { joinCode },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // if (test.creatorId !== userLoggedIn.userId) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    return NextResponse.json(test);
  } catch (error) {
    console.error("Error fetching test:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
