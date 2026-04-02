import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireTestCreator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { createTestPrerequisiteSchema } from "@/lib/schemas/prerequisite";

/** GET /api/tests/[id]/prerequisites
 * Returns the prerequisites for the test along with available tests
 * (other tests created by the same user) that can be added as prerequisites.
 * Test owner only.
 *
 * @param req - Not used
 * @param params - URL parameters { id: testId }
 * @returns 200 with { prerequisites, availableTests }, or 401/403/404 on error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const t = await getTranslations();

  const auth = await requireTestCreator(id);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      return NextResponse.json(
        { error: t("Api.prerequisites.unauthorized") },
        { status: 401 },
      );
    }
    if (auth.reason === "not_found") {
      return NextResponse.json(
        { error: t("Api.prerequisites.notFound") },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: t("Api.prerequisites.forbidden") },
      { status: 403 },
    );
  }

  const [prerequisites, availableTests] = await Promise.all([
    prisma.testPrerequisite.findMany({
      where: { testId: id },
      include: {
        prerequisiteTest: { select: { id: true, title: true } },
      },
      orderBy: { id: "asc" },
    }),
    prisma.test.findMany({
      where: {
        creatorId: auth.session.user.id,
        id: { not: id },
        prerequisites: { none: { testId: id } },
      },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ prerequisites, availableTests });
}

/**
 * POST /api/tests/[id]/prerequisites
 * Adds a prerequisite test to the test (test owner only).
 * Returns the newly created prerequisite record with test details.
 *
 * @param req - The Next.js request with JSON body { prerequisiteTestId, minScoreRequired }
 * @param params - URL parameters { id: testId }
 * @returns 200 with created prerequisite, or 400/401/403/404 on error
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const t = await getTranslations();

  const auth = await requireTestCreator(id);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      return NextResponse.json(
        { error: t("Api.prerequisites.unauthorized") },
        { status: 401 },
      );
    }
    if (auth.reason === "not_found") {
      return NextResponse.json(
        { error: t("Api.prerequisites.notFound") },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: t("Api.prerequisites.forbidden") },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: t("Api.prerequisites.createFailed") },
      { status: 400 },
    );
  }

  const schema = createTestPrerequisiteSchema((key) => t(key));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          t("Api.prerequisites.createFailed"),
      },
      { status: 422 },
    );
  }

  const { prerequisiteTestId, minScoreRequired } = parsed.data;

  // Guard: cannot add itself as its own prerequisite
  if (prerequisiteTestId === id) {
    return NextResponse.json(
      { error: t("Api.prerequisites.selfPrerequisite") },
      { status: 422 },
    );
  }

  // Guard: prerequisite test must exist (and be owned by the same creator)
  const prereqTest = await prisma.test.findFirst({
    where: { id: prerequisiteTestId, creatorId: auth.session.user.id },
    select: { id: true },
  });

  if (!prereqTest) {
    return NextResponse.json(
      { error: t("Api.prerequisites.prereqTestNotFound") },
      { status: 404 },
    );
  }

  // Guard: avoid duplicates
  const existing = await prisma.testPrerequisite.findUnique({
    where: { testId_prerequisiteTestId: { testId: id, prerequisiteTestId } },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: t("Api.prerequisites.alreadyAdded") },
      { status: 409 },
    );
  }

  const created = await prisma.testPrerequisite.create({
    data: { testId: id, prerequisiteTestId, minScoreRequired },
    include: {
      prerequisiteTest: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(created, { status: 201 });
}
