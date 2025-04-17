import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();

async function getUserFromToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const verified = await jwtVerify(token, secret);
    return verified.payload as { userId: number };
  } catch (err) {
    console.error("JWT verification error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { participantId } = body;

  const user = await getUserFromToken(req);
  if (!user) {
    return NextResponse.json(
      { message: "You are not authorized to view this participant" },
      { status: 403 }
    );
  }

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      user: true,
      test: {
        include: {
          questions: {
            include: {
              essay: {
                include: {
                  answers: {
                    where: {
                      participantId: participantId, // ✅ filter jawaban hanya milik participant ini
                    },
                  },
                },
              },
              choice: {
                include: {
                  choices: true,
                  answers: {
                    where: {
                      participantId: participantId, // ✅ filter juga di sini
                    },
                    include: {
                      choice: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });  

  if (!participant) {
    return NextResponse.json({ message: "Participant not found" }, { status: 404 });
  }

  if (participant.test.creatorId !== user.userId) {
    return NextResponse.json(
      { message: "You are not authorized to view this participant" },
      { status: 403 }
    );
  }

  return NextResponse.json({ participant });
}