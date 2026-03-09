import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createEssayAnswerSchema } from "@/lib/schemas/answer";
import { llm } from "@/lib/llm";

type EssayQuestionGradeContext = {
  answerText: string;
  isExactAnswer: boolean;
  maxScore: number;
  questionText?: string;
};

type GradeMessages = { exactMatch: string; noMatch: string };

/**
 * Grades an essay answer.
 * - If `isExactAnswer` is true, performs a case-insensitive trimmed comparison.
 *   Full score on match, 0 on mismatch.
 * - If `isExactAnswer` is false, uses AI grading via OpenRouter.
 */
async function gradeEssayAnswer(
  question: EssayQuestionGradeContext,
  participantAnswer: string,
  messages: GradeMessages,
  questionText: string,
): Promise<{ score: number; scoreExplanation: string | null }> {
  if (question.isExactAnswer) {
    const normalize = (s: string) => s.trim().toLowerCase();
    const isMatch =
      normalize(participantAnswer) === normalize(question.answerText);

    return {
      score: isMatch ? question.maxScore : 0,
      scoreExplanation: isMatch ? messages.exactMatch : messages.noMatch,
    };
  }

  // Use AI grading for non-exact answers
  try {
    const result = await llm({
      questionText,
      answer: participantAnswer,
      answerKey: question.answerText,
      minScore: 0,
      maxScore: question.maxScore,
    });
    return {
      score: result.score,
      scoreExplanation: result.explanation,
    };
  } catch (err) {
    console.error("AI grading failed:", err);
    // Fallback to returning 0 score
    return {
      score: 0,
      scoreExplanation: messages.noMatch,
    };
  }
}

async function getT() {
  const locale = await getLocale();
  return Promise.all([
    getTranslations({ locale, namespace: "Api.answer" }),
    getTranslations({ locale, namespace: "Validation" }),
  ]);
}

/**
 * POST /api/answer/essay
 * Creates a new essay answer for the participant.
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

  const schema = createEssayAnswerSchema((key) => tValidation(key));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? tAnswer("invalidBody") },
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
      { error: tAnswer("participantNotFound") },
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
      { error: tAnswer("questionNotFound") },
      { status: 404 },
    );
  }

  const { score, scoreExplanation } = await gradeEssayAnswer(
    essay,
    answerText,
    {
      exactMatch: tAnswer("exactMatch"),
      noMatch: tAnswer("noMatch"),
    },
    essay.question.questionText,
  );

  const existing = await prisma.essayAnswer.findFirst({
    where: { participantId, questionId },
    select: { id: true },
  });

  if (existing) {
    // Upsert — update instead of duplicate
    const updated = await prisma.essayAnswer.update({
      where: { id: existing.id },
      data: { answerText, score, scoreExplanation },
      select: {
        id: true,
        answerText: true,
        score: true,
        scoreExplanation: true,
      },
    });
    return NextResponse.json(updated, { status: 200 });
  }

  const created = await prisma.essayAnswer.create({
    data: { participantId, questionId, answerText, score, scoreExplanation },
    select: { id: true, answerText: true, score: true, scoreExplanation: true },
  });
  return NextResponse.json(created, { status: 201 });
}

/**
 * PATCH /api/answer/essay
 * Updates an existing essay answer.
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

  const schema = createEssayAnswerSchema((key) => tValidation(key));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? tAnswer("invalidBody") },
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
      { error: tAnswer("questionNotFound") },
      { status: 404 },
    );
  }

  const { score, scoreExplanation } = await gradeEssayAnswer(
    essay,
    answerText,
    {
      exactMatch: tAnswer("exactMatch"),
      noMatch: tAnswer("noMatch"),
    },
    essay.question.questionText,
  );

  const existing = await prisma.essayAnswer.findFirst({
    where: { participantId, questionId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: tAnswer("answerNotFound") },
      { status: 404 },
    );
  }

  const updated = await prisma.essayAnswer.update({
    where: { id: existing.id },
    data: { answerText, score, scoreExplanation },
    select: { id: true, answerText: true, score: true, scoreExplanation: true },
  });

  return NextResponse.json(updated, { status: 200 });
}
