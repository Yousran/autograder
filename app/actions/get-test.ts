"use server";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { TestWithRelations } from "@/types/test";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function getTestByJoinCode(
  joinCode: string
): Promise<{ success: true; test: TestWithRelations } | { error: string }> {
  if (!joinCode) {
    return { error: "Missing joinCode" };
  }

  try {
    const test = await prisma.test.findUnique({
      where: { joinCode },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            essay: true,
            choice: {
              include: { choices: true },
            },
            multipleSelect: {
              include: { multipleSelectChoices: true },
            },
          },
        },
        prerequisites: {
          select: { prerequisiteTestId: true, minScoreRequired: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        participants: {
          select: { id: true },
        },
      },
    });

    if (!test) {
      return { error: "Test not found" };
    }

    return { success: true, test: test as TestWithRelations };
  } catch (error) {
    console.error("Error fetching test by joinCode:", error);
    return { error: "Failed to fetch test" };
  }
}
