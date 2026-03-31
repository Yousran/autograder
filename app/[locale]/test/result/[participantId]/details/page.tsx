import { Link, redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { QuestionDetailCard } from "@/components/custom/question-detail-card";
import { QuestionWithDetailsSchema } from "@/lib/schemas/question";

export default async function ParticipantDetailsPage({
  params,
}: {
  params: Promise<{
    participantId: string;
  }>;
}) {
  const { participantId } = await params;
  const locale = await getLocale();
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
          creatorId: true,
        },
      },
      essayAnswers: {
        select: { id: true },
      },
    },
  });

  if (!participant) {
    notFound();
  }

  const { test } = participant;

  // If detailed score is disabled, just redirect back
  if (!test.isShowDetailedScore) {
    redirect({ href: `/test/result/${participantId}`, locale });
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

  QuestionWithDetailsSchema.array().parse(validatedQuestions);

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
          {participant.score}
        </Badge>
      </div>

      {/* Question cards */}
      <div className="flex flex-col gap-4">
        {validatedQuestions.map((question, index) => {
          return (
            <QuestionDetailCard
              key={question.id}
              questionNumber={index + 1}
              question={question}
              showDetailedScore={test.isShowDetailedScore}
              showCorrectAnswers={test.isShowCorrectAnswers}
            />
          );
        })}
      </div>
    </div>
  );
}
