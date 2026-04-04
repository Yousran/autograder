import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  updateEssayGradingModelSchema,
  essayGradingModelResponseSchema,
} from "@/lib/schemas/essay-grading-model";
import * as Iron from "iron-webcrypto";

/**
 * PATCH /api/essay-grading-model/[id]
 * Updates an essay grading model (owner only).
 * Requires the user to be authenticated and own the model.
 * Validates the update payload against the update schema (all fields optional).
 *
 * @param req - The Next.js request with JSON body
 * @param params - URL parameters { id: modelId }
 * @returns 200 with updated essay grading model, or 400/401/403/404/422/500 on error
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const t = await getTranslations();

  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { session } = authResult;

  // Check if model exists and user owns it
  const model = await prisma.essayGradingModel.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!model) {
    return NextResponse.json(
      { error: t("Api.essayGradingModel.notFound") },
      { status: 404 },
    );
  }

  if (model.userId !== session.user.id) {
    return NextResponse.json(
      { error: t("Api.essayGradingModel.forbidden") },
      { status: 403 },
    );
  }

  // Parse + validate body (partial — only provided fields are updated)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: t("Validation.invalidJson") },
      { status: 400 },
    );
  }

  const schema = updateEssayGradingModelSchema((key) => t(key));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          t("Api.essayGradingModel.updateFailed"),
      },
      { status: 422 },
    );
  }

  const data = parsed.data;

  let encryptedApiKey = null;
  if (data.apiKey) {
    encryptedApiKey = (await Iron.seal(
      data.apiKey,
      process.env.BETTER_AUTH_SECRET!,
      Iron.defaults,
    )) as string;
  }

  try {
    const updated = await prisma.essayGradingModel.update({
      where: { id },
      data: {
        name: data.name,
        baseUrl: data.baseUrl,
        model: data.model,
        apiKey: encryptedApiKey,
        isDefault: data.isDefault,
      },
    });

    return NextResponse.json(essayGradingModelResponseSchema.parse(updated));
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: t("Api.essayGradingModel.updateFailed") },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/essay-grading-model/[id]
 * Deletes an essay grading model (owner only).
 * Requires the user to be authenticated and own the model.
 * Cascading deletes any associated tests that reference this model.
 *
 * @param req - Not used
 * @param params - URL parameters { id: modelId }
 * @returns 200 with { success: true }, or 401/403/404/500 on error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const t = await getTranslations();

  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { session } = authResult;

  // Check if model exists and user owns it
  const model = await prisma.essayGradingModel.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!model) {
    return NextResponse.json(
      { error: t("Api.essayGradingModel.notFound") },
      { status: 404 },
    );
  }

  if (model.userId !== session.user.id) {
    return NextResponse.json(
      { error: t("Api.essayGradingModel.forbidden") },
      { status: 403 },
    );
  }

  try {
    await prisma.essayGradingModel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: t("Api.essayGradingModel.deleteFailed") },
      { status: 500 },
    );
  }
}
