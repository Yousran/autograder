import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { requireTestCreator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getParticipantsQuerySchema } from "@/lib/schemas/participant";

/**
 * GET /api/participants
 * Lists all participants for a test (test owner only).
 * Returns participant summary with scores and completion status.
 *
 * @param req - The Next.js request with query param `testid`
 * @returns 200 with array of participants, or 401/403/404 if unauthorized
 */
export async function GET(req: NextRequest) {
  const locale = await getLocale();
  const [tParticipants, tValidation] = await Promise.all([
    getTranslations({ locale, namespace: "Api.participants" }),
    getTranslations({ locale, namespace: "Validation" }),
  ]);

  const { searchParams } = req.nextUrl;
  const parsed = getParticipantsQuerySchema.safeParse({
    testid: searchParams.get("testid"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? tValidation("testIdRequired"),
      },
      { status: 422 },
    );
  }

  const { testid } = parsed.data;

  const auth = await requireTestCreator(testid);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      return NextResponse.json(
        { error: tParticipants("unauthorized") },
        { status: 401 },
      );
    }
    if (auth.reason === "not_found") {
      return NextResponse.json(
        { error: tParticipants("notFound") },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: tParticipants("forbidden") },
      { status: 403 },
    );
  }

  const [participants, questions] = await Promise.all([
    prisma.participant.findMany({
      where: { testId: testid },
      orderBy: { score: "desc" },
      select: {
        id: true,
        name: true,
        score: true,
        isCompleted: true,
      },
    }),
    prisma.question.findMany({
      where: { testId: testid },
      select: {
        essay: { select: { maxScore: true } },
        choice: { select: { maxScore: true } },
        multipleSelect: { select: { maxScore: true } },
      },
    }),
  ]);

  const maxScore = questions.reduce((sum, q) => {
    if (q.essay) return sum + q.essay.maxScore;
    if (q.choice) return sum + q.choice.maxScore;
    if (q.multipleSelect) return sum + q.multipleSelect.maxScore;
    return sum;
  }, 0);

  return NextResponse.json({ participants, maxScore });
}
