import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { recalculateParticipantScore } from "@/lib/graders/total-score";

/**
 * PATCH /api/answer/multiple-choice/[answerId]
 * Manually override a multiple-select answer score (test creator only).
 * Body: { score: number }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ answerId: string }> },
) {
  const { answerId } = await params;
  const t = await getTranslations();

  const auth = await requireAuth();
  if (!auth.ok) {
    return NextResponse.json(
      { error: t("Api.answer.unauthorized") },
      { status: 401 },
    );
  }

  const answer = await prisma.multipleSelectAnswer.findUnique({
    where: { id: answerId },
    include: {
      participant: {
        include: { test: { select: { creatorId: true } } },
      },
      question: { select: { maxScore: true } },
    },
  });

  if (!answer) {
    return NextResponse.json(
      { error: t("Api.answer.answerNotFound") },
      { status: 404 },
    );
  }

  if (answer.participant.test.creatorId !== auth.session.user.id) {
    return NextResponse.json(
      { error: t("Api.answer.forbidden") },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: t("Api.answer.invalidBody") },
      { status: 400 },
    );
  }

  const schema = z.object({
    score: z
      .number()
      .int(t("Validation.integer"))
      .min(0, t("Validation.scoreNonNegative")),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? t("Api.answer.invalidBody") },
      { status: 422 },
    );
  }

  const { score } = parsed.data;

  if (score > answer.question.maxScore) {
    return NextResponse.json(
      { error: t("Api.answer.scoreTooHigh") },
      { status: 422 },
    );
  }

  const updated = await prisma.multipleSelectAnswer.update({
    where: { id: answerId },
    data: { score },
    select: { id: true, score: true },
  });

  await recalculateParticipantScore(answer.participantId);

  return NextResponse.json(updated, { status: 200 });
}
