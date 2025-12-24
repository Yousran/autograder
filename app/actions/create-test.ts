"use server";

import { auth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { testFormSchema, TestFormValues } from "@/lib/validations/test";
import { headers } from "next/headers";
import { PrismaPg } from "@prisma/adapter-pg";
import { encodeJoinCodeFromNumber } from "@/lib/feistelEncrypt";
import { devLog } from "@/utils/devLog";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function createTest(data: TestFormValues) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");

  // 1. Validasi di Server (Layer Kedua)
  const parsed = testFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data format" };
  }

  const { questions, ...testData } = parsed.data;

  try {
    // 2. Generate unique join code
    const testCount = await prisma.test.count();
    const joinCode = encodeJoinCodeFromNumber(testCount + 1);

    // 3. Transaksi Database Kompleks
    const newTest = await prisma.test.create({
      data: {
        title: testData.title,
        description: testData.description,
        testDuration: testData.testDuration,
        startTime: testData.startTime,
        endTime: testData.endTime,
        joinCode,
        isAcceptingResponses: testData.isAcceptingResponses,
        loggedInUserOnly: testData.loggedInUserOnly,
        allowMultipleAttempts: testData.allowMultipleAttempts,
        maxAttempts: testData.maxAttempts,
        showDetailedScore: testData.showDetailedScore,
        showCorrectAnswers: testData.showCorrectAnswers,
        isQuestionsOrdered: testData.isQuestionsOrdered,
        creatorId: session.user.id,
        questions: {
          create: questions.map((q, index) => {
            // Base Question Data
            const baseQuestion = {
              questionText: q.questionText,
              type: q.type,
              order: index, // Otomatis set order berdasarkan urutan array
            };

            // Mapping berdasarkan tipe untuk Prisma nested writes
            if (q.type === "ESSAY") {
              return {
                ...baseQuestion,
                essay: {
                  create: {
                    answerText: q.answerText,
                    isExactAnswer: q.exactAnswer,
                    maxScore: q.maxScore,
                  },
                },
              };
            } else if (q.type === "CHOICE") {
              return {
                ...baseQuestion,
                choice: {
                  create: {
                    maxScore: q.maxScore,
                    isChoiceRandomized: q.isChoiceRandomized,
                    choices: {
                      create: q.choices.map((c) => ({
                        choiceText: c.choiceText,
                        isCorrect: c.isCorrect,
                      })),
                    },
                  },
                },
              };
            } else {
              // MULTIPLE SELECT
              return {
                ...baseQuestion,
                multipleSelect: {
                  create: {
                    maxScore: q.maxScore,
                    isChoiceRandomized: q.isChoiceRandomized,
                    multipleSelectChoices: {
                      // Perhatikan nama relasi di schema prisma anda
                      create: q.choices.map((c) => ({
                        choiceText: c.choiceText,
                        isCorrect: c.isCorrect,
                      })),
                    },
                  },
                },
              };
            }
          }),
        },
      },
    });

    return { success: true, testId: newTest.id };
  } catch (error) {
    devLog(error);
    return { error: "Failed to create test" };
  }
}
