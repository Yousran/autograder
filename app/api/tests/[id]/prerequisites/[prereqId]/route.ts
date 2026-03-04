import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { requireTestCreator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { updateTestPrerequisiteSchema } from "@/lib/schemas/prerequisite";

interface Params {
  params: Promise<{ id: string; prereqId: string }>;
}

/** PATCH /api/tests/[id]/prerequisites/[prereqId]
 * Updates the minScoreRequired for a prerequisite.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, prereqId } = await params;
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
    return NextResponse.json({ error: t("updateFailed") }, { status: 400 });
  }

  const schema = updateTestPrerequisiteSchema((key) => tValidation(key));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? t("updateFailed") },
      { status: 422 },
    );
  }

  const record = await prisma.testPrerequisite.findFirst({
    where: { id: prereqId, testId: id },
    select: { id: true },
  });

  if (!record) {
    return NextResponse.json({ error: t("prereqNotFound") }, { status: 404 });
  }

  const updated = await prisma.testPrerequisite.update({
    where: { id: prereqId },
    data: parsed.data,
    include: {
      prerequisiteTest: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(updated);
}

/** DELETE /api/tests/[id]/prerequisites/[prereqId]
 * Removes a prerequisite from the test.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, prereqId } = await params;
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

  const record = await prisma.testPrerequisite.findFirst({
    where: { id: prereqId, testId: id },
    select: { id: true },
  });

  if (!record) {
    return NextResponse.json({ error: t("prereqNotFound") }, { status: 404 });
  }

  await prisma.testPrerequisite.delete({ where: { id: prereqId } });

  return new NextResponse(null, { status: 204 });
}
