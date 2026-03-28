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
      maxAttempts: true,
      testDuration: true,
      prerequisites: {
        select: {
          prerequisiteTestId: true,
          minScoreRequired: true,
        },
      },
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

  // Check prerequisites: logged-in users are matched by userId,
  // guests are matched by the name they are submitting.
  if (test.prerequisites.length > 0) {
    const prereqTestIds = test.prerequisites.map((p) => p.prerequisiteTestId);

    const prereqChecks = await prisma.participant.findMany({
      where: {
        testId: { in: prereqTestIds },
        isCompleted: true,
        ...(session ? { userId: session.user.id } : { name }),
      },
      select: { testId: true, score: true },
    });

    // Check if all prerequisites are completed
    const completedPrereqIds = new Set(prereqChecks.map((p) => p.testId));
    const allCompleted = test.prerequisites.every((prereq) =>
      completedPrereqIds.has(prereq.prerequisiteTestId),
    );

    if (!allCompleted) {
      return NextResponse.json(
        { error: tJoin("prerequisiteNotMet") },
        { status: 403 },
      );
    }

    // Check if all prerequisites meet the minimum score requirement
    const meetsAll = test.prerequisites.every((prereq) => {
      const best = prereqChecks
        .filter((p) => p.testId === prereq.prerequisiteTestId)
        .reduce<
          number | null
        >((max, p) => (max === null || p.score > max ? p.score : max), null);
      return best !== null && best >= prereq.minScoreRequired;
    });

    if (!meetsAll) {
      return NextResponse.json(
        { error: tJoin("prerequisiteInsufficientScore") },
        { status: 403 },
      );
    }
  }

  if (test.joinCodeExpiresAt && test.joinCodeExpiresAt < new Date()) {
    return NextResponse.json({ error: tJoin("notFound") }, { status: 404 });
  }

  // Check if participant already has an ongoing session (incomplete) within duration
  const existingParticipant = await prisma.participant.findFirst({
    where: {
      testId: test.id,
      isCompleted: false,
      ...(session ? { userId: session.user.id } : { name }),
    },
    select: { id: true, createdAt: true },
  });

  if (existingParticipant) {
    // Check if still within test duration
    if (test.testDuration) {
      const durationMs = test.testDuration * 60 * 1000; // Convert minutes to ms
      const elapsedMs =
        new Date().getTime() - existingParticipant.createdAt.getTime();

      // If still within duration, return existing participant
      if (elapsedMs < durationMs) {
        return NextResponse.json(
          { participantId: existingParticipant.id, testId: test.id },
          { status: 200 },
        );
      }
    } else {
      // No duration limit, always return existing participant
      return NextResponse.json(
        { participantId: existingParticipant.id, testId: test.id },
        { status: 200 },
      );
    }
  }

  // Check max attempts: count existing participant records for this identity.
  if (test.maxAttempts !== null) {
    const attemptCount = await prisma.participant.count({
      where: {
        testId: test.id,
        ...(session ? { userId: session.user.id } : { name }),
      },
    });

    if (attemptCount >= test.maxAttempts) {
      return NextResponse.json(
        { error: tJoin("maxAttemptsReached") },
        { status: 403 },
      );
    }
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
