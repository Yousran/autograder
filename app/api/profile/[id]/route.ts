import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/profile/[id]
 * Updates the user's profile image (authenticated user only).
 * The user can only update their own profile (id must match session.user.id).
 *
 * @param req - The Next.js request with JSON body { image: string }
 * @param params - URL parameters { id: userId }
 * @returns 200 with updated profile { id, image }, or 400/401/403/500 on error
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const t = await getTranslations();
  try {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;

    const session = authResult.session;
    const { id } = await params;

    if (session.user.id !== id) {
      return NextResponse.json(
        { error: t("Api.profile.forbidden") },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const image = body?.image as string | undefined;
    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: t("Api.profile.invalidImage") },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { image },
      select: { id: true, image: true },
    });

    return NextResponse.json({ id: user.id, image: user.image });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: t("Api.profile.serverError") },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/profile/[id]
 * Deletes the user's account permanently (authenticated user only).
 * The user can only delete their own account (id must match session.user.id).
 * Also cascades delete of related data (tests, participants, answers, etc.)
 *
 * @param req - Not used
 * @param params - URL parameters { id: userId }
 * @returns 200 with { success: true }, or 401/403/500 on error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const t = await getTranslations();
  try {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;

    const session = authResult.session;
    const { id } = await params;

    if (session.user.id !== id) {
      return NextResponse.json(
        { error: t("Api.profile.forbidden") },
        { status: 403 },
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: t("Api.profile.serverError") },
      { status: 500 },
    );
  }
}
