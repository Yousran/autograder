"use client";

import { useEffect, useRef, useState } from "react";
import TiptapRenderer from "@/components/custom/tiptap-renderer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { normalizeSnakeCase } from "@/lib/text";
import ChoiceComponent from "@/components/custom/choice";
import { ScoreSlider } from "@/components/custom/score-slider";
import { Check, XIcon } from "lucide-react";
import type { QuestionAnswerDetail } from "@/types/answer";

interface GradingQuestionCardProps {
  question: QuestionAnswerDetail;
  onUpdateScore: (answerId: string, score: number, type: string) => void;
}

export function GradingQuestionCard({
  question,
  onUpdateScore,
}: GradingQuestionCardProps) {
  const initialScore =
    question.essay?.participantAnswer?.score ??
    question.choice?.participantAnswer?.score ??
    question.multipleSelect?.participantAnswer?.score ??
    0;

  const [score, setScore] = useState<number>(initialScore);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const answerId =
    question.essay?.participantAnswer?.id ??
    question.choice?.participantAnswer?.id ??
    question.multipleSelect?.participantAnswer?.id;

  const type = question.type;

  useEffect(() => {
    setScore(initialScore);
  }, [initialScore]);

  useEffect(() => {
    if (answerId === undefined) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (score !== initialScore) {
        onUpdateScore(answerId, score, type);
      }
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [answerId, onUpdateScore, initialScore, score, type]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <Label className="text-lg font-bold">{question.order}</Label>
          <Label className="text-lg font-bold text-center">
            {normalizeSnakeCase(question.type)}
          </Label>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Question text */}
        <div className="border-b-2 border-b-secondary pb-4">
          <TiptapRenderer content={question.questionText} />
        </div>

        {/* Essay question */}
        {question.type === "ESSAY" && question.essay && (
          <div className="flex flex-col gap-4">
            <Label className="text-lg font-bold">Correct Answer</Label>
            <Label className="text-sm font-normal text-muted-foreground whitespace-pre-wrap">
              {question.essay.answerText}
            </Label>
            <Label className="text-lg font-bold">Participant Answer</Label>
            <Label className="text-sm font-normal text-primary whitespace-pre-wrap">
              {question.essay.participantAnswer?.answerText ||
                "No answer provided"}
            </Label>
            {question.essay.participantAnswer?.scoreExplanation && (
              <>
                <Label className="text-lg font-bold">
                  AI Score Explanation
                </Label>
                <Label className="text-sm font-normal text-muted-foreground whitespace-pre-wrap">
                  {question.essay.participantAnswer.scoreExplanation}
                </Label>
              </>
            )}
          </div>
        )}

        {/* Choice question */}
        {question.type === "CHOICE" && question.choice && (
          <div className="flex flex-col gap-4">
            <Label className="text-lg font-bold">All Choices</Label>
            <div className="flex flex-col gap-2">
              {question.choice.choices.map((choice) => (
                <ChoiceComponent key={choice.id} isCorrect={choice.isCorrect}>
                  {choice.choiceText}
                </ChoiceComponent>
              ))}
            </div>
            <Label className="text-lg font-bold">Participant Choice</Label>
            <div className="flex flex-col gap-2">
              {question.choice.choices
                .filter(
                  (choice) =>
                    choice.id ===
                    question.choice?.participantAnswer?.selectedChoiceId
                )
                .map((choice) => (
                  <ChoiceComponent key={choice.id} isCorrect={choice.isCorrect}>
                    {choice.choiceText}
                  </ChoiceComponent>
                ))}
              {!question.choice.participantAnswer?.selectedChoiceId && (
                <Label className="text-sm font-normal text-muted-foreground">
                  No answer provided
                </Label>
              )}
            </div>
          </div>
        )}

        {/* Multiple select question */}
        {question.type === "MULTIPLE_SELECT" && question.multipleSelect && (
          <div className="flex flex-col gap-4">
            <Label className="text-lg font-bold">All Choices</Label>
            <div className="flex flex-col gap-2">
              {question.multipleSelect.multipleSelectChoices.map((choice) => (
                <ChoiceComponent key={choice.id} isCorrect={choice.isCorrect}>
                  {choice.choiceText}
                </ChoiceComponent>
              ))}
            </div>
            <Label className="text-lg font-bold">Participant Choices</Label>
            <div className="flex flex-col gap-2">
              {question.multipleSelect.participantAnswer?.selectedChoices
                .length ? (
                question.multipleSelect.participantAnswer.selectedChoices.map(
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
                        <span className="grow">{choice.choiceText}</span>
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
                )
              ) : (
                <Label className="text-sm font-normal text-muted-foreground">
                  No answer provided
                </Label>
              )}
            </div>
          </div>
        )}

        {/* Score slider for grading */}
        {answerId && (
          <ScoreSlider
            value={score}
            max={question.maxScore}
            onChange={setScore}
          />
        )}
      </CardContent>
    </Card>
  );
}
