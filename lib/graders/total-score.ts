import { prisma } from "@/lib/prisma";

/**
 * Recalculates and updates the total score for a participant.
 * Aggregates scores from all three answer types: essay, choice, and multiple-select.
 * Converts the total to a percentage based on the maximum possible score from all test questions.
 * Called after manual score overrides to keep totals in sync.
 *
 * @param participantId - The ID of the participant to recalculate
 * @returns Promise that resolves once the participant score is updated with percentage value
 */
export async function recalculateParticipantScore(participantId: string) {
  const [essayTotal, choiceTotal, msTotal, participant] = await Promise.all([
    prisma.essayAnswer.aggregate({
      where: { participantId },
      _sum: { score: true },
    }),
    prisma.choiceAnswer.aggregate({
      where: { participantId },
      _sum: { score: true },
    }),
    prisma.multipleSelectAnswer.aggregate({
      where: { participantId },
      _sum: { score: true },
    }),
    prisma.participant.findUnique({
      where: { id: participantId },
      select: { testId: true },
    }),
  ]);

  if (!participant) {
    throw new Error(`Participant with id ${participantId} not found`);
  }

  const totalScore =
    (essayTotal._sum.score ?? 0) +
    (choiceTotal._sum.score ?? 0) +
    (msTotal._sum.score ?? 0);

  // Get all questions and their max scores for this test
  const questions = await prisma.question.findMany({
    where: { testId: participant.testId },
    select: {
      essay: { select: { maxScore: true } },
      choice: { select: { maxScore: true } },
      multipleSelect: { select: { maxScore: true } },
    },
  });

  // Calculate total max possible score
  const maxScore = questions.reduce((sum, q) => {
    return (
      sum +
      (q.essay?.maxScore ?? 0) +
      (q.choice?.maxScore ?? 0) +
      (q.multipleSelect?.maxScore ?? 0)
    );
  }, 0);

  // Convert to percentage
  const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  await prisma.participant.update({
    where: { id: participantId },
    data: { score: scorePercentage },
  });
}
