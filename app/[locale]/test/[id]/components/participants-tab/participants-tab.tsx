"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ParticipantCard } from "./participant-card";
import type {
  ParticipantSummary,
  GetParticipantsResponse,
} from "@/lib/schemas/participant";

function ParticipantCardSkeleton() {
  return (
    <Card className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="h-3 w-12" />
      </div>
    </Card>
  );
}

/**
 * Client component — fetches participants for the given test via
 * GET /api/participants?testid=... and renders a card per participant.
 */
export function ParticipantsTab({ testId }: { testId: string }) {
  const t = useTranslations("Components.participantsTab");
  const [participants, setParticipants] = useState<ParticipantSummary[]>([]);
  const [maxScore, setMaxScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchParticipants() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/participants?testid=${testId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data?.error ?? t("fetchFailed"));
          return;
        }
        const data: GetParticipantsResponse = await res.json();
        if (!cancelled) {
          setParticipants(data.participants);
          setMaxScore(data.maxScore);
        }
      } catch {
        if (!cancelled) toast.error(t("fetchFailed"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchParticipants();
    return () => {
      cancelled = true;
    };
  }, [testId, t]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <ParticipantCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Users className="size-10 opacity-40" />
        <p className="text-sm">{t("noParticipants")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {participants.map((participant) => (
        <ParticipantCard
          key={participant.id}
          participant={participant}
          maxScore={maxScore}
        />
      ))}
    </div>
  );
}
