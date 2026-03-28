import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireTestCreator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { QuestionType } from "@/lib/generated/prisma/enums";
import { ChoiceSchema, getChoicesQuerySchema } from "@/lib/schemas/choice";
import { MultipleSelectChoiceSchema } from "@/lib/schemas/multiple-choice";

export async function GET(req: NextRequest) {
  const locale = await getLocale();
  const [tChoices, tValidation] = await Promise.all([
    getTranslations({ locale, namespace: "Api.questions" }),
    getTranslations({ locale, namespace: "Validation" }),
  ]);

  const { searchParams } = req.nextUrl;
  const parsed = getChoicesQuerySchema(tValidation).safeParse({
    questionid: searchParams.get("questionid"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message || tValidation("questionIdRequired"),
      },
      { status: 422 },
    );
  }

  const { questionid } = parsed.data;

  // Get the question to find the test and type
  const question = await prisma.question.findUnique({
    where: { id: questionid },
    select: { testId: true, type: true },
  });

  if (!question) {
    return NextResponse.json(
      { error: tChoices("questionNotFound") },
      { status: 404 },
    );
  }

  const auth = await requireTestCreator(question.testId);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      return NextResponse.json(
        { error: tChoices("unauthorized") },
        { status: 401 },
      );
    }
    if (auth.reason === "not_found") {
      return NextResponse.json(
        { error: tChoices("notFound") },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: tChoices("forbidden") }, { status: 403 });
  }

  try {
    const choicesUnion = z.array(
      z.union([ChoiceSchema, MultipleSelectChoiceSchema]),
    );
    let choices: z.infer<typeof choicesUnion> = [];

    if (question.type === QuestionType.CHOICE) {
      const choiceQuestionChoices = await prisma.choice.findMany({
        where: { questionId: questionid },
        orderBy: { createdAt: "asc" },
      });
      choices = choicesUnion.parse(choiceQuestionChoices);
    } else if (question.type === QuestionType.MULTIPLE_SELECT) {
      const multipleSelectChoices = await prisma.multipleSelectChoice.findMany({
        where: { questionId: questionid },
        orderBy: { createdAt: "asc" },
      });
      choices = choicesUnion.parse(multipleSelectChoices);
    }

    return NextResponse.json(choices);
  } catch (error) {
    console.error("Error fetching choices:", error);
    return NextResponse.json(
      { error: tChoices("fetchFailed") },
      { status: 500 },
    );
  }
}
