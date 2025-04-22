// src/components/QuestionCard.tsx

"use client";

import TiptapRenderer from "@/components/custom/tiptap-renderer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ChoiceQuestion,
  EssayQuestion,
  MultipleChoiceQuestion,
  QuestionType,
  RawQuestion,
} from "@/types/question";
import { useEffect, useState } from "react";
import ChoiceComponent from "@/components/custom/choice";

export function QuestionCard({ question }: { question: RawQuestion }) {
  const [currentQuestion, setCurrentQuestion] = useState<
    EssayQuestion | ChoiceQuestion | MultipleChoiceQuestion | null
  >(null);

  useEffect(() => {
    const base = {
      id: question.id,
      order: question.order,
      type: question.type,
      questionText: question.questionText,
      testId: question.testId,
      createdAt: new Date(question.createdAt),
      updatedAt: new Date(question.updatedAt),
    };

    if (question.type === QuestionType.ESSAY && question.essay) {
      setCurrentQuestion({
        ...base,
        answerText: question.essay.answerText,
        isExactAnswer: question.essay.isExactAnswer,
        maxScore: question.essay.maxScore,
      } as EssayQuestion);
    } else if (question.type === QuestionType.CHOICE && question.choice) {
      setCurrentQuestion({
        ...base,
        isChoiceRandomized: question.choice.isChoiceRandomized,
        maxScore: question.choice.maxScore,
        choices: question.choice.choices,
      } as ChoiceQuestion);
    } else if (
      question.type === QuestionType.MULTIPLE_CHOICE &&
      question.multipleChoice
    ) {
      setCurrentQuestion({
        ...base,
        isChoiceRandomized: question.multipleChoice.isChoiceRandomized,
        maxScore: question.multipleChoice.maxScore,
        choices: question.multipleChoice.multipleChoices,
      } as MultipleChoiceQuestion);
    }
  }, [question]);

  return (
    <Card className="w-full">
      {currentQuestion && (
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <Label className="text-lg font-bold">{currentQuestion.order}</Label>
            <Label className="text-lg font-bold text-center">
              {currentQuestion.type}
            </Label>
          </div>
        </CardHeader>
      )}

      <CardContent className="flex flex-col gap-4">
        {currentQuestion && (
          <div className="border-b-2 border-b-secondary">
            <TiptapRenderer content={currentQuestion.questionText} />
          </div>
        )}
        {currentQuestion?.type === QuestionType.ESSAY && (
          <div className="flex flex-col gap-4">
            <Label className="text-lg font-bold">Answer</Label>
            <Label className="text-sm font-normal text-primary">
              {currentQuestion.answerText}
            </Label>
          </div>
        )}
        {currentQuestion?.type === QuestionType.CHOICE && (
          <div className="flex flex-col gap-4">
            <Label className="text-lg font-bold">Choices</Label>
            <div className="flex flex-col gap-2">
              {currentQuestion.choices.map((choice) => (
                <ChoiceComponent key={choice.id} choice={choice} />
              ))}
            </div>
          </div>
        )}
        {currentQuestion?.type === QuestionType.MULTIPLE_CHOICE && (
          <div className="flex flex-col gap-4">
            <Label className="text-lg font-bold">Choices</Label>
            <div className="flex flex-col gap-2">
              {currentQuestion.choices.map((choice) => (
                <ChoiceComponent key={choice.id} choice={choice} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
