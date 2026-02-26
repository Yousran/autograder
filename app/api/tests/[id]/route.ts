import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { requireTestCreator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { patchTestSchema } from "@/lib/schemas/test";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const locale = await getLocale();

  const [tTests, tValidation] = await Promise.all([
    getTranslations({ locale, namespace: "Api.tests" }),
    getTranslations({ locale, namespace: "Validation" }),
  ]);

  // Auth + ownership check
  const auth = await requireTestCreator(id);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      return NextResponse.json(
        { error: tTests("unauthorized") },
        { status: 401 },
      );
    }
    if (auth.reason === "not_found") {
      return NextResponse.json({ error: tTests("notFound") }, { status: 404 });
    }
    // forbidden
    return NextResponse.json({ error: tTests("forbidden") }, { status: 403 });
  }

  // Parse + validate body (partial — only provided fields are updated)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: tTests("updateFailed") },
      { status: 400 },
    );
  }

  const schema = patchTestSchema((key) => tValidation(key));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? tTests("updateFailed") },
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
