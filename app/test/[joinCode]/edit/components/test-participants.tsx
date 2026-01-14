"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { getParticipantsByTestId } from "@/app/actions/participant/get";
import { getPrerequisiteMinScore } from "@/app/actions/prerequisite";
import type { Participant } from "@/lib/generated/prisma/client";

export function TestParticipants({ testId }: { testId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [minScoreRequired, setMinScoreRequired] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const [participantsRes, minScoreRes] = await Promise.all([
          getParticipantsByTestId(testId),
          getPrerequisiteMinScore(testId),
        ]);

        if (
          participantsRes &&
          participantsRes.success &&
          participantsRes.participants
        ) {
          if (mounted) setParticipants(participantsRes.participants);
        } else {
          if (mounted) setParticipants([]);
        }

        if (minScoreRes && minScoreRes.success) {
          if (mounted) setMinScoreRequired(minScoreRes.minScore ?? null);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setParticipants([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (testId) load();

    return () => {
      mounted = false;
    };
  }, [testId]);

  // Determine score color based on prerequisite min score
  const getScoreColor = (score: number) => {
    if (minScoreRequired === null) return ""; // No prerequisite, use default color
    return score >= minScoreRequired ? "text-green-500" : "text-red-500";
  };

  return (
    <div className="flex flex-col gap-4">
      {loading && <Skeleton className="h-32 w-full" />}
      {participants.length === 0 && !loading ? (
        <div className="my-4 text-center text-primary">
          No participants available
        </div>
      ) : (
        participants.map((participant) => (
          <Card
            key={participant.id}
            onClick={() => router.push(`/test/result/${participant.id}`)}
            className="cursor-pointer hover:bg-card-foreground/10 hover:scale-101 transition"
          >
            <CardContent className="flex justify-between items-center gap-4 p-6">
              <Label className="text-xl">{participant.name}</Label>
              <Label
                className={`text-3xl font-bold ${getScoreColor(
                  participant.score
                )}`}
              >
                {participant.score}
              </Label>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
