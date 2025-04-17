// app/api/v1/participant/update/route.ts
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
    const { essayAnswerId, newScore } = body;
    console.log("Request body:", body);

    const user = await getUserFromToken(req);
    if (!user) {
        console.log("Unauthorized access attempt");
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const essayAnswer = await prisma.essayAnswer.findUnique({
        where: { id: essayAnswerId },
        include: {
            participant: {
                include: {
                    test: true,
                },
            },
        },
    });

    if (!essayAnswer) {
        console.log("Essay answer not found for id:", essayAnswerId);
        return NextResponse.json({ message: "Essay answer not found" }, { status: 404 });
    }

    const participant = essayAnswer.participant;
    const test = participant.test;

    if (test.creatorId !== user.userId) {
        console.log("Forbidden: User is not the creator", { creatorId: test.creatorId, userId: user.userId });
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Update essay answer score
    await prisma.essayAnswer.update({
        where: { id: essayAnswerId },
        data: { score: newScore },
    });
    console.log("Updated essayAnswer score:", { essayAnswerId, score: newScore });

    // Ambil ulang semua jawaban untuk peserta ini
    const [essayAnswers, choiceAnswers] = await Promise.all([
        prisma.essayAnswer.findMany({
            where: { participantId: participant.id },
        }),
        prisma.choiceAnswer.findMany({
            where: { participantId: participant.id },
        }),
    ]);

    // Hitung ulang total skor
    let totalScore = 0;
    let maxScore = 0;

    for (const ea of essayAnswers) {
        totalScore += ea.score ?? 0;
        maxScore += 5;
    }

    for (const ca of choiceAnswers) {
        totalScore += ca.score ?? 0;
        maxScore += 1;
    }

    totalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    console.log("Calculated totalScore:", totalScore);

    // Simpan total skor
    await prisma.participant.update({
        where: { id: participant.id },
        data: { totalScore },
    });
    console.log("Updated participant totalScore:", { participantId: participant.id, totalScore });

    return NextResponse.json({ message: "Score updated successfully", totalScore });
}
