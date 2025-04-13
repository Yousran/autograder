// app/api/v1/tests/created/route.ts
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

    const tests = await prisma.test.findMany({
      where: { creatorId: userId },
      include: {
        _count: {
          select: {
            participants: true,
            questions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tests });
  } catch (err) {
    console.error("Error fetching created tests:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
