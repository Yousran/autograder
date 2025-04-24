import { NextRequest, NextResponse } from "next/server";
import { getToken, getUserFromToken } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const BodySchema = z.object({
  key: z.enum([
    "title",
    "description",
    "testDuration",
    "startTime",
    "endTime",
    "acceptResponses",
    "showDetailedScore",
    "showCorrectAnswers",
    "isOrdered",
  ]),
  value: z.unknown(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: { joinCode: string } }
) {
  const { joinCode } = context.params;
  const user = await getUserFromToken(getToken(req));
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid request body" },
      { status: 400 }
    );
  }

  const { key, value } = parsed.data;

  // Cari test yang dimiliki user
  const test = await prisma.test.findUnique({
    where: { joinCode },
  });

  if (!test || test.creatorId !== user.userId) {
    return NextResponse.json(
      { message: "Test not found or not yours" },
      { status: 404 }
    );
  }

  try {
    const updatedTest = await prisma.test.update({
      where: { joinCode },
      data: {
        [key]: value,
      },
    });

    return NextResponse.json({ message: "Test updated", test: updatedTest });
  } catch (err) {
    console.error("Failed to update test:", err);
    return NextResponse.json(
      { message: "Failed to update test" },
      { status: 500 }
    );
  }
}
