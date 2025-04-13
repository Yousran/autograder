// app/api/v1/test/update/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: Request) {
  const body = await req.json();
  const { joinCode, acceptResponses, showDetailedScore, isOrdered } = body;

  if (!joinCode) {
    return NextResponse.json({ message: "Missing joinCode" }, { status: 400 });
  }

  const test = await prisma.test.findUnique({ where: { joinCode } });

  if (!test) {
    return NextResponse.json({ message: "Test not found" }, { status: 404 });
  }
  // TODO: edit tidak bisa diakses jika bukan creator
  const updated = await prisma.test.update({
    where: { joinCode },
    data: {
      ...(acceptResponses !== undefined && { acceptResponses }),
      ...(showDetailedScore !== undefined && { showDetailedScores: showDetailedScore }),
      ...(isOrdered !== undefined && { isOrdered }),
    },
  });

  return NextResponse.json({ message: "Test updated", data: updated });
}
