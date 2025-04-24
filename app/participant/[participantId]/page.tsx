// file: /app/participant/[participantId]/page.tsx
"use client";
import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useParams } from "next/navigation";

interface Participant {
  id: string;
  username: string;
  score: number | null;
}

interface Question {
  id: string;
  questionText: string;
  type: string;
  essay?: { answer: { answerText: string } | null };
  choice?: { answer: { selectedChoiceId: string | null } | null };
  multipleChoice?: {
    answer: { selectedChoices: { id: string; choiceText: string }[] | null };
  };
}

interface Test {
  title: string;
}

export default function ParticipantPage() {
  // const router = useRouter();
  const { participantId } = useParams<{ participantId: string }>();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchParticipantData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/participant/${participantId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.error || "Failed to fetch participant data");
          return;
        }

        const data = await response.json();
        setParticipant(data.participant);
        setTest(data.test);
        setQuestions(data.questions);
        console.log(data);
      } catch (error) {
        console.error("Error fetching participant data:", error);
        toast.error("An error occurred while fetching participant data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchParticipantData();
  }, [participantId]);

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
    <div className="max-w-screen min-h-screen p-4 flex flex-col items-center">
      <Card className="w-full max-w-2xl mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Participant Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="block text-lg font-medium">
            Username: {participant?.username}
          </Label>
          <Label className="block text-lg font-medium">
            Score: {participant?.score ?? "Not graded yet"}
          </Label>
          <Label className="block text-lg font-medium">
            Test: {test?.title}
          </Label>
        </CardContent>
      </Card>

      <div className="w-full max-w-2xl">
        {questions.map((question, index) => (
          <Card key={question.id} className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                {index + 1}. {question.questionText}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {question.type === "ESSAY" && (
                <Label className="block">
                  Answer:{" "}
                  {question.essay?.answer?.answerText || "No answer provided"}
                </Label>
              )}
              {question.type === "CHOICE" && (
                <Label className="block">
                  Selected Choice:{" "}
                  {question.choice?.answer?.selectedChoiceId ||
                    "No choice selected"}
                </Label>
              )}
              {question.type === "MULTIPLE_CHOICE" && (
                <Label className="block">
                  Selected Choices:{" "}
                  {question.multipleChoice?.answer?.selectedChoices
                    ?.map((choice) => choice.choiceText)
                    .join(", ") || "No choices selected"}
                </Label>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
