import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createChoiceAnswerSchema } from "@/lib/schemas/answer";
import { gradeChoiceAnswer } from "@/lib/graders/choice-grader";

/**
 * POST /api/answer/choice
 * Creates or updates a single-choice answer for the participant.
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

  const schema = createChoiceAnswerSchema((key) => t("Validation." + key));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? t("Api.answer.invalidBody") },
      { status: 422 },
    );
  }

  const { participantId, questionId, selectedChoiceId } = parsed.data;

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

  const choiceQuestion = await prisma.choiceQuestion.findUnique({
    where: { id: questionId },
    select: { id: true, maxScore: true },
  });
  if (!choiceQuestion) {
    return NextResponse.json(
      { error: t("Api.answer.questionNotFound") },
      { status: 404 },
    );
  }

  const selectedChoice = selectedChoiceId
    ? await prisma.choice.findUnique({
        where: { id: selectedChoiceId },
        select: { isCorrect: true },
      })
    : null;

  const score = gradeChoiceAnswer(choiceQuestion.maxScore, selectedChoice);

  const existing = await prisma.choiceAnswer.findFirst({
    where: { participantId, questionId },
    select: { id: true },
  });

  if (existing) {
    const updated = await prisma.choiceAnswer.update({
      where: { id: existing.id },
      data: { selectedChoiceId: selectedChoiceId ?? null, score },
      select: { id: true, selectedChoiceId: true, score: true },
    });
    return NextResponse.json(updated, { status: 200 });
  }

  const created = await prisma.choiceAnswer.create({
    data: {
      participantId,
      questionId,
      selectedChoiceId: selectedChoiceId ?? null,
      score,
    },
    select: { id: true, selectedChoiceId: true, score: true },
  });
  return NextResponse.json(created, { status: 201 });
}

/**
 * PATCH /api/answer/choice
 * Updates an existing choice answer.
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

  const schema = createChoiceAnswerSchema((key) => t("Validation." + key));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? t("Api.answer.invalidBody") },
      { status: 422 },
    );
  }

  const { participantId, questionId, selectedChoiceId } = parsed.data;

  const choiceQuestion = await prisma.choiceQuestion.findUnique({
    where: { id: questionId },
    select: { id: true, maxScore: true },
  });
  if (!choiceQuestion) {
    return NextResponse.json(
      { error: t("Api.answer.questionNotFound") },
      { status: 404 },
    );
  }

  const selectedChoice = selectedChoiceId
    ? await prisma.choice.findUnique({
        where: { id: selectedChoiceId },
        select: { isCorrect: true },
      })
    : null;

  const score = gradeChoiceAnswer(choiceQuestion.maxScore, selectedChoice);

  const existing = await prisma.choiceAnswer.findFirst({
    where: { participantId, questionId },
    select: { id: true },
  });

  if (!existing) {
    // Create if not exists
    const created = await prisma.choiceAnswer.create({
      data: {
        participantId,
        questionId,
        selectedChoiceId: selectedChoiceId ?? null,
        score,
      },
      select: { id: true, selectedChoiceId: true, score: true },
    });
    return NextResponse.json(created, { status: 201 });
  }

  const updated = await prisma.choiceAnswer.update({
    where: { id: existing.id },
    data: { selectedChoiceId: selectedChoiceId ?? null, score },
    select: { id: true, selectedChoiceId: true, score: true },
  });

  return NextResponse.json(updated, { status: 200 });
}
