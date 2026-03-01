import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Api.profile" });
  try {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;

    const session = authResult.session;
    const { id } = await params;

    if (session.user.id !== id) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const image = body?.image as string | undefined;
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: t("invalidImage") }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { image },
      select: { id: true, image: true },
    });

    return NextResponse.json({ id: user.id, image: user.image });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Api.profile" });
  try {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;

    const session = authResult.session;
    const { id } = await params;

    if (session.user.id !== id) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
