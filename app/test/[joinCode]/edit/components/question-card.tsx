"use client";

import TiptapRenderer from "@/components/custom/tiptap-renderer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import ChoiceComponent from "@/components/custom/choice";
import { normalizeSnakeCase } from "@/lib/text";
import type { Question } from "@/types/question";

export function QuestionCard({ question }: { question: Question }) {
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
        <div className="border-b-2 border-b-secondary">
          <TiptapRenderer content={question.questionText} />
        </div>

        {question.type === "ESSAY" && (
          <div className="flex flex-col gap-4">
            <Label className="text-lg font-bold">Answer</Label>
            <Label className="text-sm font-normal text-primary">
              {question.answerText}
            </Label>
          </div>
        )}

        {question.type === "CHOICE" && (
          <div className="flex flex-col gap-4">
            <Label className="text-lg font-bold">Choices</Label>
            <div className="flex flex-col gap-2">
              {question.choices.map((choice) => (
                <ChoiceComponent
                  key={choice.id}
                  choiceText={choice.choiceText}
                  isCorrect={choice.isCorrect}
                />
              ))}
            </div>
          </div>
        )}

        {question.type === "MULTIPLE_SELECT" && (
          <div className="flex flex-col gap-4">
            <Label className="text-lg font-bold">Choices</Label>
            <div className="flex flex-col gap-2">
              {question.choices.map((choice) => (
                <ChoiceComponent
                  key={choice.id}
                  choiceText={choice.choiceText}
                  isCorrect={choice.isCorrect}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
