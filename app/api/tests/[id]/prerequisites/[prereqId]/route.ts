import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { requireTestCreator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { updateTestPrerequisiteSchema } from "@/lib/schemas/prerequisite";

/**
 * Loads and returns translation functions for the Prerequisites API and Validation namespaces.
 * Helper for async imports in route handlers.
 *
 * @returns Promise with tuple of [tPrerequisites, tValidation] translation functions
 */
async function getT() {
  const locale = await getLocale();
  return Promise.all([
    getTranslations({ locale, namespace: "Api.prerequisites" }),
    getTranslations({ locale, namespace: "Validation" }),
  ]);
}

/**
 * PATCH /api/tests/[id]/prerequisites/[prereqId]
 * Updates the minScoreRequired for a prerequisite (test owner only).
 * Test owner can adjust the minimum score participants need to pass the prerequisite.
 *
 * @param req - The Next.js request with JSON body { minScoreRequired: number }
 * @param params - URL parameters { id: testId, prereqId: prerequisiteId }
 * @returns 200 with updated prerequisite, or 400/401/403/404/422 on error
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; prereqId: string }> },
) {
  const { id, prereqId } = await params;

  const [tPrerequisites, tValidation] = await getT();

  const auth = await requireTestCreator(id);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      return NextResponse.json(
        { error: tPrerequisites("unauthorized") },
        { status: 401 },
      );
    }
    if (auth.reason === "not_found") {
      return NextResponse.json(
        { error: tPrerequisites("notFound") },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: tPrerequisites("forbidden") },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: tPrerequisites("updateFailed") },
      { status: 400 },
    );
  }

  const schema = updateTestPrerequisiteSchema((key) => tValidation(key));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? tPrerequisites("updateFailed"),
      },
      { status: 422 },
    );
  }

  const record = await prisma.testPrerequisite.findFirst({
    where: { id: prereqId, testId: id },
    select: { id: true },
  });

  if (!record) {
    return NextResponse.json(
      { error: tPrerequisites("prereqNotFound") },
      { status: 404 },
    );
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

/**
 * DELETE /api/tests/[id]/prerequisites/[prereqId]
 * Removes a prerequisite from a test (test owner only).
 * Participants will no longer be checked against this prerequisite.
 *
 * @param req - Not used
 * @param params - URL parameters { id: testId, prereqId: prerequisiteId }
 * @returns 204 No Content on success, or 401/403/404 on error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; prereqId: string }> },
) {
  const { id, prereqId } = await params;
  const [tPrerequisites] = await getT();

  const auth = await requireTestCreator(id);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      return NextResponse.json(
        { error: tPrerequisites("unauthorized") },
        { status: 401 },
      );
    }
    if (auth.reason === "not_found") {
      return NextResponse.json(
        { error: tPrerequisites("notFound") },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: tPrerequisites("forbidden") },
      { status: 403 },
    );
  }

  const record = await prisma.testPrerequisite.findFirst({
    where: { id: prereqId, testId: id },
    select: { id: true },
  });

  if (!record) {
    return NextResponse.json(
      { error: tPrerequisites("prereqNotFound") },
      { status: 404 },
    );
  }

  await prisma.testPrerequisite.delete({ where: { id: prereqId } });

  return new NextResponse(null, { status: 204 });
}
