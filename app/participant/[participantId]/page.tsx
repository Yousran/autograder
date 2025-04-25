"use client";
import Navbar from "@/components/custom/navbar";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { QuestionCard } from "./components/question-card";
import { QuestionAnswerDetail } from "./components/question-answer";

interface Participant {
  id: string;
  username: string;
  score: number | null;
}

interface Test {
  title: string;
}

export default function ParticipantPage() {
  const { participantId } = useParams<{ participantId: string }>();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<QuestionAnswerDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function updateScore(answerId: string, score: number, type: string) {
    try {
      let endpoint = "";

      switch (type) {
        case "ESSAY":
          endpoint = "/api/v1/answer/score/essay";
          break;
        case "CHOICE":
          endpoint = "/api/v1/answer/score/choice";
          break;
        case "MULTIPLE_CHOICE":
          endpoint = "/api/v1/answer/score/multiple-choice";
          break;
        default:
          throw new Error("Invalid question type");
      }

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answerId, score }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update score");
      }

      const data = await response.json();

      // Update score di state lokal (questions)
      setQuestions((prev) =>
        prev.map((q) => {
          if (
            q.essay?.participantAnswer?.id === answerId ||
            q.choice?.participantAnswer?.id === answerId ||
            q.multipleChoice?.participantAnswer?.id === answerId
          ) {
            const updated = { ...q };
            if (updated.essay?.participantAnswer?.id === answerId) {
              updated.essay.participantAnswer.score = score;
            } else if (updated.choice?.participantAnswer?.id === answerId) {
              updated.choice.participantAnswer.score = score;
            } else if (
              updated.multipleChoice?.participantAnswer?.id === answerId
            ) {
              updated.multipleChoice.participantAnswer.score = score;
            }
            return updated;
          }
          return q;
        })
      );

      toast.success("Score updated successfully");
      return data;
    } catch (error) {
      console.error("Error updating score:", error);
      toast.error("An error occurred while updating the score");
    }
  }

  const fetchParticipantData = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/v1/participant/creator/${participantId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to fetch participant data");
        return;
      }

      const data = await response.json();
      setParticipant(data.participant);
      setTest(data.test);
      setQuestions(data.questions);
    } catch (error) {
      console.error("Error fetching participant data:", error);
      toast.error("An error occurred while fetching participant data");
    }
  }, [participantId]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchParticipantData();
      setIsLoading(false);
    };
    fetchData();
  }, [fetchParticipantData, participantId]);

  if (isLoading) {
    return (
      <div className="max-w-screen min-h-screen flex flex-col items-center justify-center">
        <Skeleton className="h-8 w-1/2 rounded-md mb-4" />
        <Skeleton className="h-6 w-1/3 rounded-md mb-4" />
        <Skeleton className="h-24 w-full max-w-2xl rounded-md mb-4" />
        <Skeleton className="h-24 w-full max-w-2xl rounded-md mb-4" />
      </div>
    );
  }

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-center">
              {test?.title || "Test Information"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <Label className="text-lg font-medium">
                {participant?.username || "N/A"}
              </Label>
              <Label className="text-3xl font-semibold">
                {typeof participant?.score === "number"
                  ? Number(participant.score.toFixed(2))
                  : "Not graded yet"}
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="w-full max-w-2xl flex flex-col gap-4 mt-4">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              handleUpdateScore={updateScore}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
