import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { GaugeCombined } from "@/components/ui/gauge";
import { Label } from "@/components/ui/label";
import { recalculateParticipantScore } from "@/lib/graders/total-score";

export default async function ResultPage({
  params,
}: {
  params: Promise<{
    participantId: string;
  }>;
}) {
  const { participantId } = await params;
  const t = await getTranslations("Pages.testResult");

  await recalculateParticipantScore(participantId);

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

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 flex flex-col gap-4">
        <div className="flex justify-center">
          <GaugeCombined
            value={participant.score}
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
            href={`/test/result/${participantId}/details`}
            className="w-full"
          >
            <Button variant="outline" className="w-full">
              {t("seeDetails") || "See Details"}
            </Button>
          </Link>
        )}

        <Link href={`/`} className="w-full">
          <Button className="w-full">
            {t("backToHome") || "Back to Home"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
