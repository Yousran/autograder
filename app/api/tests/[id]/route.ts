import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireTestCreator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { patchTestSchema, TestSchema } from "@/lib/schemas/test";

/**
 * GET /api/tests/[id]
 * Retrieves a single test by ID (public endpoint, no auth required).
 * Returns the full test object if found.
 *
 * @param req - The Next.js request
 * @param params - URL parameters { id: testId }
 * @returns 200 with TestSchema if found, 404 if not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const t = await getTranslations();

  const test = await prisma.test.findUnique({
    where: { id },
  });

  if (!test) {
    return NextResponse.json(
      { error: t("Api.tests.notFound") },
      { status: 404 },
    );
  }
  return NextResponse.json(TestSchema.parse(test));
}

/**
 * PATCH /api/tests/[id]
 * Updates a test (admin/owner only).
 * Requires the user to be authenticated and own the test.
 * Validates the update payload against the test patch schema.
 *
 * @param req - The Next.js request with JSON body
 * @param params - URL parameters { id: testId }
 * @returns 200 with updated TestSchema, or 400/401/403/404 on error
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const t = await getTranslations();

  // Auth + ownership check
  const auth = await requireTestCreator(id);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      return NextResponse.json(
        { error: t("Api.tests.unauthorized") },
        { status: 401 },
      );
    }
    if (auth.reason === "not_found") {
      return NextResponse.json(
        { error: t("Api.tests.notFound") },
        { status: 404 },
      );
    }
    // forbidden
    return NextResponse.json(
      { error: t("Api.tests.forbidden") },
      { status: 403 },
    );
  }

  // Parse + validate body (partial — only provided fields are updated)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: t("Api.tests.updateFailed") },
      { status: 400 },
    );
  }

  const schema = patchTestSchema((key) => t(key));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? t("Api.tests.updateFailed") },
      { status: 422 },
    );
  }

  const data = parsed.data;

  const updated = await prisma.test.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}
