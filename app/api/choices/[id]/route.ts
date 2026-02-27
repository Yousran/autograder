import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { patchChoiceSchema } from "@/lib/schemas/choice";
import { patchMultipleSelectChoiceSchema } from "@/lib/schemas/multiple-choice";
import { requireTestCreator } from "@/lib/dal";

export async function PATCH(req: NextRequest) {
  const locale = await getLocale();
  const [tChoices, tValidation] = await Promise.all([
    getTranslations({ locale, namespace: "Api.choices" }),
    getTranslations({ locale, namespace: "Validation" }),
  ]);

  // Extract choiceid from URL
  const choiceid = req.nextUrl.pathname.split("/").pop();

  if (!choiceid) {
    return NextResponse.json(
      { error: tValidation("choiceIdRequired") },
      { status: 422 },
    );
  }

  // Fetch choice and question type
  let question;
  try {
    const choice = await prisma.choice.findUnique({
      where: { id: choiceid },
      select: { questionId: true },
    });
    if (!choice) {
      return NextResponse.json(
        { error: tChoices("notFound") },
        { status: 404 },
      );
    }

    question = await prisma.question.findUnique({
      where: { id: choice.questionId },
      select: { type: true, testId: true },
    });
    if (!question) {
      return NextResponse.json(
        { error: tChoices("notFound") },
        { status: 404 },
      );
    }
  } catch (err) {
    console.error("Error fetching choice or question:", err);
    return NextResponse.json({ error: tChoices("notFound") }, { status: 404 });
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
    return NextResponse.json({ error: tChoices("forbidden") }, { status: 403 });
  }

  // Parse body
  let body;
  try {
    body = await req.json();
  } catch (err) {
    console.error("Error parsing JSON:", err);
    return NextResponse.json(
      { error: tValidation("invalidJson") },
      { status: 400 },
    );
  }

  let parsed;
  let updated;
  try {
    if (question.type === "CHOICE") {
      parsed = patchChoiceSchema(tValidation).safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error:
              parsed.error.issues[0]?.message || tValidation("invalidInput"),
          },
          { status: 422 },
        );
      }
      updated = await prisma.choice.update({
        where: { id: choiceid },
        data: parsed.data,
      });
      return NextResponse.json({ choice: updated }, { status: 200 });
    } else if (question.type === "MULTIPLE_SELECT") {
      parsed = patchMultipleSelectChoiceSchema(tValidation).safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error:
              parsed.error.issues[0]?.message || tValidation("invalidInput"),
          },
          { status: 422 },
        );
      }
      updated = await prisma.multipleSelectChoice.update({
        where: { id: choiceid },
        data: parsed.data,
      });
      return NextResponse.json(
        { multipleSelectChoice: updated },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { error: tChoices("unsupportedType") },
        { status: 400 },
      );
    }
  } catch (err) {
    console.error("Error updating choice:", err);
    return NextResponse.json(
      { error: tChoices("updateFailed") },
      { status: 500 },
    );
  }
}
