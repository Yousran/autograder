"use client";

import TiptapRenderer from "@/components/custom/tiptap-renderer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { QuestionAnswerDetail } from "./question-answer";
import ChoiceComponent from "@/components/custom/choice";
import { Choice, MultipleChoice } from "@/types/question";
import { Check, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function QuestionCard({
  question,
  handleUpdateScore,
}: {
  question: QuestionAnswerDetail;
  handleUpdateScore: (answerId: string, score: number, type: string) => void;
}) {
  const initialScore =
    question.essay?.participantAnswer?.score ??
    question.choice?.participantAnswer?.score ??
    question.multipleChoice?.participantAnswer?.score;

  const [score, setScore] = useState<number | undefined>(initialScore);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const answerId =
    question.essay?.participantAnswer?.id ??
    question.choice?.participantAnswer?.id ??
    question.multipleChoice?.participantAnswer?.id;

  const type = question.type;

  useEffect(() => {
    setScore(initialScore); // sync saat props question berubah
  }, [initialScore]);

  useEffect(() => {
    if (score === undefined || answerId === undefined) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (score !== initialScore) {
        handleUpdateScore(answerId, score, type);
      }
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [answerId, handleUpdateScore, initialScore, score, type]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <Label className="text-lg font-bold">{question.order}</Label>
          <Label className="text-lg font-bold text-center">
            {question.type}
          </Label>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="border-b-2 border-b-secondary">
          <TiptapRenderer content={question.questionText} />
        </div>

        {question.type === "ESSAY" && question.essay && (
          <div className="flex flex-col gap-4">
            <Label className="text-lg font-bold">Answer</Label>
            <Label className="text-sm font-normal text-primary">
              {question.essay.answerText}
            </Label>
            <Label className="text-lg font-bold">Participant Answer</Label>
            <Label className="text-sm font-normal text-primary">
              {question.essay.participantAnswer?.answerText ||
                "No answer provided"}
            </Label>
            <Label className="text-lg font-bold">Score Explanation</Label>
            <Label className="text-sm font-normal text-primary">
              {question.essay.participantAnswer?.scoreExplanation ||
                "No Explanation provided"}
            </Label>
          </div>
        )}

        {question.type === "CHOICE" && question.choice && (
          <div className="flex flex-col gap-4">
            <Label className="text-lg font-bold">Choices</Label>
            <div className="flex flex-col gap-2">
              {question.choice.choices.map((choice) => (
                <ChoiceComponent key={choice.id} choice={choice as Choice} />
              ))}
            </div>
            <Label className="text-lg font-bold">Participant Choice</Label>
            <div className="flex flex-col gap-2">
              {question.choice.choices.map((choice) =>
                choice.id ===
                question.choice?.participantAnswer?.selectedChoiceId ? (
                  <ChoiceComponent key={choice.id} choice={choice as Choice} />
                ) : null
              )}
            </div>
          </div>
        )}

        {question.type === "MULTIPLE_CHOICE" && question.multipleChoice && (
          <div className="flex flex-col gap-4">
            <Label className="text-lg font-bold">Choices</Label>
            <div className="flex flex-col gap-2">
              {question.multipleChoice.multipleChoices.map((choice) => (
                <ChoiceComponent
                  key={choice.id}
                  choice={choice as MultipleChoice}
                />
              ))}
            </div>
            <Label className="text-lg font-bold">Participant Choice</Label>
            <div className="flex flex-col gap-2">
              {question.multipleChoice.participantAnswer?.selectedChoices.map(
                (choice) => (
                  <div
                    key={choice.id}
                    className={`p-4 border rounded-md ${
                      choice.isCorrect
                        ? "bg-green-100/10 border-green-500"
                        : "bg-red-100/10 border-red-400 border-2"
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="flex-grow">{choice.choiceText}</span>
                      {choice.isCorrect ? (
                        <span className="text-green-500 ml-2">
                          <Check className="w-5 h-5" />
                        </span>
                      ) : (
                        <span className="text-red-400 ml-2">
                          <XIcon className="w-5 h-5" />
                        </span>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {answerId && (
          <>
            <Label className="text-lg font-bold">Score</Label>
            <Input
              type="number"
              value={score ?? ""}
              onChange={(e) => {
                const newScore = parseInt(e.target.value);
                if (isNaN(newScore)) {
                  setScore(undefined);
                  return;
                }

                if (newScore > question.maxScore) {
                  toast.warning(`Max score is ${question.maxScore}`);
                  setScore(question.maxScore);
                } else if (newScore < 0) {
                  setScore(0);
                } else {
                  setScore(newScore);
                }
              }}
              className="w-full max-w-xs"
            />
            <Label className="text-muted-foreground text-sm">
              Max Score: {question.maxScore}
            </Label>
          </>
        )}
      </CardContent>
    </Card>
  );
}
