"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import QuestionCard from "./components/question-card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { Choice, MultipleSelectChoice } from "@/types/question";

interface Participant {
  id: string;
  username: string;
  score: number | null;
}

interface Test {
  title: string;
  showCorrectAnswers: boolean;
}

interface AnswerDetail {
  id: string;
  questionText: string;
  type: string;
  maxScore: number;
  essay?: {
    participantAnswer?: {
      answerText: string;
      score: number | null;
      scoreExplanation?: string;
    } | null;
    answerText: string;
  } | null;
  choice?: {
    participantAnswer?: {
      selectedChoiceId: string;
      score: number | null;
    } | null;
    choices?: Choice[];
  } | null;
  multipleSelect?: {
    participantAnswer?: {
      selectedChoices: MultipleSelectChoice[];
      score: number | null;
    } | null;
    multipleSelectChoices?: MultipleSelectChoice[];
  } | null;
}

export default function ParticipantResultDetailsPage() {
  const router = useRouter();
  const { participantId } = useParams<{ participantId: string }>();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<AnswerDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/v1/participant/creator/${participantId}`
        );
        const data = await response.json();
        if (response.ok) {
          setParticipant(data.participant);
          setTest(data.test);
          setQuestions(data.questions);
        }
      } catch {
        // handle error
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [participantId]);

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <Button
        size={"icon"}
        variant="ghost"
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-10"
      >
        <ArrowLeftIcon />
      </Button>
      <main className="flex-grow flex flex-col items-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-center">
              {isLoading ? (
                <Skeleton className="h-8 w-1/2" />
              ) : (
                test?.title || "Test Information"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <Label className="text-lg font-medium">
                {isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  participant?.username || "N/A"
                )}
              </Label>
              <Label className="text-3xl font-semibold">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : typeof participant?.score === "number" ? (
                  Number(participant.score.toFixed(2))
                ) : (
                  "Not graded yet"
                )}
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="w-full max-w-2xl flex flex-col gap-4 mt-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-md" />
              ))
            : questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  showCorrectAnswers={test?.showCorrectAnswers || false}
                />
              ))}
        </div>
      </main>
    </div>
  );
}
