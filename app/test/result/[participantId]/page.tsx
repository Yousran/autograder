"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getParticipantResult } from "@/app/actions/participant/result";
import { getNextTests, type NextTestInfo } from "@/app/actions/prerequisite";
import { authClient } from "@/lib/auth-client";
import { ArrowRight, Lock } from "lucide-react";

interface ParticipantData {
  id: string;
  name: string;
  score: number;
  isCompleted: boolean;
}

interface TestData {
  id: string;
  title: string;
  joinCode: string;
  showDetailedScore: boolean;
  showCorrectAnswers: boolean;
  creatorId: string;
}

export default function ResultPage() {
  const router = useRouter();
  const { participantId } = useParams<{ participantId: string }>();
  const [participant, setParticipant] = useState<ParticipantData | null>(null);
  const [test, setTest] = useState<TestData | null>(null);
  const [nextTests, setNextTests] = useState<NextTestInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = authClient.useSession();

  const isCreator = session?.user?.id === test?.creatorId;

  useEffect(() => {
    const fetchParticipantData = async () => {
      try {
        const result = await getParticipantResult(participantId);
        if (result.success && result.data) {
          setParticipant(result.data.participant);
          setTest(result.data.test);

          // Fetch next tests if user is logged in
          if (session?.user?.id) {
            const nextTestsResult = await getNextTests(
              result.data.test.id,
              result.data.participant.score
            );
            if (nextTestsResult.success && nextTestsResult.nextTests) {
              setNextTests(nextTestsResult.nextTests);
            }
          }
        } else {
          console.error("Error fetching participant data:", result.error);
        }
      } catch (error) {
        console.error("Error fetching participant data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchParticipantData();
  }, [participantId, session?.user?.id]);

  const canSeeDetails = isCreator || test?.showDetailedScore;

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 gap-6">
      {/* Participant name */}
      <Label className="text-3xl font-bold">
        {loading ? <Skeleton className="w-40 h-8" /> : participant?.name}
      </Label>

      {/* Participant score */}
      <Label className="text-6xl font-extrabold text-center">
        {loading ? (
          <Skeleton className="w-32 h-16" />
        ) : participant?.score !== undefined ? (
          Number(participant.score.toFixed(2))
        ) : (
          "??"
        )}
      </Label>

      {/* Test title */}
      <Label className="text-2xl font-bold text-center">
        {loading ? <Skeleton className="w-64 h-8" /> : test?.title}
      </Label>

      {/* See Details button - visible for creator or when showDetailedScore is true */}
      {!loading && canSeeDetails && (
        <Button
          variant="outline"
          className="w-full max-w-md"
          onClick={() => router.push(`/test/result/${participantId}/details`)}
        >
          See Details
        </Button>
      )}

      {/* Edit/Grade button - visible only for creator */}
      {!loading && isCreator && (
        <Button
          variant="secondary"
          className="w-full max-w-md"
          onClick={() => router.push(`/test/result/${participantId}/edit`)}
        >
          Grade Answers
        </Button>
      )}

      {/* Continue to Next Test buttons - visible when there are next tests */}
      {!loading && nextTests.length > 0 && (
        <div className="w-full max-w-md flex flex-col gap-2">
          <Label className="text-sm text-muted-foreground text-center">
            Continue your journey
          </Label>
          {nextTests.map((nextTest) => (
            <Button
              key={nextTest.id}
              variant={nextTest.userMeetsRequirement ? "default" : "outline"}
              className="w-full justify-between"
              disabled={!nextTest.userMeetsRequirement}
              onClick={() => router.push(`/test/${nextTest.joinCode}`)}
            >
              <span className="flex items-center gap-2">
                {nextTest.userMeetsRequirement ? (
                  <ArrowRight className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {nextTest.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {nextTest.userMeetsRequirement
                  ? "Unlocked"
                  : `Need ${nextTest.minScoreRequired}%`}
              </span>
            </Button>
          ))}
        </div>
      )}

      <Button className="w-full max-w-md" onClick={() => router.push("/")}>
        Back to Home
      </Button>
    </div>
  );
}
