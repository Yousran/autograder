import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  createEssayGradingModelSchema,
  essayGradingModelResponseSchema,
  essayGradingModelsListResponseSchema,
} from "@/lib/schemas/essay-grading-model";

/**
 * GET /api/essay-grading-model
 * Lists all essay grading models for the authenticated user, or retrieves a specific model by id.
 * If `id` query parameter is provided, returns a single model.
 * Otherwise, returns a list of all models with their configurations.
 *
 * @param req - The Next.js request (optional query param: `id`)
 * @returns 200 with essay grading model(s), 404 if specific model not found, or 401 if unauthorized
 */
export async function GET(req: NextRequest) {
  const t = await getTranslations();

  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { session } = authResult;
  const { searchParams } = req.nextUrl;
  const modelId = searchParams.get("id");

  try {
    // If searching for a specific model by id
    if (modelId) {
      const model = await prisma.essayGradingModel.findUnique({
        where: { id: modelId },
      });

      if (!model) {
        return NextResponse.json(
          { error: t("Api.essayGradingModel.notFound") },
          { status: 404 },
        );
      }

      // Ensure user owns this model
      if (model.userId !== session.user.id) {
        return NextResponse.json(
          { error: t("Api.essayGradingModel.forbidden") },
          { status: 403 },
        );
      }

      return NextResponse.json(essayGradingModelResponseSchema.parse(model));
    }

    // Return all models for the user
    const models = await prisma.essayGradingModel.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const parsedModels = models.map((model) =>
      essayGradingModelResponseSchema.parse(model),
    );

    return NextResponse.json(
      essayGradingModelsListResponseSchema.parse({
        models: parsedModels,
      }),
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: t("Api.essayGradingModel.fetchFailed") },
      { status: 500 },
    );
  }
}

/**
 * POST /api/essay-grading-model
 * Creates a new essay grading model for the authenticated user.
 * Validates the request body against the create schema.
 *
 * @param req - The Next.js request with JSON body
 * @returns 201 with created essay grading model, or 400/401/422/500 on error
 */
export async function POST(req: NextRequest) {
  const t = await getTranslations();

  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { session } = authResult;

  // Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: t("Validation.invalidJson") },
      { status: 400 },
    );
  }

  const schema = createEssayGradingModelSchema((key) => t(key));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          t("Api.essayGradingModel.createFailed"),
      },
      { status: 422 },
    );
  }

  const data = parsed.data;

  try {
    const created = await prisma.essayGradingModel.create({
      data: {
        userId: session.user.id,
        name: data.name,
        baseUrl: data.baseUrl,
        model: data.model,
        apiKey: data.apiKey || null,
        isDefault: data.isDefault,
      },
    });

    return NextResponse.json(essayGradingModelResponseSchema.parse(created), {
      status: 201,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: t("Api.essayGradingModel.createFailed") },
      { status: 500 },
    );
  }
}
