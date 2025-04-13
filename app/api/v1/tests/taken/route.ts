// app/api/v1/tests/taken/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ message: "Missing token" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const userId = payload.userId as number;

    const participants = await prisma.participant.findMany({
      where: { userId },
      include: {
        test: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const tests = participants.map((p) => ({
      ...p.test,
      totalScore: p.totalScore,
      participantId: p.id,
    }));

    return NextResponse.json({ tests });
  } catch (err) {
    console.error("Error fetching taken tests:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
