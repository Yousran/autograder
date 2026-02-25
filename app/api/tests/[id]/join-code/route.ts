import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { getLocale, getTranslations } from "next-intl/server";
import { requireTestCreator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

// Human-readable alphabet: no 0/O/1/I to avoid confusion
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

const TTL_DAYS = 7;
const MAX_RETRIES = 5;

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Api.joinCode" });

  const auth = await requireTestCreator(id);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated")
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    if (auth.reason === "not_found")
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();

  // Retry loop: handle collisions where another test still has the same active code
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = nanoid();

    const conflict = await prisma.test.findFirst({
      where: {
        joinCode: code,
        id: { not: id },
        OR: [{ joinCodeExpiresAt: null }, { joinCodeExpiresAt: { gt: now } }],
      },
      select: { id: true },
    });

    if (conflict) continue;

    const updated = await prisma.test.update({
      where: { id },
      data: { joinCode: code, joinCodeExpiresAt: expiresAt },
      select: { joinCode: true, joinCodeExpiresAt: true },
    });

    return NextResponse.json(updated, { status: 200 });
  }

  return NextResponse.json({ error: t("generateFailed") }, { status: 500 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Api.joinCode" });

  const auth = await requireTestCreator(id);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated")
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    if (auth.reason === "not_found")
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  await prisma.test.update({
    where: { id },
    data: { joinCode: null, joinCodeExpiresAt: null },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
