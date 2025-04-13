// app/api/v1/participants/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Ambil token dari header Authorization
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ message: "Missing token" }, { status: 401 });
    }

    // Verifikasi token dan ambil userId
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;

    // Ambil semua test milik user
    const tests = await prisma.test.findMany({
      where: { creatorId: userId },
      select: { id: true },
    });

    const testIds = tests.map((test) => test.id);

    // Ambil semua peserta dari test milik user, termasuk user info dan jumlah jawaban
    const participantsRaw = await prisma.participant.findMany({
      where: {
        testId: {
          in: testIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: {
          select: {
            essayAnswers: true,
            choiceAnswers: true,
          },
        },
        test: {
          select: {
            joinCode: true,
            testTitle: true,
          },
        },
      },
    });

    // Urutkan berdasarkan skor tertinggi, lalu durasi tercepat
    const participants = participantsRaw
      .map((p) => ({
        ...p,
        duration: new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime(),
      }))
      .sort((a, b) => {
        // Urutkan skor menurun
        const scoreA = a.totalScore ?? 0;
        const scoreB = b.totalScore ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;

        // Kalau skor sama, urutkan durasi naik (lebih cepat lebih baik)
        return a.duration - b.duration;
      });

    return NextResponse.json({ participants });
  } catch (err) {
    console.error("Error fetching participants:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}