import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createEssayAnswerSchema } from "@/lib/schemas/answer";
import { gradeEssayAnswerAsync } from "@/lib/graders/essay-grader";

/**
 * POST /api/answer/essay
 * Creates a new essay answer for the participant.
 * Answer is saved immediately, then graded asynchronously.
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

  const schema = createEssayAnswerSchema((key) => t("Validation." + key));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? t("Api.answer.invalidBody") },
      { status: 422 },
    );
  }

  const { participantId, questionId, answerText } = parsed.data;

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

  const essay = await prisma.essayQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      answerText: true,
      isExactAnswer: true,
      maxScore: true,
      question: { select: { questionText: true } },
    },
  });
  if (!essay) {
    return NextResponse.json(
      { error: t("Api.answer.questionNotFound") },
      { status: 404 },
    );
  }

  const existing = await prisma.essayAnswer.findFirst({
    where: { participantId, questionId },
    select: { id: true },
  });

  let answerId: string;
  if (existing) {
    // Upsert — update with new answer text, score starts at 0
    const updated = await prisma.essayAnswer.update({
      where: { id: existing.id },
      data: { answerText, score: 0, scoreExplanation: null },
      select: {
        id: true,
        answerText: true,
        score: true,
        scoreExplanation: true,
      },
    });
    answerId = updated.id;

    // Grade asynchronously in the background
    await gradeEssayAnswerAsync(answerId, answerText, questionId, {
      exactMatch: t("Api.answer.exactMatch"),
      noMatch: t("Api.answer.noMatch"),
    }).catch((err) => {
      console.error(`Background grading failed for ${answerId}:`, err);
    });

    return NextResponse.json(updated, { status: 200 });
  }

  const created = await prisma.essayAnswer.create({
    data: {
      participantId,
      questionId,
      answerText,
      score: 0,
      scoreExplanation: null,
    },
    select: { id: true, answerText: true, score: true, scoreExplanation: true },
  });
  answerId = created.id;

  // Grade asynchronously in the background
  await gradeEssayAnswerAsync(answerId, answerText, questionId, {
    exactMatch: t("Api.answer.exactMatch"),
    noMatch: t("Api.answer.noMatch"),
  }).catch((err) => {
    console.error(`Background grading failed for ${answerId}:`, err);
  });

  return NextResponse.json(created, { status: 201 });
}

/**
 * PATCH /api/answer/essay
 * Updates an existing essay answer.
 * Answer is updated immediately, then graded asynchronously.
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

  const schema = createEssayAnswerSchema((key) => t("Validation." + key));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? t("Api.answer.invalidBody") },
      { status: 422 },
    );
  }

  const { participantId, questionId, answerText } = parsed.data;

  const essay = await prisma.essayQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      answerText: true,
      isExactAnswer: true,
      maxScore: true,
      question: { select: { questionText: true } },
    },
  });
  if (!essay) {
    return NextResponse.json(
      { error: t("Api.answer.questionNotFound") },
      { status: 404 },
    );
  }

  const existing = await prisma.essayAnswer.findFirst({
    where: { participantId, questionId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: t("Api.answer.answerNotFound") },
      { status: 404 },
    );
  }

  // Update answer immediately with score reset to 0
  const updated = await prisma.essayAnswer.update({
    where: { id: existing.id },
    data: { answerText, score: 0, scoreExplanation: null },
    select: { id: true, answerText: true, score: true, scoreExplanation: true },
  });

  // Grade asynchronously in the background
  await gradeEssayAnswerAsync(existing.id, answerText, questionId, {
    exactMatch: t("Api.answer.exactMatch"),
    noMatch: t("Api.answer.noMatch"),
  }).catch((err) => {
    console.error(`Background grading failed for ${existing.id}:`, err);
  });

  return NextResponse.json(updated, { status: 200 });
}
