import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { encodeJoinCodeFromNumber } from "@/lib/feistelEncrypt";
import { getToken, getUserFromToken } from "@/lib/auth-server";

const baseQuestionSchema = z.object({
  questionText: z.string().min(1, { message: "Question is required" }),
  order: z.number().optional(),
});

const essayQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("ESSAY"),
  answerText: z.string().min(1, { message: "Answer is required" }),
  isExactAnswer: z.boolean(),
  maxScore: z.number().min(0),
});

const choiceSchema = z.object({
  choiceText: z.string().min(1),
  isCorrect: z.boolean(),
});

const choiceQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("CHOICE"),
  isChoiceRandomized: z.boolean(),
  maxScore: z.number().min(0),
  choices: z
    .array(choiceSchema)
    .min(2, { message: "At least two choices required" }),
});

const multipleChoiceSchema = z.object({
  choiceText: z.string().min(1),
  isCorrect: z.boolean(),
});

const multipleChoiceQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("MULTIPLE_CHOICE"),
  isChoiceRandomized: z.boolean(),
  maxScore: z.number().min(0),
  choices: z
    .array(multipleChoiceSchema)
    .min(2, { message: "At least two choices required" }),
});

const questionSchema = z.discriminatedUnion("type", [
  essayQuestionSchema,
  choiceQuestionSchema,
  multipleChoiceQuestionSchema,
]);

export const testSchema = z.object({
  title: z.string().min(3, { message: "Title is required" }),
  description: z.string().optional(),
  testDuration: z
    .number({ invalid_type_error: "Duration must be a number" })
    .min(1, { message: "Minimum 1 minute" }),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  acceptResponses: z.boolean(),
  showDetailedScore: z.boolean(),
  showCorrectAnswers: z.boolean(),
  isOrdered: z.boolean(),
  questions: z.array(questionSchema),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("Request body from POST:", body);

    const userLoggedIn = getUserFromToken(getToken(req));
    if (!userLoggedIn) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const testData = testSchema.parse(body);
    const joinCode = encodeJoinCodeFromNumber(Date.now());

    const createdTest = await prisma.test.create({
      data: {
        creatorId: userLoggedIn.userId,
        title: testData.title,
        description: testData.description,
        joinCode,
        acceptResponses: testData.acceptResponses,
        showDetailedScore: testData.showDetailedScore,
        showCorrectAnswers: testData.showCorrectAnswers,
        isOrdered: testData.isOrdered,
        testDuration: testData.testDuration,
        startTime: testData.startTime,
        endTime: testData.endTime,
      },
    });

    for (const question of testData.questions) {
      const createdQuestion = await prisma.question.create({
        data: {
          testId: createdTest.id,
          questionText: question.questionText,
          type: question.type,
          order: question.order ?? 0,
        },
      });

      if (question.type === "ESSAY") {
        await prisma.essayQuestion.create({
          data: {
            id: createdQuestion.id,
            answerText: question.answerText,
            isExactAnswer: question.isExactAnswer,
            maxScore: question.maxScore,
          },
        });
      }

      if (question.type === "CHOICE") {
        await prisma.choiceQuestion.create({
          data: {
            id: createdQuestion.id,
            isChoiceRandomized: question.isChoiceRandomized,
            maxScore: question.maxScore,
          },
        });

        await prisma.choice.createMany({
          data: question.choices.map((choice) => ({
            questionId: createdQuestion.id,
            choiceText: choice.choiceText,
            isCorrect: choice.isCorrect,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        });
      }

      if (question.type === "MULTIPLE_CHOICE") {
        await prisma.multipleChoiceQuestion.create({
          data: {
            id: createdQuestion.id,
            isChoiceRandomized: question.isChoiceRandomized,
            maxScore: question.maxScore,
          },
        });

        await prisma.multipleChoice.createMany({
          data: question.choices.map((choice) => ({
            questionId: createdQuestion.id,
            choiceText: choice.choiceText,
            isCorrect: choice.isCorrect,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        });
      }
    }

    return NextResponse.json({ joinCode }, { status: 201 });
  } catch (ZodError) {
    console.error("Validation error:", ZodError);
    return NextResponse.json({ message: ZodError }, { status: 422 });
  }
}
