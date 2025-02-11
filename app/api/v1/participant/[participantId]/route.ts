import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: { participantId: string } }
) {
    try {
        const participantId = parseInt(params.participantId);

        if (isNaN(participantId)) {
            return NextResponse.json(
                { error: "Invalid participant ID" },
                { status: 400 }
            );
        }

        const participant = await prisma.participant.findUnique({
            where: {
                id: participantId
            },
            select: {
                id: true,
                username: true,
                total_score: true,
                test_id: true,
                test: {
                    select: {
                        test_title: true,
                        show_detailed_score: true
                    }
                }
            }
        });

        if (!participant) {
            return NextResponse.json(
                { error: "Participant not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(participant);
    } catch (error) {
        console.error("Error fetching participant:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}