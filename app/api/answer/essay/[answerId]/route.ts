import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { recalculateParticipantScore } from "@/lib/graders/total-score";
import { createGradeEssayAnswerSchema } from "@/lib/schemas/answer";

/**
 * PATCH /api/answer/essay/[answerId]
 * Manually grade an essay answer (test creator only).
 * Body: { score: number, scoreExplanation?: string }
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

  const answer = await prisma.essayAnswer.findUnique({
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

  const schema = createGradeEssayAnswerSchema((key) => t(key));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? t("Api.answer.invalidBody") },
      { status: 422 },
    );
  }

  const { score, scoreExplanation } = parsed.data;

  if (score > answer.question.maxScore) {
    return NextResponse.json(
      { error: t("Api.answer.scoreTooHigh") },
      { status: 422 },
    );
  }

  const updated = await prisma.essayAnswer.update({
    where: { id: answerId },
    data: {
      ...(score !== undefined && { score }),
      ...(scoreExplanation !== undefined && { scoreExplanation }),
    },
    select: { id: true, score: true, scoreExplanation: true },
  });

  await recalculateParticipantScore(answer.participantId);

  return NextResponse.json(updated, { status: 200 });
}
