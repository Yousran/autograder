import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/dal";
import { createJoinTestSchema } from "@/lib/schemas/participant";
import { JoinStatusResponse } from "@/lib/schemas/test";

/**
 * GET /api/tests/join
 * Checks if a test (by join code) is accepting responses without joining.
 * Returns test status: accepting responses flag and participant count.
 *
 * @param req - The Next.js request with query param `joinCode`
 * @returns 200 with JoinStatusResponse, or 400/404 on error
 */
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

/**
 * POST /api/tests/join
 * Joins a test with a join code and participant name.
 * Creates a participant record (authenticated users are auto-associated).
 * Returns the created participant record.
 *
 * @param req - The Next.js request with JSON body { name, joinCode }
 * @returns 200 with participant data, or 400/404/422 on error
 */
export async function POST(req: NextRequest) {
  const t = await getTranslations();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: t("Api.join.joinFailed") },
      { status: 400 },
    );
  }

  const schema = createJoinTestSchema((key) => t("Validation." + key));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? t("Api.join.joinFailed") },
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
    return NextResponse.json(
      { error: t("Api.join.notFound") },
      { status: 404 },
    );
  }

  if (!test.isAcceptingResponses) {
    return NextResponse.json(
      { error: t("Api.join.notAccepting") },
      { status: 403 },
    );
  }

  const session = await getSession();

  if (test.isLoggedInUserOnly && !session) {
    return NextResponse.json(
      { error: t("Api.join.loggedInOnly") },
      { status: 401 },
    );
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
        { error: t("Api.join.prerequisiteNotMet") },
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
        { error: t("Api.join.prerequisiteInsufficientScore") },
        { status: 403 },
      );
    }
  }

  if (test.joinCodeExpiresAt && test.joinCodeExpiresAt < new Date()) {
    return NextResponse.json(
      { error: t("Api.join.notFound") },
      { status: 404 },
    );
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
        { error: t("Api.join.maxAttemptsReached") },
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
