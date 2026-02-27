import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getChoicesQuerySchema, defaultChoiceData } from "@/lib/schemas/choice";
import { defaultMultipleSelectChoiceData } from "@/lib/schemas/multiple-choice";
import { requireTestCreator } from "@/lib/dal";

export async function POST(req: NextRequest) {
  const locale = await getLocale();
  const [tChoices, tValidation] = await Promise.all([
    getTranslations({ locale, namespace: "Api.choices" }),
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

  try {
    // Fetch question type
    const question = await prisma.question.findUnique({
      where: { id: questionid },
      select: { type: true, testId: true },
    });
    if (!question) {
      return NextResponse.json(
        { error: tChoices("notFound") },
        { status: 404 },
      );
    }

    // Authorization: require test creator
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
      return NextResponse.json(
        { error: tChoices("forbidden") },
        { status: 403 },
      );
    }

    let created;
    if (question.type === "CHOICE") {
      created = await prisma.choice.create({
        data: {
          questionId: questionid,
          choiceText: defaultChoiceData.choiceText,
          isCorrect: defaultChoiceData.isCorrect,
        },
      });
      return NextResponse.json({ choice: created }, { status: 201 });
    } else if (question.type === "MULTIPLE_SELECT") {
      created = await prisma.multipleSelectChoice.create({
        data: {
          questionId: questionid,
          choiceText: defaultMultipleSelectChoiceData.choiceText,
          isCorrect: defaultMultipleSelectChoiceData.isCorrect,
        },
      });
      return NextResponse.json(
        { multipleSelectChoice: created },
        { status: 201 },
      );
    } else {
      return NextResponse.json(
        { error: tChoices("unsupportedType") },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error creating choice:", error);
    return NextResponse.json(
      { error: tChoices("createFailed") },
      { status: 500 },
    );
  }
}
