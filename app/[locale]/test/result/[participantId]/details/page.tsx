import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { QuestionDetailCard } from "@/components/custom/question-detail-card";
import type {
  ChoiceItemView,
  EssayAnswerView,
  ChoiceAnswerView,
  MultipleSelectAnswerView,
} from "@/lib/schemas/answer";

export default async function ParticipantDetailsPage({
  params,
}: {
  params: Promise<{
    participantId: string;
  }>;
}) {
  const { participantId } = await params;
  const t = await getTranslations("Pages.participantDetails");

  // Fetch participant with test settings
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      test: {
        select: {
          id: true,
          title: true,
          isShowDetailedScore: true,
          isShowCorrectAnswers: true,
        },
      },
    },
  });

  if (!participant) {
    notFound();
  }

  const { test } = participant;

  // If detailed score is disabled, just show a notice
  if (!test.isShowDetailedScore) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href={`/test/result/${participantId}`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="size-4" />
              {t("backToResult")}
            </Button>
          </Link>
        </div>
        <Alert>
          <Info className="size-4" />
          <AlertDescription>{t("notAvailable")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch questions ordered, with answers for this participant
  const questions = await prisma.question.findMany({
    where: { testId: test.id },
    orderBy: { order: "asc" },
    include: {
      essay: {
        include: {
          answers: { where: { participantId } },
        },
      },
      choice: {
        include: {
          choices: true,
          answers: { where: { participantId } },
        },
      },
      multipleSelect: {
        include: {
          multipleSelectChoices: true,
          answers: {
            where: { participantId },
            include: { selectedChoices: true },
          },
        },
      },
    },
  });

  // Build card labels
  const labels = {
    essay: t("essay"),
    choice: t("choice"),
    multipleSelect: t("multipleSelect"),
    yourAnswer: t("yourAnswer"),
    correctAnswer: t("correctAnswer"),
    notAnswered: t("notAnswered"),
    score: t("score"),
    scoreExplanation: t("scoreExplanation"),
    correct: t("correct"),
    incorrect: t("incorrect"),
  };

  // Calculate totals
  let totalScore = 0;
  let totalMaxScore = 0;
  for (const q of questions) {
    if (q.essay) {
      totalMaxScore += q.essay.maxScore;
      totalScore += q.essay.answers[0]?.score ?? 0;
    } else if (q.choice) {
      totalMaxScore += q.choice.maxScore;
      totalScore += q.choice.answers[0]?.score ?? 0;
    } else if (q.multipleSelect) {
      totalMaxScore += q.multipleSelect.maxScore;
      totalScore += q.multipleSelect.answers[0]?.score ?? 0;
    }
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href={`/test/result/${participantId}`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="size-4" />
            {t("backToResult")}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{participant.name}</p>
      </div>

      {/* Total score summary */}
      <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {t("totalScore")}
        </span>
        <Badge
          variant="outline"
          className="text-base font-semibold tabular-nums px-3 py-1"
        >
          {totalScore} / {totalMaxScore}
        </Badge>
      </div>

      {/* Question cards */}
      <div className="flex flex-col gap-4">
        {questions.map((question, index) => {
          let essayView: EssayAnswerView | null = null;
          let choiceView: ChoiceAnswerView | null = null;
          let multipleSelectView: MultipleSelectAnswerView | null = null;

          if (question.type === "ESSAY" && question.essay) {
            const answer = question.essay.answers[0];
            essayView = {
              id: answer?.id ?? "",
              answerText: answer?.answerText ?? "",
              correctAnswer: test.isShowCorrectAnswers
                ? question.essay.answerText
                : null,
              score: answer?.score ?? 0,
              maxScore: question.essay.maxScore,
              scoreExplanation: answer?.scoreExplanation ?? null,
            };
          } else if (question.type === "CHOICE" && question.choice) {
            const answer = question.choice.answers[0];
            const selectedId = answer?.selectedChoiceId ?? null;
            const choiceItems: ChoiceItemView[] = question.choice.choices.map(
              (c) => ({
                id: c.id,
                text: c.choiceText,
                isSelected: c.id === selectedId,
                isCorrect: test.isShowCorrectAnswers ? c.isCorrect : null,
              }),
            );
            choiceView = {
              id: answer?.id ?? "",
              choices: choiceItems,
              score: answer?.score ?? 0,
              maxScore: question.choice.maxScore,
            };
          } else if (
            question.type === "MULTIPLE_SELECT" &&
            question.multipleSelect
          ) {
            const answer = question.multipleSelect.answers[0];
            const selectedIds = new Set(
              answer?.selectedChoices.map((c) => c.id) ?? [],
            );
            const choiceItems: ChoiceItemView[] =
              question.multipleSelect.multipleSelectChoices.map((c) => ({
                id: c.id,
                text: c.choiceText,
                isSelected: selectedIds.has(c.id),
                isCorrect: test.isShowCorrectAnswers ? c.isCorrect : null,
              }));
            multipleSelectView = {
              id: answer?.id ?? "",
              choices: choiceItems,
              score: answer?.score ?? 0,
              maxScore: question.multipleSelect.maxScore,
            };
          }

          return (
            <QuestionDetailCard
              key={question.id}
              questionNumber={index + 1}
              questionText={question.questionText}
              type={question.type}
              essay={essayView}
              choice={choiceView}
              multipleSelect={multipleSelectView}
              showDetailedScore={true}
              labels={labels}
            />
          );
        })}
      </div>
    </div>
  );
}
