import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/dal";
import { QuestionDetailCard } from "@/components/custom/question-detail-card";
import { QuestionWithAnswerSchema } from "@/lib/schemas/question";
import { ScoreSliderInput } from "@/components/custom/score-slider-input";
import { EssayGradingControl } from "@/components/custom/essay-grading-control";

export default async function CreatorEditDetailsPage({
  params,
}: {
  params: Promise<{
    participantId: string;
  }>;
}) {
  const { participantId } = await params;
  const locale = await getLocale();

  const session = await getSession();
  if (!session) {
    redirect({ href: `/auth/sign-in`, locale });
  }

  const t = await getTranslations();

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
  if (participant.test.creatorId !== session?.user.id) {
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
          answers: {
            where: { participantId },
            include: { choice: true },
          },
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

  // Convert null relations to undefined for schema validation
  const validatedQuestions = questions.map((q) => ({
    ...q,
    essay: q.essay ?? undefined,
    choice: q.choice ?? undefined,
    multipleSelect: q.multipleSelect ?? undefined,
  }));

  QuestionWithAnswerSchema.array().parse(validatedQuestions);

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href={`/test/${test.id}?tab=participants`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="size-4" />
            {t("Pages.creatorDetails.backToParticipants")}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">
          {t("Pages.creatorDetails.title")}
        </h1>
        <p className="text-muted-foreground">{participant.name}</p>
        <p className="text-sm text-muted-foreground">{test.title}</p>
      </div>

      {/* Total score summary */}
      <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {t("Pages.creatorDetails.totalScore")}
        </span>
        <Badge
          variant="outline"
          className="text-base font-semibold tabular-nums px-3 py-1"
        >
          {participant.score}
        </Badge>
      </div>

      {/* Question cards with editable scores */}
      <div className="flex flex-col gap-4">
        {validatedQuestions.map((question, index) => {
          let scoreControl: React.ReactNode = null;

          if (question.type === "ESSAY" && question.essay) {
            const answer = question.essay.answers[0];
            if (answer) {
              scoreControl = (
                <EssayGradingControl
                  key={answer.id}
                  answerId={answer.id}
                  initialScore={answer.score}
                  maxScore={question.essay.maxScore}
                  initialScoreExplanation={answer.scoreExplanation}
                />
              );
            }
          } else if (question.type === "CHOICE" && question.choice) {
            const answer = question.choice.answers[0];
            if (answer) {
              scoreControl = (
                <ScoreSliderInput
                  key={answer.id}
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
            if (answer) {
              scoreControl = (
                <ScoreSliderInput
                  key={answer.id}
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
              question={question}
              showDetailedScore={true}
              showCorrectAnswers={true}
              scoreControl={scoreControl}
            />
          );
        })}
      </div>
    </div>
  );
}
