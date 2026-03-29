import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { patchChoiceSchema } from "@/lib/schemas/choice";
import { patchMultipleSelectChoiceSchema } from "@/lib/schemas/multiple-choice";
import { requireTestCreator } from "@/lib/dal";

/**
 * Loads and returns translation functions for the Answer API and Validation namespaces.
 * Helper for async imports in route handlers.
 *
 * @returns Promise with tuple of [tAnswer, tValidation] translation functions
 */
async function getT() {
  const locale = await getLocale();
  return Promise.all([
    getTranslations({ locale, namespace: "Api.choices" }),
    getTranslations({ locale, namespace: "Validation" }),
  ]);
}

/**
 * PATCH /api/choices/[id]
 * Updates a choice (test owner only).
 * Works with both single-choice and multiple-select choices.
 *
 * @param req - The Next.js request with JSON body (partial choice fields)
 * @returns 200 with updated choice, or 401/403/404/422 on error
 */
export async function PATCH(req: NextRequest) {
  const [tChoices, tValidation] = await getT();

  // Extract choiceid from URL
  const choiceid = req.nextUrl.pathname.split("/").pop();

  if (!choiceid) {
    return NextResponse.json(
      { error: tValidation("choiceIdRequired") },
      { status: 422 },
    );
  }

  // Fetch choice (single-choice or multiple-select) and question
  let question;
  let choiceRecord: { questionId: string } | null = null;
  try {
    choiceRecord = await prisma.choice.findUnique({
      where: { id: choiceid },
      select: { questionId: true },
    });
    if (!choiceRecord) {
      choiceRecord = await prisma.multipleSelectChoice.findUnique({
        where: { id: choiceid },
        select: { questionId: true },
      });
    }

    if (!choiceRecord) {
      return NextResponse.json(
        { error: tChoices("notFound") },
        { status: 404 },
      );
    }

    question = await prisma.question.findUnique({
      where: { id: choiceRecord.questionId },
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

      // Prevent unmarking the only persisted correct choice
      if (parsed.data.isCorrect === false) {
        const existing = await prisma.choice.findUnique({
          where: { id: choiceid },
          select: { isCorrect: true, questionId: true },
        });
        if (!existing) {
          return NextResponse.json(
            { error: tChoices("notFound") },
            { status: 404 },
          );
        }

        if (existing.isCorrect) {
          const otherCorrect = await prisma.choice.count({
            where: {
              questionId: existing.questionId,
              id: { not: choiceid },
              isCorrect: true,
            },
          });

          if (otherCorrect === 0) {
            return NextResponse.json(
              { error: tChoices("cannotUnmarkOnlyCorrect") },
              { status: 400 },
            );
          }
        }
      }

      updated = await prisma.choice.update({
        where: { id: choiceid },
        data: parsed.data,
      });
      if (parsed.data.isCorrect) {
        // If this choice is now correct, set all other choices to incorrect
        await prisma.choice.updateMany({
          where: {
            questionId: updated.questionId,
            id: { not: updated.id },
          },
          data: { isCorrect: false },
        });
      }
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

      // Prevent unmarking the only persisted correct multiple-select choice
      if (parsed.data.isCorrect === false) {
        const existing = await prisma.multipleSelectChoice.findUnique({
          where: { id: choiceid },
          select: { isCorrect: true, questionId: true },
        });
        if (!existing) {
          return NextResponse.json(
            { error: tChoices("notFound") },
            { status: 404 },
          );
        }

        if (existing.isCorrect) {
          const otherCorrect = await prisma.multipleSelectChoice.count({
            where: {
              questionId: existing.questionId,
              id: { not: choiceid },
              isCorrect: true,
            },
          });

          if (otherCorrect === 0) {
            return NextResponse.json(
              { error: tChoices("cannotUnmarkOnlyCorrect") },
              { status: 400 },
            );
          }
        }
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

/**
 * DELETE /api/choices/[id]
 * Deletes a choice from a question (test owner only).
 * Works with both single-choice and multiple-select choices.
 * Cascades update of all answers that referenced this choice.
 *
 * @param req - The Next.js request (no body)
 * @returns 204 No Content on success, or 401/403/404/422/500 on error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [tChoices, tValidation] = await getT();

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: tValidation("choiceIdRequired") },
      { status: 422 },
    );
  }

  // Fetch choice (single-choice or multiple-select) and question
  let question;
  let choiceRecord: { questionId: string } | null = null;
  try {
    choiceRecord = await prisma.choice.findUnique({
      where: { id },
      select: { questionId: true },
    });
    if (!choiceRecord) {
      choiceRecord = await prisma.multipleSelectChoice.findUnique({
        where: { id },
        select: { questionId: true },
      });
    }

    if (!choiceRecord) {
      return NextResponse.json(
        { error: tChoices("notFound") },
        { status: 404 },
      );
    }

    question = await prisma.question.findUnique({
      where: { id: choiceRecord.questionId },
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

  // Authorization
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
    if (question.type === "CHOICE") {
      // Prevent deleting a choice that is marked correct
      const existing = await prisma.choice.findUnique({
        where: { id },
        select: { isCorrect: true, questionId: true },
      });
      if (!existing) {
        return NextResponse.json(
          { error: tChoices("notFound") },
          { status: 404 },
        );
      }

      // Count number of choices for the question
      const total = await prisma.choice.count({
        where: { questionId: existing.questionId },
      });

      if (existing.isCorrect) {
        return NextResponse.json(
          { error: tChoices("cannotDeleteCorrect") },
          { status: 400 },
        );
      }

      if (total <= 2) {
        return NextResponse.json(
          { error: tChoices("cannotDeleteMinChoices") },
          { status: 400 },
        );
      }

      const deleted = await prisma.choice.delete({ where: { id } });
      return NextResponse.json({ choice: deleted }, { status: 200 });
    } else if (question.type === "MULTIPLE_SELECT") {
      // Prevent deleting a multiple-select choice that's marked correct
      const existing = await prisma.multipleSelectChoice.findUnique({
        where: { id },
        select: { isCorrect: true, questionId: true },
      });
      if (!existing) {
        return NextResponse.json(
          { error: tChoices("notFound") },
          { status: 404 },
        );
      }

      const total = await prisma.multipleSelectChoice.count({
        where: { questionId: existing.questionId },
      });

      if (existing.isCorrect) {
        return NextResponse.json(
          { error: tChoices("cannotDeleteCorrect") },
          { status: 400 },
        );
      }

      if (total <= 2) {
        return NextResponse.json(
          { error: tChoices("cannotDeleteMinChoices") },
          { status: 400 },
        );
      }

      const deleted = await prisma.multipleSelectChoice.delete({
        where: { id },
      });
      return NextResponse.json(
        { multipleSelectChoice: deleted },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { error: tChoices("unsupportedType") },
        { status: 400 },
      );
    }
  } catch (err) {
    console.error("Error deleting choice:", err);
    return NextResponse.json(
      { error: tChoices("deleteFailed") || tChoices("updateFailed") },
      { status: 500 },
    );
  }
}
