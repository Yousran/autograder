"use server";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Participant } from "@/lib/generated/prisma/client";
import { participantIdSchema } from "@/lib/validations/participant";
import { testIdSchema } from "@/lib/validations/test";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function getParticipantById(
  participantId: string
): Promise<{ success: true; participant: Participant } | { error: string }> {
  if (!participantId) {
    return { error: "Missing participantId" };
  }

  const parsed = participantIdSchema.safeParse(participantId);
  if (!parsed.success) {
    return { error: "Invalid participantId" };
  }

  try {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        user: true,
        test: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: {
                essay: true,
                choice: { include: { choices: true } },
                multipleSelect: { include: { multipleSelectChoices: true } },
              },
            },
          },
        },
        essayAnswers: { include: { question: true } },
        choiceAnswers: { include: { question: true, choice: true } },
        multipleSelectAnswers: {
          include: { question: true, selectedChoices: true },
        },
      },
    });

    if (!participant) {
      return { error: "Participant not found" };
    }

    return { success: true, participant };
  } catch (error) {
    console.error("Error fetching participant by id:", error);
    return { error: "Failed to fetch participant" };
  }
}

export async function getParticipantByTestId(
  testId: string
): Promise<{ success: true; participants: Participant[] } | { error: string }> {
  const parsed = testIdSchema.safeParse(testId);
  if (!parsed.success) return { error: "Invalid testId" };

  try {
    const participants = await prisma.participant.findMany({
      where: { testId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return { success: true, participants };
  } catch (error) {
    console.error("Error fetching participants by testId:", error);
    return { error: "Failed to fetch participants" };
  }
}
