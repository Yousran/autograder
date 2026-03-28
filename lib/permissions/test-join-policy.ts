import { prisma } from "@/lib/prisma";

export interface TestJoinPolicyContext {
  userId: string | null;
  participantName: string;
  session: {
    user: {
      id: string;
    };
  } | null;
}

export interface TestJoinData {
  id: string;
  isAcceptingResponses: boolean;
  isLoggedInUserOnly: boolean;
  joinCodeExpiresAt: Date | null;
  maxAttempts: number | null;
  prerequisites: Array<{
    prerequisiteTestId: string;
    minScoreRequired: number;
  }>;
}

export const TestJoinPolicy = {
  /**
   * ABAC Rule: Checks if the test is currently accepting responses
   */
  isAcceptingResponses: (test: { isAcceptingResponses: boolean }) => {
    return test.isAcceptingResponses;
  },

  /**
   * ABAC Rule: Checks if the test requires a logged-in user and enforces it
   */
  meetsAuthRequirement: (
    test: { isLoggedInUserOnly: boolean },
    context: TestJoinPolicyContext,
  ) => {
    if (test.isLoggedInUserOnly && !context.session) {
      return false;
    }
    return true;
  },

  /**
   * ABAC Rule: Checks if the join code has not expired
   */
  isJoinCodeValid: (test: { joinCodeExpiresAt: Date | null }) => {
    if (test.joinCodeExpiresAt && test.joinCodeExpiresAt < new Date()) {
      return false;
    }
    return true;
  },

  /**
   * Prerequisite Rule: Checks if the participant has met all prerequisite tests
   * with the required minimum score, matching by userId for logged-in users
   * or by participant name for guests.
   */
  meetsPrerequisites: async (
    test: {
      prerequisites: Array<{
        prerequisiteTestId: string;
        minScoreRequired: number;
      }>;
    },
    context: TestJoinPolicyContext,
  ) => {
    if (test.prerequisites.length === 0) {
      return true;
    }

    const prereqTestIds = test.prerequisites.map((p) => p.prerequisiteTestId);

    const prereqChecks = await prisma.participant.findMany({
      where: {
        testId: { in: prereqTestIds },
        isCompleted: true,
        ...(context.session
          ? { userId: context.session.user.id }
          : { name: context.participantName }),
      },
      select: { testId: true, score: true },
    });

    return test.prerequisites.every((prereq) => {
      const best = prereqChecks
        .filter((p) => p.testId === prereq.prerequisiteTestId)
        .reduce<
          number | null
        >((max, p) => (max === null || p.score > max ? p.score : max), null);
      return best !== null && best >= prereq.minScoreRequired;
    });
  },

  /**
   * Attribute Rule: Checks if the participant still has attempts remaining
   * for the test, matching by userId for logged-in users or by name for guests.
   */
  hasAttemptsRemaining: async (
    test: { id: string; maxAttempts: number | null },
    context: TestJoinPolicyContext,
  ) => {
    if (test.maxAttempts === null) {
      return true;
    }

    const attemptCount = await prisma.participant.count({
      where: {
        testId: test.id,
        ...(context.session
          ? { userId: context.session.user.id }
          : { name: context.participantName }),
      },
    });

    return attemptCount < test.maxAttempts;
  },
};
