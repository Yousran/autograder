"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { getParticipantByTestId } from "@/app/actions/get-participant";
import type { Participant } from "@/lib/generated/prisma/client";

export default function Participants({ testId }: { testId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await getParticipantByTestId(testId as string);
        if (res && "success" in res && res.success) {
          if (mounted) setParticipants(res.participants);
        } else {
          if (mounted) setParticipants([]);
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
              <Label className="text-3xl font-bold">{participant.score}</Label>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
