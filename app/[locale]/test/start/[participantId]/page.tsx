import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { TestTaker } from "./components/test-taker";

export default async function StartTestPage({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const { participantId } = await params;
  const locale = await getLocale();
  const t = await getTranslations("Pages.testStart");

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: {
      id: true,
      name: true,
      isCompleted: true,
      createdAt: true,
      test: {
        select: {
          title: true,
          testDuration: true,
          isQuestionsOrdered: true,
          questions: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              questionText: true,
              type: true,
              order: true,
              essay: { select: { id: true, maxScore: true } },
              choice: {
                select: {
                  id: true,
                  isChoiceRandomized: true,
                  maxScore: true,
                  choices: { select: { id: true, choiceText: true } },
                },
              },
              multipleSelect: {
                select: {
                  id: true,
                  isChoiceRandomized: true,
                  maxScore: true,
                  multipleSelectChoices: {
                    select: { id: true, choiceText: true },
                  },
                },
              },
            },
          },
        },
      },
      essayAnswers: { select: { questionId: true, answerText: true } },
      choiceAnswers: { select: { questionId: true, selectedChoiceId: true } },
      multipleSelectAnswers: {
        select: {
          questionId: true,
          selectedChoices: { select: { id: true } },
        },
      },
    },
  });

  if (!participant) notFound();

  if (participant.isCompleted) {
    redirect({
      href: `/test/result/${participantId}`,
      locale,
    });
  }

  const initialEssayAnswers: Record<string, string> = Object.fromEntries(
    participant.essayAnswers.map((a) => [a.questionId, a.answerText]),
  );

  const initialChoiceAnswers: Record<string, string | null> =
    Object.fromEntries(
      participant.choiceAnswers.map((a) => [a.questionId, a.selectedChoiceId]),
    );

  const initialMultipleSelectAnswers: Record<string, string[]> =
    Object.fromEntries(
      participant.multipleSelectAnswers.map((a) => [
        a.questionId,
        a.selectedChoices.map((c) => c.id),
      ]),
    );

  return (
    <TestTaker
      participantId={participant.id}
      testTitle={participant.test.title}
      testDuration={participant.test.testDuration}
      participantCreatedAt={participant.createdAt.toISOString()}
      questions={participant.test.questions}
      isQuestionsOrdered={participant.test.isQuestionsOrdered}
      initialEssayAnswers={initialEssayAnswers}
      initialChoiceAnswers={initialChoiceAnswers}
      initialMultipleSelectAnswers={initialMultipleSelectAnswers}
      noQuestionsLabel={t("noQuestions")}
    />
  );
}
