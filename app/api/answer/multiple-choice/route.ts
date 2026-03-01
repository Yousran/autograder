import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createMultipleSelectAnswerSchema } from "@/lib/schemas/answer";

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
    select: { id: true },
  });
  if (!msQuestion) {
    return NextResponse.json(
      { error: tAnswer("questionNotFound") },
      { status: 404 },
    );
  }

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
      },
      select: { id: true, selectedChoices: { select: { id: true } } },
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
    },
    select: { id: true, selectedChoices: { select: { id: true } } },
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
      },
      select: { id: true, selectedChoices: { select: { id: true } } },
    });
    return NextResponse.json(created, { status: 201 });
  }

  const updated = await prisma.multipleSelectAnswer.update({
    where: { id: existing.id },
    data: {
      selectedChoices: {
        set: selectedChoiceIds.map((id) => ({ id })),
      },
    },
    select: { id: true, selectedChoices: { select: { id: true } } },
  });

  return NextResponse.json(updated, { status: 200 });
}
