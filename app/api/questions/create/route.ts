import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { requireTestCreator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { QuestionType } from "@/lib/generated/prisma/enums";
import { createQuestionRequestSchema } from "@/lib/schemas/question";

export async function POST(req: NextRequest) {
  const locale = await getLocale();
  const [tQuestions, tValidation] = await Promise.all([
    getTranslations({ locale, namespace: "Api.questions" }),
    getTranslations({ locale, namespace: "Validation" }),
  ]);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: tQuestions("createFailed") },
      { status: 400 },
    );
  }

  const schema = createQuestionRequestSchema((key) => tValidation(key));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? tQuestions("createFailed") },
      { status: 422 },
    );
  }

  const { testId } = parsed.data;

  const auth = await requireTestCreator(testId);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      return NextResponse.json(
        { error: tQuestions("unauthorized") },
        { status: 401 },
      );
    }
    if (auth.reason === "not_found") {
      return NextResponse.json(
        { error: tQuestions("notFound") },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: tQuestions("forbidden") },
      { status: 403 },
    );
  }

  // Determine the next order index
  const lastQuestion = await prisma.question.findFirst({
    where: { testId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (lastQuestion?.order ?? -1) + 1;

  try {
    const question = await prisma.question.create({
      data: {
        testId,
        type: QuestionType.CHOICE,
        questionText: "",
        order: nextOrder,
        choice: {
          create: {
            isChoiceRandomized: false,
            maxScore: 1,
            choices: {
              createMany: {
                data: [
                  { choiceText: "", isCorrect: true },
                  { choiceText: "", isCorrect: false },
                ],
              },
            },
          },
        },
      },
      include: {
        choice: {
          include: { choices: true },
        },
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: tQuestions("createFailed") },
      { status: 500 },
    );
  }
}
