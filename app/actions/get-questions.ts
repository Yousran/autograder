"use server";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";
import { Question } from "@/types/question";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const paramsSchema = z.object({
  testId: z.string().min(1, "Missing testId"),
});

export async function getQuestionsByTestId(
  testId: string
): Promise<{ success: true; questions: Question[] } | { error: string }> {
  const parsed = paramsSchema.safeParse({ testId });
  if (!parsed.success) {
    return { error: "Invalid testId" };
  }

  try {
    const questionsRaw = await prisma.question.findMany({
      where: { testId },
      orderBy: { order: "asc" },
      include: {
        essay: true,
        choice: { include: { choices: true } },
        multipleSelect: { include: { multipleSelectChoices: true } },
      },
    });

    // Transform Prisma results to match Question discriminated union type
    const questions: Question[] = questionsRaw.map((q) => {
      const baseQuestion = {
        id: q.id,
        order: q.order,
        type: q.type,
        questionText: q.questionText,
        testId: q.testId,
      };

      if (q.type === "ESSAY" && q.essay) {
        return {
          ...baseQuestion,
          type: "ESSAY" as const,
          answerText: q.essay.answerText,
          isExactAnswer: q.essay.isExactAnswer,
          maxScore: q.essay.maxScore,
        };
      } else if (q.type === "CHOICE" && q.choice) {
        return {
          ...baseQuestion,
          type: "CHOICE" as const,
          isChoiceRandomized: q.choice.isChoiceRandomized,
          maxScore: q.choice.maxScore,
          choices: q.choice.choices.map((c) => ({
            id: c.id,
            choiceText: c.choiceText,
            isCorrect: c.isCorrect,
          })),
        };
      } else if (q.type === "MULTIPLE_SELECT" && q.multipleSelect) {
        return {
          ...baseQuestion,
          type: "MULTIPLE_SELECT" as const,
          isChoiceRandomized: q.multipleSelect.isChoiceRandomized,
          maxScore: q.multipleSelect.maxScore,
          choices: q.multipleSelect.multipleSelectChoices.map((c) => ({
            id: c.id,
            choiceText: c.choiceText,
            isCorrect: c.isCorrect,
          })),
        };
      }

      // Fallback - should not happen if database is consistent
      throw new Error(
        `Invalid question type or missing data for question ${q.id}`
      );
    });

    return { success: true, questions };
  } catch (error) {
    console.error("Error fetching questions by testId:", error);
    return { error: "Failed to fetch questions" };
  }
}
