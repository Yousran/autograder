import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/dal";
import { JoinTestClient } from "@/components/custom/join-test-client";
import Navbar from "@/components/custom/navbar";

interface PageProps {
  params: Promise<{ joinCode: string; locale: string }>;
}

export default async function JoinTestPage({ params }: PageProps) {
  const { joinCode } = await params;
  const t = await getTranslations("Pages.join");

  const test = await prisma.test.findUnique({
    where: { joinCode },
    select: {
      id: true,
      title: true,
      description: true,
      testDuration: true,
      isAcceptingResponses: true,
      isLoggedInUserOnly: true,
      joinCodeExpiresAt: true,
      joinCode: true,
      prerequisites: {
        select: {
          prerequisiteTestId: true,
          minScoreRequired: true,
        },
      },
      _count: {
        select: {
          questions: true,
          participants: true,
        },
      },
    },
  });

  if (!test || !test.joinCode) {
    notFound();
  }

  const isExpired =
    test.joinCodeExpiresAt !== null && test.joinCodeExpiresAt < new Date();

  if (isExpired) {
    notFound();
  }

  const session = await getSession();
  const isLoggedIn = !!session;

  // Check prerequisites for authenticated users
  let prerequisiteError: string | null = null;
  if (test.prerequisites.length > 0 && isLoggedIn) {
    const prereqTestIds = test.prerequisites.map((p) => p.prerequisiteTestId);

    const prereqChecks = await prisma.participant.findMany({
      where: {
        testId: { in: prereqTestIds },
        isCompleted: true,
        userId: session.user.id,
      },
      select: { testId: true, score: true },
    });

    // Check if all prerequisites are completed
    const completedPrereqIds = new Set(prereqChecks.map((p) => p.testId));
    const allCompleted = test.prerequisites.every((prereq) =>
      completedPrereqIds.has(prereq.prerequisiteTestId),
    );

    if (!allCompleted) {
      prerequisiteError = t("prerequisiteNotMet");
    } else {
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
        prerequisiteError = t("prerequisiteInsufficientScore");
      }
    }
  }

  const testInfo = {
    id: test.id,
    title: test.title,
    description: test.description,
    testDuration: test.testDuration,
    questionCount: test._count.questions,
    participantCount: test._count.participants,
    isAcceptingResponses: test.isAcceptingResponses,
    isLoggedInUserOnly: test.isLoggedInUserOnly,
    joinCode: test.joinCode,
    prerequisiteError,
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <JoinTestClient
          testInfo={testInfo}
          userName={session?.user.name ?? null}
          isLoggedIn={isLoggedIn}
        />
      </main>
    </div>
  );
}
