import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/dal";
import { QuestionDetailCard } from "@/components/custom/question-detail-card";
import type {
  ChoiceItemView,
  EssayAnswerView,
  ChoiceAnswerView,
  MultipleSelectAnswerView,
} from "@/lib/schemas/answer";
import { ScoreSliderInput } from "@/components/custom/score-slider-input";
import { EssayGradingControl } from "@/components/custom/essay-grading-control";

export default async function CreatorEditDetailsPage({
  params,
}: {
  params: Promise<{
    locale: string;
    participantId: string;
  }>;
}) {
  const { locale, participantId } = await params;

  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const t = await getTranslations("Pages.creatorDetails");

  // Fetch participant with test
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      test: {
        select: {
          id: true,
          title: true,
          creatorId: true,
        },
      },
    },
  });

  if (!participant) {
    notFound();
  }

  // Only the test creator can access this page
  if (participant.test.creatorId !== session.user.id) {
    notFound();
  }

  const { test } = participant;

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

  // Card labels — all answers & correct answers always visible to creator
  const labels = {
    essay: t("essay"),
    choice: t("choice"),
    multipleSelect: t("multipleSelect"),
    yourAnswer: t("participantAnswer"),
    correctAnswer: t("correctAnswer"),
    notAnswered: t("notAnswered"),
    score: t("score"),
    scoreExplanation: t("scoreExplanation"),
    correct: t("correct"),
    incorrect: t("incorrect"),
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href={`/${locale}/test/${test.id}?tab=participants`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="size-4" />
            {t("backToParticipants")}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{participant.name}</p>
        <p className="text-sm text-muted-foreground">{test.title}</p>
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
        <span className="text-xs text-muted-foreground ml-auto">
          {t("autoUpdates")}
        </span>
      </div>

      {/* Question cards with editable scores */}
      <div className="flex flex-col gap-4">
        {questions.map((question, index) => {
          let essayView: EssayAnswerView | null = null;
          let choiceView: ChoiceAnswerView | null = null;
          let multipleSelectView: MultipleSelectAnswerView | null = null;
          let scoreControl: React.ReactNode = null;

          if (question.type === "ESSAY" && question.essay) {
            const answer = question.essay.answers[0];
            essayView = {
              id: answer?.id ?? "",
              answerText: answer?.answerText ?? "",
              // Creator always sees the correct answer
              correctAnswer: question.essay.answerText,
              score: answer?.score ?? 0,
              maxScore: question.essay.maxScore,
              scoreExplanation: answer?.scoreExplanation ?? null,
            };
            if (answer) {
              scoreControl = (
                <EssayGradingControl
                  answerId={answer.id}
                  initialScore={answer.score}
                  maxScore={question.essay.maxScore}
                  initialScoreExplanation={answer.scoreExplanation}
                />
              );
            }
          } else if (question.type === "CHOICE" && question.choice) {
            const answer = question.choice.answers[0];
            const selectedId = answer?.selectedChoiceId ?? null;
            const choiceItems: ChoiceItemView[] = question.choice.choices.map(
              (c) => ({
                id: c.id,
                text: c.choiceText,
                isSelected: c.id === selectedId,
                // Creator always sees which choices are correct
                isCorrect: c.isCorrect,
              }),
            );
            choiceView = {
              id: answer?.id ?? "",
              choices: choiceItems,
              score: answer?.score ?? 0,
              maxScore: question.choice.maxScore,
            };
            if (answer) {
              scoreControl = (
                <ScoreSliderInput
                  answerId={answer.id}
                  answerType="choice"
                  initialScore={answer.score}
                  maxScore={question.choice.maxScore}
                />
              );
            }
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
                // Creator always sees which choices are correct
                isCorrect: c.isCorrect,
              }));
            multipleSelectView = {
              id: answer?.id ?? "",
              choices: choiceItems,
              score: answer?.score ?? 0,
              maxScore: question.multipleSelect.maxScore,
            };
            if (answer) {
              scoreControl = (
                <ScoreSliderInput
                  answerId={answer.id}
                  answerType="multiple-choice"
                  initialScore={answer.score}
                  maxScore={question.multipleSelect.maxScore}
                />
              );
            }
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
              scoreControl={scoreControl}
              labels={labels}
            />
          );
        })}
      </div>
    </div>
  );
}
