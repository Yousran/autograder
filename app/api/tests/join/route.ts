import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/dal";
import { createJoinTestSchema } from "@/lib/schemas/participant";

export interface JoinStatusResponse {
  isAcceptingResponses: boolean;
  participantCount: number;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const joinCode = searchParams.get("joinCode");

  if (!joinCode) {
    return NextResponse.json(
      { error: "joinCode is required" },
      { status: 400 },
    );
  }

  const test = await prisma.test.findUnique({
    where: { joinCode },
    select: {
      isAcceptingResponses: true,
      _count: { select: { participants: true } },
    },
  });

  if (!test) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json<JoinStatusResponse>({
    isAcceptingResponses: test.isAcceptingResponses,
    participantCount: test._count.participants,
  });
}

export async function POST(req: NextRequest) {
  const locale = await getLocale();
  const [tJoin, tValidation] = await Promise.all([
    getTranslations({ locale, namespace: "Api.join" }),
    getTranslations({ locale, namespace: "Validation" }),
  ]);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: tJoin("joinFailed") }, { status: 400 });
  }

  const schema = createJoinTestSchema((key) => tValidation(key));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? tJoin("joinFailed") },
      { status: 422 },
    );
  }

  const { name, joinCode } = parsed.data;

  const test = await prisma.test.findUnique({
    where: { joinCode },
    select: {
      id: true,
      isAcceptingResponses: true,
      isLoggedInUserOnly: true,
      joinCodeExpiresAt: true,
    },
  });

  if (!test) {
    return NextResponse.json({ error: tJoin("notFound") }, { status: 404 });
  }

  if (!test.isAcceptingResponses) {
    return NextResponse.json({ error: tJoin("notAccepting") }, { status: 403 });
  }

  const session = await getSession();

  if (test.isLoggedInUserOnly && !session) {
    return NextResponse.json({ error: tJoin("loggedInOnly") }, { status: 401 });
  }

  if (test.joinCodeExpiresAt && test.joinCodeExpiresAt < new Date()) {
    return NextResponse.json({ error: tJoin("notFound") }, { status: 404 });
  }

  const participant = await prisma.participant.create({
    data: {
      testId: test.id,
      userId: session?.user.id ?? null,
      name,
    },
    select: { id: true },
  });

  return NextResponse.json(
    { participantId: participant.id, testId: test.id },
    { status: 201 },
  );
}
