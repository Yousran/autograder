import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { GaugeCombined } from "@/components/ui/gauge";
import { Label } from "@/components/ui/label";

interface ResultPageProps {
  params: Promise<{
    locale: string;
    participantId: string;
  }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { locale, participantId } = await params;
  const t = await getTranslations("Pages.testResult");

  // Fetch participant with test
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      test: true,
    },
  });

  if (!participant) {
    notFound();
  }

  // Fetch all questions for the test
  const questions = await prisma.question.findMany({
    where: { testId: participant.testId },
    include: {
      essay: true,
      choice: true,
      multipleSelect: true,
    },
  });

  // Fetch all answers for the participant
  const [essayAnswers, choiceAnswers, multipleSelectAnswers] =
    await Promise.all([
      prisma.essayAnswer.findMany({
        where: { participantId },
      }),
      prisma.choiceAnswer.findMany({
        where: { participantId },
      }),
      prisma.multipleSelectAnswer.findMany({
        where: { participantId },
      }),
    ]);

  // Calculate total max score
  let totalMaxScore = 0;
  for (const question of questions) {
    if (question.essay) {
      totalMaxScore += question.essay.maxScore;
    } else if (question.choice) {
      totalMaxScore += question.choice.maxScore;
    } else if (question.multipleSelect) {
      totalMaxScore += question.multipleSelect.maxScore;
    }
  }

  // Calculate total obtained score
  let totalObtainedScore = 0;
  for (const essayAnswer of essayAnswers) {
    totalObtainedScore += essayAnswer.score;
  }
  for (const choiceAnswer of choiceAnswers) {
    totalObtainedScore += choiceAnswer.score;
  }
  for (const multipleSelectAnswer of multipleSelectAnswers) {
    totalObtainedScore += multipleSelectAnswer.score;
  }

  const percentage =
    totalMaxScore > 0
      ? Math.round((totalObtainedScore / totalMaxScore) * 10000) / 100
      : 0;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 flex flex-col gap-4">
        <div className="flex justify-center">
          <GaugeCombined
            value={percentage}
            max={100}
            min={0}
            size={200}
            thickness={12}
          />
        </div>
        <Label className="text-center justify-center text-xl font-semibold">
          {participant.name || t("participant") || "Participant"}
        </Label>
        {participant.test.isShowDetailedScore && (
          <Link
            href={`/${locale}/test/result/${participantId}/details`}
            className="w-full"
          >
            <Button variant="outline" className="w-full">
              {t("seeDetails") || "See Details"}
            </Button>
          </Link>
        )}

        <Link href={`/${locale}`} className="w-full">
          <Button className="w-full">
            {t("backToHome") || "Back to Home"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
