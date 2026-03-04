import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { requireTestCreator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { createTestPrerequisiteSchema } from "@/lib/schemas/prerequisite";

interface Params {
  params: Promise<{ id: string }>;
}

/** GET /api/tests/[id]/prerequisites
 * Returns the prerequisites for the test along with available tests
 * (other tests created by the same user) that can be added as prerequisites.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Api.prerequisites" });

  const auth = await requireTestCreator(id);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }
    if (auth.reason === "not_found") {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
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

/** POST /api/tests/[id]/prerequisites
 * Adds a prerequisite to the test.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const locale = await getLocale();

  const [t, tValidation] = await Promise.all([
    getTranslations({ locale, namespace: "Api.prerequisites" }),
    getTranslations({ locale, namespace: "Validation" }),
  ]);

  const auth = await requireTestCreator(id);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }
    if (auth.reason === "not_found") {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: t("createFailed") }, { status: 400 });
  }

  const schema = createTestPrerequisiteSchema((key) => tValidation(key));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? t("createFailed") },
      { status: 422 },
    );
  }

  const { prerequisiteTestId, minScoreRequired } = parsed.data;

  // Guard: cannot add itself as its own prerequisite
  if (prerequisiteTestId === id) {
    return NextResponse.json({ error: t("selfPrerequisite") }, { status: 422 });
  }

  // Guard: prerequisite test must exist (and be owned by the same creator)
  const prereqTest = await prisma.test.findFirst({
    where: { id: prerequisiteTestId, creatorId: auth.session.user.id },
    select: { id: true },
  });

  if (!prereqTest) {
    return NextResponse.json(
      { error: t("prereqTestNotFound") },
      { status: 404 },
    );
  }

  // Guard: avoid duplicates
  const existing = await prisma.testPrerequisite.findUnique({
    where: { testId_prerequisiteTestId: { testId: id, prerequisiteTestId } },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ error: t("alreadyAdded") }, { status: 409 });
  }

  const created = await prisma.testPrerequisite.create({
    data: { testId: id, prerequisiteTestId, minScoreRequired },
    include: {
      prerequisiteTest: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(created, { status: 201 });
}
