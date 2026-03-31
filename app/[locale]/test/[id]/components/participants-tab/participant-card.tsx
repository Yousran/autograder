"use client";

import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GaugeCombined } from "@/components/ui/gauge";
import { useTranslations } from "next-intl";
import type { ParticipantSummary } from "@/lib/schemas/participant";

/**
 * Displays a single participant row with their name, completion status,
 * and a score gauge. Clicking navigates to the creator edit-details page.
 */
export function ParticipantCard({
  participant,
}: {
  participant: ParticipantSummary;
}) {
  const t = useTranslations("Components.participantsTab");

  return (
    <Link
      href={`/test/result/${participant.id}/details/edit`}
      className="block"
    >
      <Card className="flex flex-row items-center gap-4 p-4 transition-colors hover:bg-muted/50 cursor-pointer">
        <div className="flex gap-1 flex-1 min-w-0">
          <Badge
            variant={participant.isCompleted ? "default" : "secondary"}
            className="w-fit text-xs"
          >
            {participant.isCompleted ? t("completed") : t("inProgress")}
          </Badge>
          <span className="font-medium truncate">{participant.name}</span>
        </div>

        <div className="flex flex-col items-center gap-1 shrink-0">
          <GaugeCombined
            value={participant.score}
            min={0}
            max={100}
            size={64}
            startAngle={-135}
            endAngle={135}
            thickness={6}
          />
          <span className="text-xs text-muted-foreground tabular-nums">
            {participant.score} / 100
          </span>
        </div>
      </Card>
    </Link>
  );
}
