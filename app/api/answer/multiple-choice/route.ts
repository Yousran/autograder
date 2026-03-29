import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createMultipleSelectAnswerSchema } from "@/lib/schemas/answer";

type MultipleSelectChoiceInfo = { id: string; isCorrect: boolean };

/**
 * Grades a multiple-select answer using proportional (merciful) scoring.
 * Formula: max(0, (correctSelections - incorrectSelections) / totalCorrect) * maxScore
 * Rounded to the nearest integer. Score cannot go below 0.
 *
 * @param maxScore - The maximum points for this question
 * @param allChoices - All available choices with correctness flags
 * @param selectedChoiceIds - IDs of choices the participant selected
 * @returns The calculated score based on proportional formula
 */
function gradeMultipleSelectAnswer(
  maxScore: number,
  allChoices: MultipleSelectChoiceInfo[],
  selectedChoiceIds: string[],
): number {
  if (selectedChoiceIds.length === 0) return 0;

  const totalCorrect = allChoices.filter((c) => c.isCorrect).length;
  if (totalCorrect === 0) return 0;

  let correctSelections = 0;
  let incorrectSelections = 0;

  for (const selectedId of selectedChoiceIds) {
    const choice = allChoices.find((c) => c.id === selectedId);
    if (choice) {
      if (choice.isCorrect) {
        correctSelections++;
      } else {
        incorrectSelections++;
      }
    }
  }

  const scoreRatio = Math.max(
    0,
    (correctSelections - incorrectSelections) / totalCorrect,
  );
  return Math.round(scoreRatio * maxScore);
}

/**
 * Loads and returns translation functions for the Answer API and Validation namespaces.
 * Helper for async imports in route handlers.
 *
 * @returns Promise with tuple of [tAnswer, tValidation] translation functions
 */
async function getT() {
  const locale = await getLocale();
  return Promise.all([
    getTranslations({ locale, namespace: "Api.answer" }),
    getTranslations({ locale, namespace: "Validation" }),
  ]);
}

/**
 * POST /api/answer/multiple-choice
 * Creates or updates a multiple-select answer for the participant.
 */
export async function POST(req: NextRequest) {
  const [tAnswer, tValidation] = await getT();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: tAnswer("invalidBody") },
      { status: 400 },
    );
  }

  const schema = createMultipleSelectAnswerSchema((key) => tValidation(key));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? tAnswer("invalidBody") },
      { status: 422 },
    );
  }

  const { participantId, questionId, selectedChoiceIds } = parsed.data;

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { id: true },
  });
  if (!participant) {
    return NextResponse.json(
      { error: tAnswer("participantNotFound") },
      { status: 404 },
    );
  }

  const msQuestion = await prisma.multipleSelectQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      maxScore: true,
      multipleSelectChoices: { select: { id: true, isCorrect: true } },
    },
  });
  if (!msQuestion) {
    return NextResponse.json(
      { error: tAnswer("questionNotFound") },
      { status: 404 },
    );
  }

  const score = gradeMultipleSelectAnswer(
    msQuestion.maxScore,
    msQuestion.multipleSelectChoices,
    selectedChoiceIds,
  );

  const existing = await prisma.multipleSelectAnswer.findFirst({
    where: { participantId, questionId },
    select: { id: true },
  });

  if (existing) {
    const updated = await prisma.multipleSelectAnswer.update({
      where: { id: existing.id },
      data: {
        selectedChoices: {
          set: selectedChoiceIds.map((id) => ({ id })),
        },
        score,
      },
      select: {
        id: true,
        selectedChoices: { select: { id: true } },
        score: true,
      },
    });
    return NextResponse.json(updated, { status: 200 });
  }

  const created = await prisma.multipleSelectAnswer.create({
    data: {
      participantId,
      questionId,
      selectedChoices: {
        connect: selectedChoiceIds.map((id) => ({ id })),
      },
      score,
    },
    select: {
      id: true,
      selectedChoices: { select: { id: true } },
      score: true,
    },
  });
  return NextResponse.json(created, { status: 201 });
}

/**
 * PATCH /api/answer/multiple-choice
 * Updates selected choices for an existing multiple-select answer.
 */
export async function PATCH(req: NextRequest) {
  const [tAnswer, tValidation] = await getT();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: tAnswer("invalidBody") },
      { status: 400 },
    );
  }

  const schema = createMultipleSelectAnswerSchema((key) => tValidation(key));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? tAnswer("invalidBody") },
      { status: 422 },
    );
  }

  const { participantId, questionId, selectedChoiceIds } = parsed.data;

  const msQuestion = await prisma.multipleSelectQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      maxScore: true,
      multipleSelectChoices: { select: { id: true, isCorrect: true } },
    },
  });
  if (!msQuestion) {
    return NextResponse.json(
      { error: tAnswer("questionNotFound") },
      { status: 404 },
    );
  }

  const score = gradeMultipleSelectAnswer(
    msQuestion.maxScore,
    msQuestion.multipleSelectChoices,
    selectedChoiceIds,
  );

  const existing = await prisma.multipleSelectAnswer.findFirst({
    where: { participantId, questionId },
    select: { id: true },
  });

  if (!existing) {
    const created = await prisma.multipleSelectAnswer.create({
      data: {
        participantId,
        questionId,
        selectedChoices: { connect: selectedChoiceIds.map((id) => ({ id })) },
        score,
      },
      select: {
        id: true,
        selectedChoices: { select: { id: true } },
        score: true,
      },
    });
    return NextResponse.json(created, { status: 201 });
  }

  const updated = await prisma.multipleSelectAnswer.update({
    where: { id: existing.id },
    data: {
      selectedChoices: {
        set: selectedChoiceIds.map((id) => ({ id })),
      },
      score,
    },
    select: {
      id: true,
      selectedChoices: { select: { id: true } },
      score: true,
    },
  });

  return NextResponse.json(updated, { status: 200 });
}
