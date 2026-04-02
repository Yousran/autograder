import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createMultipleSelectAnswerSchema } from "@/lib/schemas/answer";
import { gradeMultipleSelectAnswer } from "@/lib/graders/multiple-choice-grader";

/**
 * POST /api/answer/multiple-choice
 * Creates or updates a multiple-select answer for the participant.
 */
export async function POST(req: NextRequest) {
  const t = await getTranslations();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: t("Api.answer.invalidBody") },
      { status: 400 },
    );
  }

  const schema = createMultipleSelectAnswerSchema((key) => t(key));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? t("Api.answer.invalidBody") },
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
      { error: t("Api.answer.participantNotFound") },
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
      { error: t("Api.answer.questionNotFound") },
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
  const t = await getTranslations();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: t("Api.answer.invalidBody") },
      { status: 400 },
    );
  }

  const schema = createMultipleSelectAnswerSchema((key) => t(key));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? t("Api.answer.invalidBody") },
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
      { error: t("Api.answer.questionNotFound") },
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
