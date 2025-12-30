"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, EditIcon } from "lucide-react";
import { getParticipantResultDetails } from "@/app/actions/participant/result";
import { ResultQuestionCard } from "../components/result-question-card";
import { truncateWords } from "@/lib/text";
import type { ParticipantResultData } from "@/types/answer";

export default function ParticipantResultDetailsPage() {
  const router = useRouter();
  const { participantId } = useParams<{ participantId: string }>();
  const [data, setData] = useState<ParticipantResultData | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getParticipantResultDetails(participantId);
        if (result.success && result.data) {
          setData(result.data);
          setIsCreator(result.isCreator ?? false);
        } else {
          setError(result.error ?? "Failed to load data");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("An error occurred while loading data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [participantId]);

  // Determine if we should show correct answers
  const showCorrectAnswers =
    isCreator || (data?.test.showCorrectAnswers ?? false);

  if (error) {
    return (
      <div className="max-w-screen min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <Label className="text-lg font-semibold text-destructive">
              {error}
            </Label>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      {/* Back button */}
      <Button
        size="icon"
        variant="ghost"
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-10"
      >
        <ArrowLeftIcon />
      </Button>

      {/* Edit button for creator */}
      {!isLoading && isCreator && (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => router.push(`/test/result/${participantId}/edit`)}
          className="absolute top-4 right-4 z-10"
        >
          <EditIcon />
        </Button>
      )}

      <main className="grow flex flex-col items-center p-4 pt-16">
        {/* Participant info card */}
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-center">
              {isLoading ? (
                <Skeleton className="h-8 w-1/2 mx-auto" />
              ) : (
                truncateWords(data?.test.title ?? "Test Information")
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <Label className="text-lg font-medium">
                {isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  data?.participant.name ?? "N/A"
                )}
              </Label>
              <Label className="text-3xl font-semibold">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : typeof data?.participant.score === "number" ? (
                  Number(data.participant.score.toFixed(2))
                ) : (
                  "Not graded yet"
                )}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Questions list */}
        <div className="w-full max-w-2xl flex flex-col gap-4 mt-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-md" />
              ))
            : data?.questions.map((q) => (
                <ResultQuestionCard
                  key={q.id}
                  question={q}
                  showCorrectAnswers={showCorrectAnswers}
                />
              ))}
        </div>

        {/* Back to results button */}
        <div className="w-full max-w-2xl mt-6 mb-8">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/test/result/${participantId}`)}
          >
            Back to Results
          </Button>
        </div>
      </main>
    </div>
  );
}
