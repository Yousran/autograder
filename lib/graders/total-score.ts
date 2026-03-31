import { prisma } from "@/lib/prisma";

/**
 * Recalculates and updates the total score for a participant.
 * Aggregates scores from all three answer types: essay, choice, and multiple-select.
 * Called after manual score overrides to keep totals in sync.
 *
 * @param participantId - The ID of the participant to recalculate
 * @returns Promise that resolves once the participant score is updated
 */
export async function recalculateParticipantScore(participantId: string) {
  const [essayTotal, choiceTotal, msTotal] = await Promise.all([
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
  ]);
  const totalScore =
    (essayTotal._sum.score ?? 0) +
    (choiceTotal._sum.score ?? 0) +
    (msTotal._sum.score ?? 0);
  await prisma.participant.update({
    where: { id: participantId },
    data: { score: totalScore },
  });
}
