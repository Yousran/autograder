"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";
import { getParticipantResultDetails } from "@/app/actions/participant/result";
import {
  updateEssayScore,
  updateChoiceScore,
  updateMultipleSelectScore,
} from "@/app/actions/answer";
import { GradingQuestionCard } from "../components/grading-question-card";
import { truncateWords } from "@/lib/text";
import type {
  ParticipantResultData,
  QuestionAnswerDetail,
} from "@/types/answer";

export default function ParticipantResultEditPage() {
  const router = useRouter();
  const { participantId } = useParams<{ participantId: string }>();
  const [data, setData] = useState<ParticipantResultData | null>(null);
  const [questions, setQuestions] = useState<QuestionAnswerDetail[]>([]);
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
          setQuestions(result.data.questions);
          setIsCreator(result.isCreator ?? false);

          // Check if user is creator
          if (!result.isCreator) {
            setError("You are not authorized to grade this test");
          }
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

  const handleUpdateScore = useCallback(
    async (answerId: string, score: number, type: string) => {
      try {
        let result;

        switch (type) {
          case "ESSAY":
            result = await updateEssayScore(answerId, score);
            break;
          case "CHOICE":
            result = await updateChoiceScore(answerId, score);
            break;
          case "MULTIPLE_SELECT":
            result = await updateMultipleSelectScore(answerId, score);
            break;
          default:
            throw new Error("Invalid question type");
        }

        if (!result.success) {
          toast.error(result.error ?? "Failed to update score");
          return;
        }

        // Update local state
        const updatedQuestions = questions.map((q) => {
          if (
            q.essay?.participantAnswer?.id === answerId ||
            q.choice?.participantAnswer?.id === answerId ||
            q.multipleSelect?.participantAnswer?.id === answerId
          ) {
            const updated = { ...q };
            if (updated.essay?.participantAnswer?.id === answerId) {
              updated.essay = {
                ...updated.essay,
                participantAnswer: {
                  ...updated.essay.participantAnswer,
                  score,
                },
              };
            } else if (updated.choice?.participantAnswer?.id === answerId) {
              updated.choice = {
                ...updated.choice,
                participantAnswer: {
                  ...updated.choice.participantAnswer,
                  score,
                },
              };
            } else if (
              updated.multipleSelect?.participantAnswer?.id === answerId
            ) {
              updated.multipleSelect = {
                ...updated.multipleSelect,
                participantAnswer: {
                  ...updated.multipleSelect.participantAnswer,
                  score,
                },
              };
            }
            return updated;
          }
          return q;
        });

        setQuestions(updatedQuestions);

        // Refetch data to get the correct percentage score calculated by the server
        const refreshedResult = await getParticipantResultDetails(
          participantId
        );
        if (refreshedResult.success && refreshedResult.data) {
          setData(refreshedResult.data);
        }

        toast.success("Score updated successfully");
      } catch (err) {
        console.error("Error updating score:", err);
        toast.error("An error occurred while updating the score");
      }
    },
    [questions, participantId]
  );

  if (error && !isCreator) {
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

        {/* Grading instructions */}
        {!isLoading && isCreator && (
          <Card className="w-full max-w-2xl mt-4 bg-secondary/50">
            <CardContent className="p-4">
              <Label className="text-sm text-muted-foreground">
                💡 Tip: Use the score sliders below each question to manually
                grade answers. Scores are saved automatically after a short
                delay.
              </Label>
            </CardContent>
          </Card>
        )}

        {/* Questions list */}
        <div className="w-full max-w-2xl flex flex-col gap-4 mt-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-md" />
              ))
            : questions.map((question) => (
                <GradingQuestionCard
                  key={question.id}
                  question={question}
                  onUpdateScore={handleUpdateScore}
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
